/**
 * GET /api/dashboard/init
 *
 * Lädt beim Dashboard-Start:
 *  1. Aktuelle Credits des Users aus `profiles`
 *  2. Letzte 20 Gallery-Assets aus legacy `gallery_assets` (Studio-Sidebar; kann leer sein)
 *     — primäre Galerie: `/dashboard/gallery` liest aus `generations` via get-gallery.
 *
 * Kein Auth-Gating per Feature-Flag — nur reguläre Session-Auth.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GalleryItem } from "@/components/dashboard/core/GalleryGrid";

export const dynamic = "force-dynamic";

type DbAsset = {
  id: string;
  type: string;
  url: string | null;
  content: string | null;
  prompt: string;
  tool: string;
  created_at: string;
};

function dbToGalleryItem(row: DbAsset): GalleryItem {
  return {
    id:        row.id,
    type:      row.type as GalleryItem["type"],
    url:       row.url ?? undefined,
    content:   row.content ?? undefined,
    prompt:    row.prompt,
    tool:      row.tool,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  // ── Credits ────────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  const credits: number = profile?.credits ?? 0;

  // ── Gallery Assets ─────────────────────────────────────────────────────────
  const { data: rows, error: assetsError } = await supabase
    .from("gallery_assets")
    .select("id, type, url, content, prompt, tool, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (assetsError) {
    console.error("[dashboard/init] gallery_assets load:", assetsError.message);
  }

  const assets: GalleryItem[] = (rows ?? []).map((r) =>
    dbToGalleryItem(r as DbAsset)
  );

  return Response.json({ credits, assets });
}

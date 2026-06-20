/**
 * GET /api/dashboard/init
 *
 * Lädt beim Dashboard-Start:
 *  1. Aktuelle Credits des Users aus `profiles`
 *  2. Letzte 20 Assets: legacy `gallery_assets` (Studio-Sidebar), fallback `generations`
 *     — primäre Galerie: `/dashboard/gallery` liest aus `generations` via get-gallery.
 *
 * Kein Auth-Gating per Feature-Flag — nur reguläre Session-Auth.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GalleryItem } from "@/components/dashboard/core/GalleryGrid";
import { parseGenerationAssetResult } from "@/lib/generation-asset-types";
import {
  isImageGenerationType,
  isVideoGenerationType,
  resolveGenerationMediaUrls,
} from "@/lib/gallery-media";
import { galleryImageBadgeLabel } from "@/lib/gallery-generation-label";

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

function generationToGalleryItem(
  row: {
    id: string;
    type: string;
    prompt: string;
    created_at: string;
    result: unknown;
  },
  getPublicUrl: (bucket: string, path: string) => string
): GalleryItem | null {
  const asset = parseGenerationAssetResult(row.result);
  const media = resolveGenerationMediaUrls({
    type: row.type,
    prompt: row.prompt,
    generationId: row.id,
    result: row.result,
    getPublicUrl,
  });

  if (isImageGenerationType(row.type) && media.imageUrl) {
    return {
      id: row.id,
      type: "image",
      url: media.imageUrl,
      prompt: row.prompt,
      tool: galleryImageBadgeLabel(row.type, asset?.category),
      createdAt: row.created_at,
    };
  }

  if (isVideoGenerationType(row.type) && media.videoUrl) {
    return {
      id: row.id,
      type: "video",
      url: media.videoUrl,
      prompt: row.prompt,
      tool: galleryImageBadgeLabel(row.type, asset?.category),
      createdAt: row.created_at,
    };
  }

  return null;
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

  // ── Gallery Assets (legacy gallery_assets, fallback: generations SSOT) ───
  const { data: rows, error: assetsError } = await supabase
    .from("gallery_assets")
    .select("id, type, url, content, prompt, tool, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (assetsError) {
    console.error("[dashboard/init] gallery_assets load:", assetsError.message);
  }

  let assets: GalleryItem[] = (rows ?? []).map((r) =>
    dbToGalleryItem(r as DbAsset)
  );

  if (assets.length === 0) {
    const getPublicUrl = (bucket: string, path: string) => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    };

    const { data: genRows, error: genError } = await supabase
      .from("generations")
      .select("id, type, prompt, created_at, result")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (genError) {
      console.error("[dashboard/init] generations fallback:", genError.message);
    } else {
      assets = (genRows ?? [])
        .map((row) => generationToGalleryItem(row, getPublicUrl))
        .filter((item): item is GalleryItem => item !== null);
    }
  }

  return Response.json({ credits, assets });
}

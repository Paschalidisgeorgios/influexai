/**
 * POST /api/dashboard/asset
 *
 * Speichert ein generiertes Asset in `gallery_assets`.
 *
 * Zwei Modi:
 *  - skipDeduction: true  → Asset nur speichern (Credits wurden bereits von
 *                           /api/agent abgezogen — z.B. bei Text-Tools)
 *  - skipDeduction: false → Credits abziehen UND Asset speichern
 *                           (z.B. bei Medien-Tools, die noch keinen eigenen
 *                           Credit-Abzug haben)
 *
 * Response: { asset: GalleryItem, remainingCredits: number }
 *
 * DELETE /api/dashboard/asset?id=<uuid>
 * Löscht ein Asset des eingeloggten Users.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";
import type { GalleryItem } from "@/components/dashboard/core/GalleryGrid";

export const dynamic = "force-dynamic";

// ─── POST ─────────────────────────────────────────────────────────────────────

type SaveAssetBody = {
  type:           "text" | "image" | "video";
  url?:           string | null;
  content?:       string | null;
  prompt:         string;
  tool:           string;
  /** Credits to deduct. Ignored when skipDeduction = true. */
  cost?:          number;
  /** Pass true when /api/agent already deducted the credits. */
  skipDeduction?: boolean;
};

export async function POST(request: Request) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  let body: SaveAssetBody;
  try {
    body = (await request.json()) as SaveAssetBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, url, content, prompt, tool, cost = 0, skipDeduction = false } = body;

  if (!prompt || !tool || !type) {
    return Response.json({ error: "Pflichtfelder fehlen: type, prompt, tool." }, { status: 400 });
  }

  // ── Credits prüfen & abziehen (nur wenn nötig) ────────────────────────────
  let remainingCredits: number;

  if (!skipDeduction && cost > 0) {
    const { ok, credits: currentCredits } = await hasEnoughCredits(supabase, user.id, cost);
    if (!ok) {
      return Response.json(
        {
          error: `Nicht genügend Credits. Benötigt: ${cost}, Vorhanden: ${currentCredits}.`,
          remainingCredits: currentCredits,
          required: cost,
        },
        { status: 402 }
      );
    }

    const deduction = await deductCredits(
      supabase,
      user.id,
      cost,
      `dashboard_${type}_generation`,
      { generationType: tool, prompt, skipGenerationLog: false }
    );

    if (!deduction.success) {
      return Response.json(
        { error: deduction.error ?? "Credits konnten nicht abgezogen werden." },
        { status: 500 }
      );
    }
    remainingCredits = deduction.remainingCredits;
  } else {
    // Nur aktuellen Stand lesen
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();
    remainingCredits = profile?.credits ?? 0;
  }

  // ── Asset in DB speichern ──────────────────────────────────────────────────
  const { data: inserted, error: insertError } = await supabase
    .from("gallery_assets")
    .insert({
      user_id:    user.id,
      type,
      url:        url ?? null,
      content:    content ?? null,
      prompt,
      tool,
    })
    .select("id, type, url, content, prompt, tool, created_at")
    .single();

  if (insertError || !inserted) {
    console.error("[dashboard/asset] insert error:", insertError?.message);
    return Response.json(
      { error: "Asset konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }

  const asset: GalleryItem = {
    id:        inserted.id as string,
    type:      inserted.type as GalleryItem["type"],
    url:       (inserted.url as string | null) ?? undefined,
    content:   (inserted.content as string | null) ?? undefined,
    prompt:    inserted.prompt as string,
    tool:      inserted.tool as string,
    createdAt: inserted.created_at as string,
  };

  return Response.json({ asset, remainingCredits });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Asset-ID fehlt." }, { status: 400 });
  }

  const { error } = await supabase
    .from("gallery_assets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // Row-Level-Security zusätzlich serverseitig erzwingen

  if (error) {
    console.error("[dashboard/asset] delete error:", error.message);
    return Response.json({ error: "Löschen fehlgeschlagen." }, { status: 500 });
  }

  return Response.json({ ok: true });
}

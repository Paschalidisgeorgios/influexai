import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { assertKiToolAccess } from "@/lib/access.server";
import { addCredits, deductCredits } from "@/lib/credits";
import {
  createGenerationRecord,
  ingestFinalAssetFromUrl,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { invalidateUserGenerations } from "@/lib/cache";
import { isAkoolConfigured } from "@/lib/akool-env";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

export type AkoolJobPollType =
  | "image2video"
  | "text2video"
  | "translation"
  | "lipsync"
  | "characterSwap"
  | "videoEditor"
  | "ecommerceAds";

export async function requireAkoolAccess(creditCost: number) {
  if (!isAkoolConfigured()) {
    return NextResponse.json(
      { error: "Dienst ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }
  const access = await assertKiToolAccess(creditCost);
  if (access instanceof NextResponse) return access;
  return access;
}

export async function deductAkoolToolCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  label: string,
  generationType: string,
  prompt: string
) {
  return deductCredits(supabase, userId, amount, label, {
    generationType,
    prompt: prompt.slice(0, 500),
    skipGenerationLog: true,
  });
}

export async function refundAkoolToolCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  label: string
) {
  if (amount <= 0) return false;
  const result = await addCredits(supabase, userId, amount, `${label} — Erstattung`);
  return result.success;
}

export async function createPendingAkoolGeneration(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  jobId: string,
  creditsUsed: number,
  prompt: string,
  model?: string,
  assetKind: "video" | "audio" | "image" = "video"
) {
  return createGenerationRecord(
    supabase,
    userId,
    type,
    {
      paid: true,
      downloadPaid: true,
      assetKind,
      mode: "final",
      model,
      jobId,
    },
    creditsUsed,
    prompt.slice(0, 500)
  );
}

export async function finalizeAkoolGenerationAsset(
  supabase: SupabaseClient,
  userId: string,
  generationId: string,
  resultUrl: string,
  assetKind: "video" | "audio" | "image"
) {
  const { path: finalPath } = await ingestFinalAssetFromUrl(
    userId,
    generationId,
    resultUrl,
    assetKind
  );
  await updateGenerationResult(supabase, generationId, userId, { finalPath });
  await invalidateUserGenerations(userId);
  if (assetKind === "audio") return `/api/generated-audio/${generationId}`;
  if (assetKind === "image") return `/api/generated-image/${generationId}?variant=final`;
  return `/api/generated-video/${generationId}`;
}

export async function getAkoolGenerationByJobId(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  type?: string
) {
  let query = supabase
    .from("generations")
    .select("id, result, credits_used, prompt, type")
    .eq("user_id", userId)
    .filter("result->>jobId", "eq", jobId);

  if (type) query = query.eq("type", type);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data;
}

export function akoolRouteError(error: unknown, fallback = "Anfrage fehlgeschlagen") {
  return sanitizeUserMessage(error instanceof Error ? error.message : fallback);
}

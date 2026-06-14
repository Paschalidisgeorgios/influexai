import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ingestFinalAssetFromUrl,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { parseGenerationAssetResult } from "@/lib/generation-asset-types";
import { invalidateUserGenerations } from "@/lib/cache";

export function protectedVideoUrl(generationId: string): string {
  return `/api/generated-video/${generationId}`;
}

export async function finalizeGenerationVideoFromUrl(
  supabase: SupabaseClient,
  userId: string,
  generationId: string,
  result: Record<string, unknown> | null,
  sourceUrl: string
): Promise<string> {
  const asset = parseGenerationAssetResult(result);
  if (asset?.finalPath) {
    return protectedVideoUrl(generationId);
  }

  const { path: finalPath } = await ingestFinalAssetFromUrl(
    userId,
    generationId,
    sourceUrl,
    "video"
  );
  await updateGenerationResult(supabase, generationId, userId, { finalPath });
  await invalidateUserGenerations(userId);
  return protectedVideoUrl(generationId);
}

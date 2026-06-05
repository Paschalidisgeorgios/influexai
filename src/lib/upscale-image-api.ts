import type { SupabaseClient } from "@supabase/supabase-js";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { configureFalClient, getFalKey, parseFalError } from "@/lib/fal-image";
import {
  GENERATED_ASSETS_BUCKET,
  getOwnedGeneration,
  ingestUpscaledFromUrl,
  sourceStoragePath,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { upscaleGeneratorImage } from "@/lib/image-generator-fal";

configureFalClient();

function protectedImageUrl(generationId: string, variant: string) {
  return `/api/generated-image/${generationId}?variant=${variant}`;
}

export type UpscaleImageSuccess = {
  generationId: string;
  originalUrl: string;
  upscaledUrl: string;
  creditsUsed: number;
  creditsLeft?: number;
};

export type UpscaleImageFailure = {
  status: number;
  error: string;
};

export async function runImageUpscale(
  supabase: SupabaseClient,
  userId: string,
  generationId: string
): Promise<
  | { ok: true; data: UpscaleImageSuccess }
  | { ok: false; failure: UpscaleImageFailure }
> {
  if (!getFalKey()) {
    return {
      ok: false,
      failure: { status: 503, error: "Upscaler ist nicht konfiguriert." },
    };
  }

  const row = await getOwnedGeneration(supabase, generationId, userId);
  if (!row?.asset?.sourcePath) {
    return {
      ok: false,
      failure: { status: 404, error: "Generierung nicht gefunden" },
    };
  }

  if (row.asset.upscaledPath) {
    return {
      ok: true,
      data: {
        generationId,
        originalUrl: protectedImageUrl(generationId, "source"),
        upscaledUrl: protectedImageUrl(generationId, "upscaled"),
        creditsUsed: 0,
      },
    };
  }

  const creditCost = IMAGE_GEN_CREDITS.upscale;
  const creditCheck = await hasEnoughCredits(supabase, userId, creditCost);
  if (!creditCheck.ok) {
    return {
      ok: false,
      failure: { status: 402, error: "Nicht genug Credits" },
    };
  }

  try {
    const service = createServiceSupabaseClient();
    const { data: signed } = await service.storage
      .from(GENERATED_ASSETS_BUCKET)
      .createSignedUrl(sourceStoragePath(userId, generationId), 300);

    if (!signed?.signedUrl) {
      throw new Error("Quellbild nicht lesbar");
    }

    const upscaledFalUrl = await upscaleGeneratorImage(signed.signedUrl);
    const upscaledPath = await ingestUpscaledFromUrl(
      userId,
      generationId,
      upscaledFalUrl
    );

    const deduction = await deductCredits(
      supabase,
      userId,
      creditCost,
      "Bild Generator — Upscale 2x",
      {
        generationType: "image",
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      return {
        ok: false,
        failure: {
          status: 402,
          error: deduction.error ?? "Nicht genug Credits",
        },
      };
    }

    await updateGenerationResult(supabase, generationId, userId, {
      upscaledPath,
      credits_used: (row.credits_used ?? 0) + creditCost,
    });

    return {
      ok: true,
      data: {
        generationId,
        originalUrl: protectedImageUrl(generationId, "source"),
        upscaledUrl: protectedImageUrl(generationId, "upscaled"),
        creditsUsed: creditCost,
        creditsLeft: deduction.remainingCredits,
      },
    };
  } catch (error: unknown) {
    console.error("upscale-image error:", error);
    return {
      ok: false,
      failure: { status: 500, error: parseFalError(error) },
    };
  }
}

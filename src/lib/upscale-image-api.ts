import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import {
  configureFalClient,
  getFalKey,
  parseFalError,
  uploadDataUrlToFal,
} from "@/lib/fal-image";
import {
  createGenerationRecord,
  GENERATED_ASSETS_BUCKET,
  getOwnedGeneration,
  ingestImageGeneratorAssets,
  ingestUpscaledFromUrl,
  sourceStoragePath,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { upscaleGeneratorImage } from "@/lib/image-generator-fal";

configureFalClient();

const MAX_UPLOAD_DATA_URL_LENGTH = 15_000_000;

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

async function ingestUploadedImageForUpscale(
  supabase: SupabaseClient,
  userId: string,
  imageDataUrl: string
): Promise<
  | { ok: true; generationId: string }
  | { ok: false; failure: UpscaleImageFailure }
> {
  const trimmed = imageDataUrl.trim();
  if (!trimmed.startsWith("data:image/")) {
    return {
      ok: false,
      failure: { status: 400, error: "Ungültiges Bildformat." },
    };
  }

  if (trimmed.length > MAX_UPLOAD_DATA_URL_LENGTH) {
    return {
      ok: false,
      failure: { status: 400, error: "Bild ist zu groß (max. 10 MB)." },
    };
  }

  try {
    const falUrl = await uploadDataUrlToFal(trimmed);
    const generationId = randomUUID();

    await createGenerationRecord(
      supabase,
      userId,
      "image",
      { paid: false },
      0,
      "HD Upscaler — Upload",
      generationId
    );

    const { previewPath, sourcePath, width, height } =
      await ingestImageGeneratorAssets(userId, generationId, falUrl);

    await updateGenerationResult(supabase, generationId, userId, {
      previewPath,
      sourcePath,
      width,
      height,
    });

    return { ok: true, generationId };
  } catch (error: unknown) {
    console.error("upscale upload ingest error:", error);
    return {
      ok: false,
      failure: { status: 500, error: parseFalError(error) },
    };
  }
}

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

  try {
    const deductionResult = await withCreditDeduction(
      {
        supabase,
        userId,
        amount: creditCost,
        description: "Bild Generator — Upscale 2x",
        generationType: "image",
        skipGenerationLog: true,
      },
      async () => {
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

        await updateGenerationResult(supabase, generationId, userId, {
          upscaledPath,
          credits_used: (row.credits_used ?? 0) + creditCost,
        });

        return {
          generationId,
          originalUrl: protectedImageUrl(generationId, "source"),
          upscaledUrl: protectedImageUrl(generationId, "upscaled"),
          creditsUsed: creditCost,
        };
      }
    );

    if (!deductionResult.ok) {
      return {
        ok: false,
        failure: {
          status: deductionResult.status,
          error: deductionResult.error,
        },
      };
    }

    return {
      ok: true,
      data: {
        ...deductionResult.data,
        creditsLeft: deductionResult.remainingCredits,
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

export async function runImageUpscaleRequest(
  supabase: SupabaseClient,
  userId: string,
  input: { generationId?: string; imageDataUrl?: string }
): Promise<
  | { ok: true; data: UpscaleImageSuccess }
  | { ok: false; failure: UpscaleImageFailure }
> {
  let generationId = input.generationId?.trim() ?? "";

  if (input.imageDataUrl?.trim()) {
    const ingested = await ingestUploadedImageForUpscale(
      supabase,
      userId,
      input.imageDataUrl
    );
    if (!ingested.ok) {
      return ingested;
    }
    generationId = ingested.generationId;
  }

  if (!generationId) {
    return {
      ok: false,
      failure: { status: 400, error: "Kein Bild ausgewählt." },
    };
  }

  return runImageUpscale(supabase, userId, generationId);
}

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  IMAGE_CATEGORY_KEYS,
  type FalImageSize,
  type ImageCategoryKey,
  VALID_FAL_IMAGE_SIZES,
} from "@/lib/generation-config";
import { configureFalClient, getFalKey, parseFalError } from "@/lib/fal-image";
import {
  createGenerationRecord,
  ingestImageGeneratorAssets,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { generateCategoryImage } from "@/lib/image-generator-fal";
import { prepareImageGeneratorPrompts } from "@/lib/image-generator-prompt-pipeline";
import {
  getPlatformImageDimensions,
  platformToFalImageSize,
  resolveImagePlatformId,
  resolveImageStyleId,
  type ImagePlatformId,
  type ImageStyleId,
} from "@/lib/ai/imageStylePresets";
import { invalidateUserGenerations } from "@/lib/cache";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";

export type ImageGeneratorRunResult =
  | {
      ok: true;
      imageUrl: string;
      generationId: string;
      creditsUsed: number;
      creditsLeft: number;
      width?: number;
      height?: number;
    }
  | { ok: false; error: string };

function protectedImageUrl(generationId: string, variant = "preview") {
  return `/api/generated-image/${generationId}?variant=${variant}`;
}

function isValidCategory(c: string): c is ImageCategoryKey {
  return (IMAGE_CATEGORY_KEYS as string[]).includes(c);
}

export async function runImageGeneratorGeneration(
  supabase: SupabaseClient,
  userId: string,
  params: {
    prompt: string;
    category?: string;
    aspectRatio?: FalImageSize;
    highRes?: boolean;
    /** Skip pipeline when agent already enhanced the prompt. */
    preEnhanced?: {
      enhancedPrompt: string;
      negativePrompt: string;
      category?: ImageCategoryKey;
      styleId?: ImageStyleId;
      platform?: ImagePlatformId;
    };
    styleId?: ImageStyleId;
    platform?: ImagePlatformId;
  }
): Promise<ImageGeneratorRunResult> {
  const trimmedPrompt = params.prompt.trim();
  const category: ImageCategoryKey = isValidCategory(params.category ?? "")
    ? (params.category as ImageCategoryKey)
    : "creator";
  const styleId = resolveImageStyleId(
    params.preEnhanced?.styleId ?? params.styleId
  );
  const platform = resolveImagePlatformId(
    params.preEnhanced?.platform ?? params.platform
  );
  const imageDimensions = getPlatformImageDimensions(platform);
  const imageSize = VALID_FAL_IMAGE_SIZES.includes(
    params.aspectRatio as FalImageSize
  )
    ? (params.aspectRatio as FalImageSize)
    : platformToFalImageSize(platform);
  const highRes = params.highRes === true;
  const creditCost = highRes
    ? IMAGE_GEN_CREDITS.highRes
    : IMAGE_GEN_CREDITS.standard;

  if (!trimmedPrompt) {
    return { ok: false, error: "Prompt erforderlich." };
  }

  configureFalClient();
  if (!getFalKey()) {
    return { ok: false, error: "Bildgenerierung ist nicht konfiguriert." };
  }

  const creditCheck = await hasEnoughCredits(supabase, userId, creditCost);
  if (!creditCheck.ok) {
    return { ok: false, error: "Nicht genug Credits." };
  }

  const started = Date.now();

  try {
    const prepared = params.preEnhanced
      ? {
          userPrompt: trimmedPrompt,
          enhancedPrompt: params.preEnhanced.enhancedPrompt,
          negativePrompt: params.preEnhanced.negativePrompt,
          category: params.preEnhanced.category ?? category,
          promptEnhanced: true,
          styleId,
          platform,
        }
      : await prepareImageGeneratorPrompts(trimmedPrompt, category, {
          styleId,
          platform,
        });

    const falResult = await generateCategoryImage({
      prompt: prepared.enhancedPrompt,
      falPrompt: prepared.enhancedPrompt,
      negativePrompt: prepared.negativePrompt,
      category: prepared.category,
      imageSize,
      imageDimensions,
      highRes,
    });

    const generationId = await createGenerationRecord(
      supabase,
      userId,
      "image",
      {
        paid: false,
        downloadPaid: false,
        mode: "preview",
        assetKind: "image",
        category: prepared.category,
        model: falResult.model,
        width: falResult.width,
        height: falResult.height,
        generationTimeMs: Date.now() - started,
        highRes,
      },
      0,
      prepared.userPrompt.slice(0, 500)
    );

    const { previewPath, sourcePath, width, height } =
      await ingestImageGeneratorAssets(userId, generationId, falResult.url);

    await updateGenerationResult(supabase, generationId, userId, {
      previewPath,
      sourcePath,
      width: width ?? falResult.width,
      height: height ?? falResult.height,
      credits_used: creditCost,
    });

    const deduction = await deductCredits(
      supabase,
      userId,
      creditCost,
      highRes ? "Bild Generator — High-Res" : "Bild Generator — Standard",
      {
        generationType: "image",
        prompt: prepared.userPrompt.slice(0, 500),
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      return {
        ok: false,
        error: deduction.error ?? "Credit-Abzug fehlgeschlagen.",
      };
    }

    await invalidateUserGenerations(userId);

    return {
      ok: true,
      generationId,
      imageUrl: protectedImageUrl(generationId, "preview"),
      creditsUsed: creditCost,
      creditsLeft: deduction.remainingCredits ?? 0,
      width: width ?? falResult.width,
      height: height ?? falResult.height,
    };
  } catch (error) {
    console.error("image-generator-run:", error);
    return {
      ok: false,
      error: parseFalError(error),
    };
  }
}

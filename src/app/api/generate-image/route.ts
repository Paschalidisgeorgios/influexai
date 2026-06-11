import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { assertKiToolAccess } from "@/lib/access.server";
import { addCredits, deductCredits, isCreditExemptUser } from "@/lib/credits";
import {
  CATEGORY_PROMPTS,
  IMAGE_CATEGORY_KEYS,
  type FalImageSize,
  type ImageCategoryKey,
  VALID_FAL_IMAGE_SIZES,
} from "@/lib/generation-config";
import {
  configureFalClient,
  getFalKey,
  logFalAiError,
} from "@/lib/fal-image";
import {
  createGenerationRecord,
  getOwnedGeneration,
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

export const dynamic = "force-dynamic";

configureFalClient();

function protectedImageUrl(generationId: string, variant = "preview") {
  return `/api/generated-image/${generationId}?variant=${variant}`;
}

function isValidCategory(c: string): c is ImageCategoryKey {
  return (IMAGE_CATEGORY_KEYS as string[]).includes(c);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    prompt,
    category: categoryRaw,
    aspectRatio,
    highRes: highResRaw,
    seed: seedRaw,
    variation: variationRaw,
    parentGenerationId,
    falPrompt,
    negativePrompt: negativePromptRaw,
    skipPromptEnhancement,
    styleId: styleIdRaw,
    platform: platformRaw,
  } = body as {
    prompt?: string;
    category?: string;
    aspectRatio?: FalImageSize;
    highRes?: boolean;
    seed?: number;
    variation?: boolean;
    parentGenerationId?: string;
    falPrompt?: string;
    negativePrompt?: string;
    skipPromptEnhancement?: boolean;
    styleId?: ImageStyleId;
    platform?: ImagePlatformId;
  };

  const trimmedPrompt = prompt?.trim() ?? "";
  const category: ImageCategoryKey = isValidCategory(categoryRaw ?? "")
    ? (categoryRaw as ImageCategoryKey)
    : "creator";
  const styleId = resolveImageStyleId(styleIdRaw);
  const platform = resolveImagePlatformId(platformRaw);
  const imageDimensions = getPlatformImageDimensions(platform);
  const imageSize = VALID_FAL_IMAGE_SIZES.includes(aspectRatio as FalImageSize)
    ? (aspectRatio as FalImageSize)
    : platformToFalImageSize(platform);
  const highRes = highResRaw === true;
  const isVariation = variationRaw === true;
  const creditCost = isVariation
    ? IMAGE_GEN_CREDITS.variation
    : highRes
      ? IMAGE_GEN_CREDITS.highRes
      : IMAGE_GEN_CREDITS.standard;

  if (!trimmedPrompt) {
    return NextResponse.json(
      { error: "Bitte gib eine Beschreibung ein." },
      { status: 400 }
    );
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Bildgenerierung ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  const access = await assertKiToolAccess(creditCost);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const seed =
    typeof seedRaw === "number"
      ? seedRaw
      : isVariation
        ? Math.floor(Math.random() * 999999)
        : undefined;

  const started = Date.now();

  let prepared;
  try {
    prepared =
      skipPromptEnhancement === true &&
      typeof falPrompt === "string" &&
      falPrompt.trim()
        ? {
            userPrompt: trimmedPrompt,
            enhancedPrompt: falPrompt.trim(),
            negativePrompt:
              typeof negativePromptRaw === "string" && negativePromptRaw.trim()
                ? negativePromptRaw.trim()
                : "deformed, extra limbs, duplicate objects, text, watermark, low quality",
            category,
            promptEnhanced: true,
            styleId,
            platform,
          }
        : await prepareImageGeneratorPrompts(trimmedPrompt, category, {
            styleId,
            platform,
          });
  } catch (error: unknown) {
    logFalAiError(error);
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message ?? "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }

  const creditAction = isVariation
    ? "Bild Generator — Variation"
    : highRes
      ? "Bild Generator — High-Res"
      : "Bild Generator — Standard";

  const deduction = await deductCredits(
    supabase,
    userId,
    creditCost,
    creditAction,
    {
      generationType: "image",
      prompt: prepared.userPrompt.slice(0, 500),
      skipGenerationLog: true,
    }
  );

  if (!deduction.success) {
    return NextResponse.json(
      { error: deduction.error ?? "Nicht genug Credits" },
      { status: 402 }
    );
  }

  try {
    const falResult = await generateCategoryImage({
      prompt: prepared.enhancedPrompt,
      falPrompt: prepared.enhancedPrompt,
      negativePrompt: prepared.negativePrompt,
      category: prepared.category,
      imageSize,
      imageDimensions,
      highRes,
      seed,
    });

    const generationId = randomUUID();
    const { previewPath, sourcePath, width, height } =
      await ingestImageGeneratorAssets(userId, generationId, falResult.url);

    await createGenerationRecord(
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
        width: width ?? falResult.width,
        height: height ?? falResult.height,
        generationTimeMs: Date.now() - started,
        seed,
        highRes,
        parentGenerationId: isVariation ? parentGenerationId : undefined,
        previewPath,
        sourcePath,
      },
      0,
      prepared.userPrompt.slice(0, 500),
      generationId
    );

    await updateGenerationResult(supabase, generationId, userId, {
      credits_used: creditCost,
    });

    const response: Record<string, unknown> = {
      success: true,
      generationId,
      imageUrl: protectedImageUrl(generationId, "preview"),
      locked: true,
      downloadPaid: false,
      creditsUsed: creditCost,
      creditsLeft: deduction.remainingCredits,
      category: prepared.category,
      categoryLabel: CATEGORY_PROMPTS[prepared.category].label,
      resolvedCategory: prepared.category,
      promptEnhanced: prepared.promptEnhanced,
      styleId: prepared.styleId,
      platform: prepared.platform,
      ...(prepared.promptEnhanced
        ? { enhancedPrompt: prepared.enhancedPrompt }
        : {}),
      model: falResult.model,
      width: width ?? falResult.width,
      height: height ?? falResult.height,
      generationTimeMs: Date.now() - started,
      seed,
      highRes,
    };

    if (isVariation && parentGenerationId) {
      const parent = await getOwnedGeneration(
        supabase,
        parentGenerationId,
        userId
      );
      if (parent?.asset?.previewPath) {
        response.parentImageUrl = protectedImageUrl(parentGenerationId, "preview");
        response.parentGenerationId = parentGenerationId;
      }
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (!(await isCreditExemptUser(supabase, userId))) {
      await addCredits(
        supabase,
        userId,
        creditCost,
        `${creditAction} — Refund`
      );
    }
    logFalAiError(error);
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message ?? "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }
}

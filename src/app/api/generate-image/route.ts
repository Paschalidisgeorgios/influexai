import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
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
  parseFalError,
} from "@/lib/fal-image";
import {
  createGenerationRecord,
  getOwnedGeneration,
  ingestImageGeneratorAssets,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { generateCategoryImage } from "@/lib/image-generator-fal";

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
  } = body as {
    prompt?: string;
    category?: string;
    aspectRatio?: FalImageSize;
    highRes?: boolean;
    seed?: number;
    variation?: boolean;
    parentGenerationId?: string;
  };

  const trimmedPrompt = prompt?.trim() ?? "";
  const category: ImageCategoryKey = isValidCategory(categoryRaw ?? "")
    ? (categoryRaw as ImageCategoryKey)
    : "creator";
  const imageSize = VALID_FAL_IMAGE_SIZES.includes(aspectRatio as FalImageSize)
    ? (aspectRatio as FalImageSize)
    : "landscape_16_9";
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

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const creditCheck = await hasEnoughCredits(supabase, user.id, creditCost);
  if (!creditCheck.ok) {
    return NextResponse.json(
      { error: "Nicht genug Credits" },
      { status: 402 }
    );
  }

  const seed =
    typeof seedRaw === "number"
      ? seedRaw
      : isVariation
        ? Math.floor(Math.random() * 999999)
        : undefined;

  const started = Date.now();

  try {
    const falResult = await generateCategoryImage({
      prompt: trimmedPrompt,
      category,
      imageSize,
      highRes,
      seed,
    });

    const deduction = await deductCredits(
      supabase,
      user.id,
      creditCost,
      isVariation
        ? "Bild Generator — Variation"
        : highRes
          ? "Bild Generator — High-Res"
          : "Bild Generator — Standard",
      {
        generationType: "image",
        prompt: trimmedPrompt.slice(0, 500),
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Nicht genug Credits" },
        { status: 402 }
      );
    }

    const generationId = await createGenerationRecord(
      supabase,
      user.id,
      "image",
      {
        paid: false,
        downloadPaid: false,
        mode: "preview",
        assetKind: "image",
        category,
        model: falResult.model,
        width: falResult.width,
        height: falResult.height,
        generationTimeMs: Date.now() - started,
        seed,
        highRes,
        parentGenerationId: isVariation ? parentGenerationId : undefined,
      },
      creditCost,
      trimmedPrompt.slice(0, 500)
    );

    const { previewPath, sourcePath, width, height } =
      await ingestImageGeneratorAssets(user.id, generationId, falResult.url);

    await updateGenerationResult(supabase, generationId, user.id, {
      previewPath,
      sourcePath,
      width: width ?? falResult.width,
      height: height ?? falResult.height,
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
      category,
      categoryLabel: CATEGORY_PROMPTS[category].label,
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
        user.id
      );
      if (parent?.asset?.previewPath) {
        response.parentImageUrl = protectedImageUrl(parentGenerationId, "preview");
        response.parentGenerationId = parentGenerationId;
      }
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("generate-image error:", error);
    return NextResponse.json(
      { success: false, error: parseFalError(error) },
      { status: 500 }
    );
  }
}

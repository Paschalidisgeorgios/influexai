import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { assertKiToolAccess } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";
import { generateCharacterImage } from "@/lib/character-image-fal";
import { resolveReferenceImageUrls } from "@/lib/character-reference-images";
import { configureFalClient, getFalKey, logFalAiError } from "@/lib/fal-image";
import {
  createGenerationRecord,
  ingestImageGeneratorAssets,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import {
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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    referenceImageIds: referenceImageIdsRaw,
    prompt,
    styleId: styleIdRaw,
    platform: platformRaw,
  } = body as {
    referenceImageIds?: string[];
    prompt?: string;
    styleId?: ImageStyleId;
    platform?: ImagePlatformId;
  };

  const trimmedPrompt = prompt?.trim() ?? "";
  const referenceImageIds = Array.isArray(referenceImageIdsRaw)
    ? referenceImageIdsRaw.map(String)
    : [];
  const styleId = resolveImageStyleId(styleIdRaw);
  const platform = resolveImagePlatformId(platformRaw);
  const creditCost = IMAGE_GEN_CREDITS.standard;

  if (!trimmedPrompt) {
    return NextResponse.json(
      { error: "Bitte gib eine Szenenbeschreibung ein." },
      { status: 400 }
    );
  }

  if (referenceImageIds.length === 0) {
    return NextResponse.json(
      { error: "Mindestens ein Referenzbild aus der Gallery wählen." },
      { status: 400 }
    );
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Charakter-Generierung ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  const access = await assertKiToolAccess(creditCost);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const started = Date.now();

  try {
    const referenceImageUrls = await resolveReferenceImageUrls(
      supabase,
      userId,
      referenceImageIds
    );

    const falResult = await generateCharacterImage({
      referenceImageUrls,
      userPrompt: trimmedPrompt,
      styleId,
      platform,
    });

    if (!falResult.ok) {
      return NextResponse.json(
        { success: false, error: falResult.error },
        { status: 500 }
      );
    }

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
        category: "portrait",
        model: falResult.model,
        width: width ?? falResult.width,
        height: height ?? falResult.height,
        generationTimeMs: Date.now() - started,
        previewPath,
        sourcePath,
        source: "character",
        referenceGenerationIds: referenceImageIds,
      },
      0,
      trimmedPrompt.slice(0, 500),
      generationId
    );

    await updateGenerationResult(supabase, generationId, userId, {
      credits_used: creditCost,
    });

    const deduction = await deductCredits(
      supabase,
      userId,
      creditCost,
      "Bild Generator — Charakter-Modus",
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

    return NextResponse.json({
      success: true,
      generationId,
      imageUrl: protectedImageUrl(generationId, "preview"),
      locked: true,
      downloadPaid: false,
      creditsUsed: creditCost,
      creditsLeft: deduction.remainingCredits,
      styleId: falResult.styleId,
      platform: falResult.platform,
      enhancedPrompt: falResult.enhancedPrompt,
      referenceCount: falResult.referenceCount,
      model: falResult.model,
      width: width ?? falResult.width,
      height: height ?? falResult.height,
      generationTimeMs: Date.now() - started,
      source: "character",
    });
  } catch (error: unknown) {
    logFalAiError(error);
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message ?? "Charakter-Generierung fehlgeschlagen.",
      },
      { status: 500 }
    );
  }
}

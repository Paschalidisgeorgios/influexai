import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

export async function POST(request: NextRequest) {
  const { generationId } = (await request.json()) as { generationId?: string };

  if (!generationId) {
    return NextResponse.json({ error: "generationId fehlt" }, { status: 400 });
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Upscaler ist nicht konfiguriert." },
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

  const row = await getOwnedGeneration(supabase, generationId, user.id);
  if (!row?.asset?.sourcePath) {
    return NextResponse.json({ error: "Generierung nicht gefunden" }, { status: 404 });
  }

  if (row.asset.upscaledPath) {
    return NextResponse.json({
      success: true,
      generationId,
      originalUrl: protectedImageUrl(generationId, "source"),
      upscaledUrl: protectedImageUrl(generationId, "upscaled"),
      creditsUsed: 0,
    });
  }

  const creditCost = IMAGE_GEN_CREDITS.upscale;
  const creditCheck = await hasEnoughCredits(supabase, user.id, creditCost);
  if (!creditCheck.ok) {
    return NextResponse.json({ error: "Nicht genug Credits" }, { status: 402 });
  }

  try {
    const service = createServiceSupabaseClient();
    const { data: signed } = await service.storage
      .from(GENERATED_ASSETS_BUCKET)
      .createSignedUrl(sourceStoragePath(user.id, generationId), 300);

    if (!signed?.signedUrl) {
      throw new Error("Quellbild nicht lesbar");
    }

    const upscaledFalUrl = await upscaleGeneratorImage(signed.signedUrl);
    const upscaledPath = await ingestUpscaledFromUrl(
      user.id,
      generationId,
      upscaledFalUrl
    );

    const deduction = await deductCredits(
      supabase,
      user.id,
      creditCost,
      "Bild Generator — Upscale 2x",
      {
        generationType: "image",
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Nicht genug Credits" },
        { status: 402 }
      );
    }

    await updateGenerationResult(supabase, generationId, user.id, {
      upscaledPath,
      credits_used: (row.credits_used ?? 0) + creditCost,
    });

    return NextResponse.json({
      success: true,
      generationId,
      originalUrl: protectedImageUrl(generationId, "source"),
      upscaledUrl: protectedImageUrl(generationId, "upscaled"),
      creditsUsed: creditCost,
      creditsLeft: deduction.remainingCredits,
    });
  } catch (error: unknown) {
    console.error("upscale-image error:", error);
    return NextResponse.json(
      { error: parseFalError(error) },
      { status: 500 }
    );
  }
}

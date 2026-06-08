import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import {
  configureFalClient,
  generateKiIchPortrait,
  getFalKey,
  parseFalError,
  uploadDataUrlToFal,
  type FalImageMode,
} from "@/lib/fal-image";
import { assertGatedFeature } from "@/lib/access.server";
import {
  createGenerationRecord,
  ingestFinalImageFromUrl,
  ingestPreviewFromUrl,
  updateGenerationResult,
  getOwnedGeneration,
} from "@/lib/generation-assets";
import { FAL_CREDITS } from "@/lib/fal-credits";

export const dynamic = "force-dynamic";

const CREDIT_COST = FAL_CREDITS.fluxPulid;

configureFalClient();

function protectedImageUrl(generationId: string, variant: "preview" | "final") {
  return `/api/generated-image/${generationId}?variant=${variant}`;
}

export async function POST(request: NextRequest) {
  const denied = await assertGatedFeature("ki-ich");
  if (denied) return denied;

  const body = await request.json();
  const {
    imageUrl,
    scene,
    mode: modeRaw,
    generationId: existingGenerationId,
    consentAccepted,
  } = body as {
    imageUrl?: string;
    scene?: string;
    mode?: FalImageMode;
    generationId?: string;
    consentAccepted?: boolean;
  };

  const mode: FalImageMode = modeRaw === "preview" ? "preview" : "final";

  if (!imageUrl || !scene) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  if (consentAccepted !== true) {
    return NextResponse.json(
      {
        error:
          "Bitte bestätige die Einwilligung zur Nutzung deines Bildes, bevor die KI-Verarbeitung startet.",
        code: "CONSENT_REQUIRED",
      },
      { status: 400 }
    );
  }

  if (!getFalKey()) {
    console.error("ki-ich: FAL_API_KEY / FAL_KEY not set");
    return NextResponse.json(
      { error: "Bildgenerierung ist nicht konfiguriert (API Key fehlt)." },
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

  if (mode === "final") {
    const creditCheck = await hasEnoughCredits(supabase, user.id, CREDIT_COST);
    if (!creditCheck.ok) {
      return NextResponse.json(
        { error: "Nicht genug Credits" },
        { status: 402 }
      );
    }
  }

  try {
    const uploadedUrl = await uploadDataUrlToFal(imageUrl);
    const falOutputUrl = await generateKiIchPortrait(uploadedUrl, scene, mode);

    if (mode === "preview") {
      const generationId = await createGenerationRecord(
        supabase,
        user.id,
        "ki-ich",
        {
          scene,
          paid: false,
          mode: "preview",
          assetKind: "image",
        },
        0,
        scene.slice(0, 500)
      );

      const previewPath = await ingestPreviewFromUrl(
        user.id,
        generationId,
        falOutputUrl
      );

      await updateGenerationResult(supabase, generationId, user.id, {
        previewPath,
      });

      return NextResponse.json({
        success: true,
        generationId,
        imageUrl: protectedImageUrl(generationId, "preview"),
        mode: "preview",
        creditsUsed: 0,
        locked: true,
      });
    }

    let generationId = existingGenerationId;

    if (generationId) {
      const existing = await getOwnedGeneration(supabase, generationId, user.id);
      if (!existing) {
        return NextResponse.json({ error: "Generierung nicht gefunden" }, { status: 404 });
      }
    } else {
      generationId = await createGenerationRecord(
        supabase,
        user.id,
        "ki-ich",
        { scene, paid: false, mode: "preview", assetKind: "image" },
        0,
        scene.slice(0, 500)
      );
    }

    const deduction = await deductCredits(
      supabase,
      user.id,
      CREDIT_COST,
      "Mein KI-Ich – Bildgenerierung",
      {
        generationType: "ki-ich",
        prompt: scene.slice(0, 500),
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Nicht genug Credits" },
        { status: 402 }
      );
    }

    const finalPath = await ingestFinalImageFromUrl(
      user.id,
      generationId,
      falOutputUrl
    );

    await updateGenerationResult(supabase, generationId, user.id, {
      scene,
      paid: true,
      mode: "final",
      finalPath,
      assetKind: "image",
      mimeType: "image/jpeg",
      credits_used: CREDIT_COST,
    });

    return NextResponse.json({
      success: true,
      generationId,
      imageUrl: protectedImageUrl(generationId, "final"),
      mode: "final",
      creditsUsed: CREDIT_COST,
      creditsLeft: deduction.remainingCredits,
      locked: false,
    });
  } catch (error: unknown) {
    const bodyDetail =
      error && typeof error === "object" && "body" in error
        ? (error as { body?: unknown }).body
        : undefined;
    console.error("ki-ich fal error:", JSON.stringify(bodyDetail ?? error));

    return NextResponse.json(
      { success: false, error: parseFalError(error) },
      { status: 500 }
    );
  }
}

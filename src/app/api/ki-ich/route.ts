import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import {
  configureFalClient,
  generateKiIchPortrait,
  getFalKey,
  parseFalError,
  uploadDataUrlToFal,
  type FalImageMode,
} from "@/lib/fal-image";
import { assertGatedFeature } from "@/lib/access.server";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";
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
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

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
  const trimmedScene = scene?.trim() ?? "";

  if (!imageUrl || !trimmedScene) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  if (trimmedScene.length > 500) {
    return NextResponse.json(
      { error: "Szene zu lang (max. 500 Zeichen)." },
      { status: 400 }
    );
  }

  try {
    checkAgentInputSafety(trimmedScene);
  } catch (err) {
    if (err instanceof AgentSafetyError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
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

  if (mode === "preview") {
    try {
      const uploadedUrl = await uploadDataUrlToFal(imageUrl);
      const falOutputUrl = await generateKiIchPortrait(
        uploadedUrl,
        trimmedScene,
        "preview"
      );

      const generationId = await createGenerationRecord(
        supabase,
        user.id,
        "ki-ich",
        {
          scene: trimmedScene,
          paid: false,
          mode: "preview",
          assetKind: "image",
        },
        0,
        trimmedScene.slice(0, 500)
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

  const deductionResult = await withCreditDeduction(
    {
      supabase,
      userId: user.id,
      amount: CREDIT_COST,
      description: "Mein KI-Ich – Bildgenerierung",
      skipGenerationLog: true,
      generationType: "ki-ich",
      prompt: trimmedScene.slice(0, 500),
    },
    async () => {
      const uploadedUrl = await uploadDataUrlToFal(imageUrl);
      const falOutputUrl = await generateKiIchPortrait(
        uploadedUrl,
        trimmedScene,
        "final"
      );

      let generationId = existingGenerationId;

      if (generationId) {
        const existing = await getOwnedGeneration(
          supabase,
          generationId,
          user.id
        );
        if (!existing) {
          throw new Error("Generierung nicht gefunden");
        }
      } else {
        generationId = await createGenerationRecord(
          supabase,
          user.id,
          "ki-ich",
          { scene: trimmedScene, paid: false, mode: "preview", assetKind: "image" },
          0,
          trimmedScene.slice(0, 500)
        );
      }

      const finalPath = await ingestFinalImageFromUrl(
        user.id,
        generationId,
        falOutputUrl
      );

      await updateGenerationResult(supabase, generationId, user.id, {
        scene: trimmedScene,
        paid: true,
        mode: "final",
        finalPath,
        assetKind: "image",
        mimeType: "image/jpeg",
        credits_used: CREDIT_COST,
      });

      return { generationId };
    }
  );

  if (!deductionResult.ok) {
    const status = deductionResult.error === "Generierung nicht gefunden"
      ? 404
      : deductionResult.status;
    return NextResponse.json(
      { success: false, error: deductionResult.error },
      { status }
    );
  }

  const { generationId } = deductionResult.data;

  return NextResponse.json({
    success: true,
    generationId,
    imageUrl: protectedImageUrl(generationId, "final"),
    mode: "final",
    creditsUsed: CREDIT_COST,
    creditsLeft: deductionResult.remainingCredits,
    locked: false,
  });
}

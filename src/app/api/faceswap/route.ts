import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { AkoolFaceswapError } from "@/lib/akool-errors";
import {
  getFaceswapResults,
  mapFaceswapStatus,
  startFaceswapJob,
} from "@/lib/akool-faceswap";
import {
  validateSourceFile,
  validateTargetFaceFile,
} from "@/lib/faceswap-media";
import { uploadFaceswapMedia } from "@/lib/upload-faceswap-media";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { notifyGenerationCompletePush } from "@/lib/push-notifications";
import { assertGatedFeature } from "@/lib/access.server";
import {
  createGenerationRecord,
  getOwnedGeneration,
  ingestFinalAssetFromUrl,
  updateGenerationResult,
} from "@/lib/generation-assets";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

const CREDIT_VIDEO = 10;
const CREDIT_IMAGE = 5;

function faceswapErrorResponse(err: unknown, status = 500) {
  if (err instanceof AkoolFaceswapError) {
    return NextResponse.json(
      { error: sanitizeUserMessage(err.userMessage) },
      { status: 400 }
    );
  }
  const message = sanitizeUserMessage(
    err instanceof Error ? err.message : "Face Swap fehlgeschlagen"
  );
  return NextResponse.json({ error: message }, { status });
}

function protectedAssetUrl(generationId: string) {
  return `/api/generated-image/${generationId}?variant=final`;
}

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  const generationId = request.nextUrl.searchParams.get("generationId");

  if (!jobId || !generationId) {
    return NextResponse.json(
      { error: "jobId und generationId required" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const owned = await getOwnedGeneration(supabase, generationId, user.id);
  if (!owned?.asset || owned.asset.jobId !== jobId) {
    return NextResponse.json({ error: "Generierung nicht gefunden" }, { status: 404 });
  }

  if (owned.asset.finalPath) {
    return NextResponse.json({
      success: true,
      status: "completed",
      progress: 100,
      generationId,
      resultUrl: protectedAssetUrl(generationId),
    });
  }

  try {
    const result = await getFaceswapResults(jobId);
    if (!result) {
      return NextResponse.json({
        success: true,
        status: "processing",
        progress: 15,
        generationId,
        resultUrl: null,
      });
    }

    const mapped = mapFaceswapStatus(result.faceswap_status);

    if (mapped.status === "completed" && result.url) {
      const kind: "image" | "video" =
        owned.asset.assetKind === "video" ? "video" : "image";
      const { path, mimeType } = await ingestFinalAssetFromUrl(
        user.id,
        generationId,
        result.url,
        kind
      );

      await updateGenerationResult(supabase, generationId, user.id, {
        finalPath: path,
        paid: true,
        mimeType,
      });

      const label =
        kind === "video" ? "Face Swap Video" : "Face Swap Bild";
      notifyGenerationCompletePush(
        user.id,
        label,
        `/dashboard/faceswap?generation=${generationId}`
      );

      return NextResponse.json({
        success: true,
        status: "completed",
        progress: 100,
        generationId,
        resultUrl: protectedAssetUrl(generationId),
      });
    }

    return NextResponse.json({
      success: true,
      status: mapped.status,
      progress: mapped.progress,
      generationId,
      resultUrl: null,
      error:
        mapped.status === "failed"
          ? "Face Swap fehlgeschlagen. Bitte andere Bilder mit klarem Gesicht verwenden."
          : undefined,
    });
  } catch (err: unknown) {
    console.error("[faceswap GET]", err);
    return faceswapErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  const denied = await assertGatedFeature("face-swap");
  if (denied) return denied;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  if (!process.env.AKOOL_CLIENT_ID || !process.env.AKOOL_API_KEY) {
    return NextResponse.json(
      { error: "Face-Swap ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  try {
    const form = await request.formData();
    const modeRaw = form.get("mode");
    const sourceFile = form.get("source");
    const targetFaceFile = form.get("targetFace");

    if (modeRaw !== "video" && modeRaw !== "image") {
      return NextResponse.json({ error: "Ungültiger Modus" }, { status: 400 });
    }
    const mode = modeRaw;

    const targetErr = validateTargetFaceFile(
      targetFaceFile instanceof File ? targetFaceFile : null
    );
    if (targetErr) {
      return NextResponse.json({ error: targetErr }, { status: 400 });
    }

    const sourceErr = validateSourceFile(
      sourceFile instanceof File ? sourceFile : null,
      mode
    );
    if (sourceErr) {
      return NextResponse.json({ error: sourceErr }, { status: 400 });
    }

    if (form.get("consentAccepted") !== "true") {
      return NextResponse.json(
        {
          error:
            "Bitte bestätige die Einwilligung, bevor die KI-Verarbeitung startet.",
          code: "CONSENT_REQUIRED",
        },
        { status: 400 }
      );
    }

    const source = sourceFile as File;
    const targetFace = targetFaceFile as File;

    const creditCost = mode === "video" ? CREDIT_VIDEO : CREDIT_IMAGE;
    const creditCheck = await hasEnoughCredits(supabase, user.id, creditCost);
    if (!creditCheck.ok) {
      return NextResponse.json(
        { error: `Nicht genug Credits (${creditCost} benötigt)` },
        { status: 402 }
      );
    }

    const [sourceMediaUrl, targetFaceUrl] = await Promise.all([
      uploadFaceswapMedia(source, user.id),
      uploadFaceswapMedia(targetFace, user.id),
    ]);

    const job = await startFaceswapJob({
      mode,
      sourceMediaUrl,
      targetFaceUrl,
    });

    const generationId = await createGenerationRecord(
      supabase,
      user.id,
      "live-creator-faceswap",
      {
        jobId: job._id,
        paid: true,
        assetKind: mode === "video" ? "video" : "image",
        mode: "final",
      },
      creditCost,
      `${mode}:${job._id}`
    );

    const deduction = await deductCredits(
      supabase,
      user.id,
      creditCost,
      mode === "video"
        ? "Live Creator Face Swap Video"
        : "Live Creator Face Swap Foto",
      {
        generationType: "live-creator-faceswap",
        prompt: `${mode}:${job._id}`,
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Credit-Abzug fehlgeschlagen" },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: job._id,
      generationId,
      status: "processing",
      creditsLeft: deduction.remainingCredits,
    });
  } catch (err: unknown) {
    console.error("[faceswap POST]", err);
    return faceswapErrorResponse(err);
  }
}

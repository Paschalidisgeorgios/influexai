import { fal } from "@fal-ai/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { invalidateUserGenerations } from "@/lib/cache";
import { notifyGenerationCompletePush } from "@/lib/push-notifications";
import {
  configureFalClient,
  getFalKey,
  parseFalError,
  uploadDataUrlToFal,
} from "@/lib/fal-image";
import {
  createGenerationRecord,
  ingestFinalAssetFromUrl,
  updateGenerationResult,
} from "@/lib/generation-assets";
import {
  MOTION_TRANSFER_CREDIT_COST,
  MOTION_TRANSFER_MODEL,
  MOTION_TRANSFER_UI_NAME,
} from "@/lib/motion-transfer-config";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

type MotionTransferOutput = {
  data?: { video?: { url?: string } };
  video?: { url?: string };
};

export type MotionTransferResult =
  | {
      ok: true;
      videoUrl: string;
      generationId: string;
      creditsLeft: number;
    }
  | { ok: false; error: string };

function extractVideoUrl(result: unknown): string | null {
  const r = result as MotionTransferOutput;
  return r.data?.video?.url ?? r.video?.url ?? null;
}

async function uploadDataUrlVideoToFal(dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:(video\/[^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Ungültiges Video-Format.");
  }

  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const ext = mimeType.includes("quicktime") ? "mov" : "mp4";
  const bytes = new Uint8Array(buffer);
  const blob = new Blob([bytes], { type: mimeType });
  const file = new File([blob], `motion-ref.${ext}`, { type: mimeType });
  configureFalClient();
  return fal.storage.upload(file);
}

async function resolveMediaUrl(
  value: string,
  kind: "image" | "video"
): Promise<string> {
  const trimmed = value.trim();

  if (trimmed.startsWith("data:")) {
    configureFalClient();
    return kind === "image"
      ? uploadDataUrlToFal(trimmed)
      : uploadDataUrlVideoToFal(trimmed);
  }

  if (trimmed.startsWith("https://")) {
    return trimmed;
  }

  throw new Error(
    kind === "image" ? "Ungültiges Bild-Format." : "Ungültiges Video-Format."
  );
}

export async function runMotionTransferGeneration(
  supabase: SupabaseClient,
  userId: string,
  params: { sourceImage: string; referenceVideo: string }
): Promise<MotionTransferResult> {
  if (!getFalKey()) {
    return { ok: false, error: "Video-Engine ist nicht konfiguriert." };
  }

  const creditCheck = await hasEnoughCredits(
    supabase,
    userId,
    MOTION_TRANSFER_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return { ok: false, error: "Nicht genug Credits." };
  }

  try {
    configureFalClient();

    const [imageUrl, videoUrl] = await Promise.all([
      resolveMediaUrl(params.sourceImage, "image"),
      resolveMediaUrl(params.referenceVideo, "video"),
    ]);

    let result: unknown;
    try {
      result = await fal.subscribe(MOTION_TRANSFER_MODEL, {
        input: {
          image_url: imageUrl,
          video_url: videoUrl,
          character_orientation: "video",
        },
        logs: false,
      });
    } catch (falError) {
      console.error("[motion-transfer]", JSON.stringify(falError));
      throw new Error(parseFalError(falError));
    }

    const falVideoUrl = extractVideoUrl(result);
    if (!falVideoUrl) {
      return { ok: false, error: "Kein Video generiert. Bitte erneut versuchen." };
    }

    const generationId = await createGenerationRecord(
      supabase,
      userId,
      "motion-transfer",
      {
        paid: true,
        downloadPaid: true,
        assetKind: "video",
        mode: "final",
        model: MOTION_TRANSFER_MODEL,
      },
      0,
      MOTION_TRANSFER_UI_NAME
    );

    const { path: finalPath } = await ingestFinalAssetFromUrl(
      userId,
      generationId,
      falVideoUrl,
      "video"
    );

    await updateGenerationResult(supabase, generationId, userId, {
      finalPath,
      credits_used: MOTION_TRANSFER_CREDIT_COST,
    });

    const deduction = await deductCredits(
      supabase,
      userId,
      MOTION_TRANSFER_CREDIT_COST,
      MOTION_TRANSFER_UI_NAME,
      {
        generationType: "motion-transfer",
        prompt: MOTION_TRANSFER_UI_NAME,
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

    notifyGenerationCompletePush(
      userId,
      MOTION_TRANSFER_UI_NAME,
      `/dashboard/motion-transfer?generation=${generationId}`
    );

    return {
      ok: true,
      videoUrl: `/api/generated-video/${generationId}`,
      generationId,
      creditsLeft: deduction.remainingCredits ?? 0,
    };
  } catch (error) {
    console.error("[motion-transfer]", error);
    return {
      ok: false,
      error: sanitizeUserMessage(
        error instanceof Error
          ? error.message
          : "Motion Transfer fehlgeschlagen."
      ),
    };
  }
}

import { fal } from "@fal-ai/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addCredits,
  deductCredits,
  hasEnoughCredits,
} from "@/lib/credits";
import { invalidateUserGenerations } from "@/lib/cache";
import { notifyGenerationCompletePush } from "@/lib/push-notifications";
import {
  calculateAkoolModelCredits,
  createAkoolImage2VideoJob,
  findAkoolImageToVideoModel,
  getAkoolImage2VideoStatus,
  getDefaultAkoolImageToVideoModel,
} from "@/lib/akool-models";
import {
  configureFalClient,
  getFalKey,
  uploadDataUrlToFal,
} from "@/lib/fal-image";
import {
  createGenerationRecord,
  downloadStorageObject,
  getOwnedGeneration,
  ingestFinalAssetFromUrl,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { isAkoolConfigured } from "@/lib/akool-env";
import { SEEDANCE_UI_NAME } from "@/lib/seedance-config";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

export type SeedanceParams = {
  imageUrl: string;
  prompt: string;
  modelId?: string;
  duration?: number;
  resolution?: string;
  lastFrameUrl?: string;
};

export type SeedanceStartResult =
  | {
      ok: true;
      jobId: string;
      generationId: string;
      creditsUsed: number;
      creditsLeft: number;
    }
  | { ok: false; error: string };

export type SeedancePollResult =
  | { status: "processing"; progress: number }
  | {
      status: "completed";
      videoUrl: string;
      generationId: string;
      creditsLeft?: number;
    }
  | { status: "failed"; error: string; refunded: boolean };

export type SeedanceGenerationResult =
  | {
      ok: true;
      videoUrl: string;
      generationId: string;
      creditsUsed: number;
      creditsLeft: number;
    }
  | { ok: false; error: string };

export function protectedSeedanceVideoUrl(generationId: string) {
  return `/api/generated-video/${generationId}`;
}

async function uploadBufferToFal(
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const blob = new Blob([bytes], { type: contentType });
  const file = new File([blob], "seedance-source.jpg", { type: contentType });
  return fal.storage.upload(file);
}

async function resolveProtectedImageUrl(
  supabase: SupabaseClient,
  userId: string,
  imageUrl: string
): Promise<string> {
  const match = imageUrl.match(
    /^\/api\/generated-image\/([^/?]+)(?:\?(?:.*&)?variant=(\w+))?/
  );
  if (!match) {
    throw new Error("Ungültige Bild-URL.");
  }

  const generationId = match[1];
  const variant = match[2] ?? "preview";
  const row = await getOwnedGeneration(supabase, generationId, userId);
  if (!row?.asset) {
    throw new Error("Bild nicht gefunden.");
  }

  const { asset } = row;
  let storagePath: string | undefined;

  if (variant === "final") {
    if (!asset.downloadPaid || !asset.finalPath) {
      throw new Error("Bild ist noch nicht freigeschaltet.");
    }
    storagePath = asset.finalPath;
  } else if (variant === "source") {
    storagePath = asset.sourcePath;
  } else if (variant === "upscaled") {
    storagePath = asset.upscaledPath;
  } else {
    storagePath =
      asset.previewPath ?? (asset.downloadPaid ? asset.finalPath : undefined);
  }

  if (!storagePath) {
    throw new Error("Bildvorschau nicht verfügbar.");
  }

  configureFalClient();
  const { data, contentType } = await downloadStorageObject(storagePath);
  const buffer = Buffer.from(await data.arrayBuffer());
  return uploadBufferToFal(buffer, contentType);
}

export async function resolveImageUrlForSeedance(
  supabase: SupabaseClient,
  userId: string,
  imageUrl: string
): Promise<string> {
  const trimmed = imageUrl.trim();

  if (trimmed.startsWith("data:image/")) {
    configureFalClient();
    return uploadDataUrlToFal(trimmed);
  }

  if (trimmed.startsWith("/api/generated-image/")) {
    return resolveProtectedImageUrl(supabase, userId, trimmed);
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (!trimmed.startsWith("https://")) {
      throw new Error(
        "Bild-URL muss https:// sein (localhost nicht erlaubt)"
      );
    }
    if (trimmed.includes("localhost") || trimmed.includes("127.0.0.1")) {
      throw new Error("localhost-URLs funktionieren nicht für Video-Upload");
    }
    return trimmed;
  }

  throw new Error("Ungültige Bild-URL.");
}

export async function getSeedanceGenerationByJobId(
  supabase: SupabaseClient,
  userId: string,
  jobId: string
) {
  const { data, error } = await supabase
    .from("generations")
    .select("id, result, credits_used, prompt")
    .eq("user_id", userId)
    .eq("type", "seedance")
    .filter("result->>jobId", "eq", jobId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function refundSeedanceCredits(
  supabase: SupabaseClient,
  userId: string,
  generationId: string,
  amount: number
): Promise<boolean> {
  if (amount <= 0) return false;

  const refund = await addCredits(
    supabase,
    userId,
    amount,
    `${SEEDANCE_UI_NAME} — Erstattung`
  );
  if (!refund.success) {
    console.error("[seedance] refund failed:", refund.error);
    return false;
  }

  await updateGenerationResult(supabase, generationId, userId, {
    credits_used: 0,
  });
  return true;
}

export async function finalizeSeedanceVideo(
  supabase: SupabaseClient,
  userId: string,
  generationId: string,
  akoolVideoUrl: string
): Promise<{ videoUrl: string }> {
  const row = await getOwnedGeneration(supabase, generationId, userId);
  if (row?.asset?.finalPath) {
    return { videoUrl: protectedSeedanceVideoUrl(generationId) };
  }

  const { path: finalPath } = await ingestFinalAssetFromUrl(
    userId,
    generationId,
    akoolVideoUrl,
    "video"
  );

  await updateGenerationResult(supabase, generationId, userId, {
    finalPath,
  });

  await invalidateUserGenerations(userId);

  notifyGenerationCompletePush(
    userId,
    SEEDANCE_UI_NAME,
    `/dashboard/seedance?generation=${generationId}`
  );

  return { videoUrl: protectedSeedanceVideoUrl(generationId) };
}

async function resolveSeedanceModel(modelId?: string) {
  if (modelId?.trim()) {
    const model = await findAkoolImageToVideoModel(modelId.trim());
    if (!model) {
      throw new Error("Unbekanntes Video-Modell.");
    }
    return model;
  }
  const fallback = await getDefaultAkoolImageToVideoModel();
  if (!fallback) {
    throw new Error("Keine Video-Modelle verfügbar.");
  }
  return fallback;
}

export async function startSeedanceJob(
  supabase: SupabaseClient,
  userId: string,
  params: SeedanceParams
): Promise<SeedanceStartResult> {
  const imageUrl = params.imageUrl.trim();
  const prompt = params.prompt.trim();

  if (!imageUrl) {
    return { ok: false, error: "Bild-URL erforderlich." };
  }
  if (!prompt) {
    return { ok: false, error: "Bewegungs-Prompt erforderlich." };
  }

  if (!isAkoolConfigured()) {
    return { ok: false, error: "Video-Engine ist nicht konfiguriert." };
  }
  if (!getFalKey()) {
    return {
      ok: false,
      error: "Medien-Upload ist gerade nicht verfügbar.",
    };
  }

  let model;
  try {
    model = await resolveSeedanceModel(params.modelId);
  } catch (error) {
    return {
      ok: false,
      error: sanitizeUserMessage(
        error instanceof Error ? error.message : "Modell nicht verfügbar."
      ),
    };
  }

  const duration =
    params.duration && model.durationList.includes(params.duration)
      ? params.duration
      : model.durationList[0];

  const resolution =
    model.resolutionList.find(
      (item) =>
        item.value.toLowerCase() === (params.resolution ?? "").toLowerCase()
    )?.value ?? model.resolutionList[0]?.value;

  if (!resolution) {
    return { ok: false, error: "Auflösung nicht verfügbar." };
  }

  const creditCost = calculateAkoolModelCredits(model, resolution, duration);

  const creditCheck = await hasEnoughCredits(supabase, userId, creditCost);
  if (!creditCheck.ok) {
    return { ok: false, error: "Nicht genug Credits." };
  }

  const deduction = await deductCredits(
    supabase,
    userId,
    creditCost,
    SEEDANCE_UI_NAME,
    {
      generationType: "seedance",
      prompt: prompt.slice(0, 500),
      skipGenerationLog: true,
    }
  );

  if (!deduction.success) {
    return {
      ok: false,
      error: deduction.error ?? "Credit-Abzug fehlgeschlagen.",
    };
  }

  let generationId: string | null = null;

  try {
    configureFalClient();
    const publicImageUrl = await resolveImageUrlForSeedance(
      supabase,
      userId,
      imageUrl
    );

    let publicLastFrameUrl: string | undefined;
    if (params.lastFrameUrl?.trim() && model.supportedLastFrame) {
      publicLastFrameUrl = await resolveImageUrlForSeedance(
        supabase,
        userId,
        params.lastFrameUrl.trim()
      );
    }

    const { jobId } = await createAkoolImage2VideoJob({
      model: model.value,
      image_url: publicImageUrl,
      prompt,
      duration,
      resolution,
      last_frame_url: publicLastFrameUrl,
    });

    generationId = await createGenerationRecord(
      supabase,
      userId,
      "seedance",
      {
        paid: true,
        downloadPaid: true,
        assetKind: "video",
        mode: "final",
        model: model.value,
        jobId,
      },
      creditCost,
      prompt.slice(0, 500)
    );

    return {
      ok: true,
      jobId,
      generationId,
      creditsUsed: creditCost,
      creditsLeft: deduction.remainingCredits ?? 0,
    };
  } catch (error) {
    console.error("[seedance start]", error);

    if (generationId) {
      await refundSeedanceCredits(
        supabase,
        userId,
        generationId,
        creditCost
      );
    } else {
      await addCredits(
        supabase,
        userId,
        creditCost,
        `${SEEDANCE_UI_NAME} — Erstattung`
      );
    }

    return {
      ok: false,
      error: sanitizeUserMessage(
        error instanceof Error
          ? error.message
          : "Video-Generierung fehlgeschlagen."
      ),
    };
  }
}

export async function pollSeedanceJob(
  supabase: SupabaseClient,
  userId: string,
  jobId: string
): Promise<SeedancePollResult> {
  const row = await getSeedanceGenerationByJobId(supabase, userId, jobId);
  if (!row) {
    return {
      status: "failed",
      error: "Job nicht gefunden.",
      refunded: false,
    };
  }

  const generationId = row.id as string;
  const creditsUsed = (row.credits_used as number) ?? 0;

  try {
    const job = await getAkoolImage2VideoStatus(jobId);

    if (job.status === "processing") {
      return { status: "processing", progress: 50 };
    }

    if (job.status === "failed" || !job.videoUrl) {
      const refunded =
        creditsUsed > 0
          ? await refundSeedanceCredits(
              supabase,
              userId,
              generationId,
              creditsUsed
            )
          : false;
      return {
        status: "failed",
        error: "Video-Generierung fehlgeschlagen",
        refunded,
      };
    }

    const { videoUrl } = await finalizeSeedanceVideo(
      supabase,
      userId,
      generationId,
      job.videoUrl
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    return {
      status: "completed",
      videoUrl,
      generationId,
      creditsLeft: profile?.credits ?? undefined,
    };
  } catch (error) {
    console.error("[seedance poll]", error);
    const refunded =
      creditsUsed > 0
        ? await refundSeedanceCredits(
            supabase,
            userId,
            generationId,
            creditsUsed
          )
        : false;
    return {
      status: "failed",
      error: sanitizeUserMessage(
        error instanceof Error ? error.message : "Status-Abfrage fehlgeschlagen"
      ),
      refunded,
    };
  }
}

async function waitForAkoolImage2Video(
  jobId: string,
  maxAttempts = 60,
  intervalMs = 3000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const job = await getAkoolImage2VideoStatus(jobId);
    if (job.status === "completed" && job.videoUrl) {
      return job.videoUrl;
    }
    if (job.status === "failed") {
      throw new Error("Video-Generierung fehlgeschlagen");
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Zeitüberschreitung bei der Video-Generierung");
}

/** Blocking path for agent tools — start job, wait, finalize. */
export async function runSeedanceGeneration(
  supabase: SupabaseClient,
  userId: string,
  params: SeedanceParams
): Promise<SeedanceGenerationResult> {
  const start = await startSeedanceJob(supabase, userId, params);
  if (!start.ok) {
    return { ok: false, error: start.error };
  }

  try {
    const akoolVideoUrl = await waitForAkoolImage2Video(start.jobId);
    const { videoUrl } = await finalizeSeedanceVideo(
      supabase,
      userId,
      start.generationId,
      akoolVideoUrl
    );

    return {
      ok: true,
      videoUrl,
      generationId: start.generationId,
      creditsUsed: start.creditsUsed,
      creditsLeft: start.creditsLeft,
    };
  } catch (error) {
    const poll = await pollSeedanceJob(supabase, userId, start.jobId);
    return {
      ok: false,
      error: sanitizeUserMessage(
        poll.status === "failed"
          ? poll.error
          : error instanceof Error
            ? error.message
            : "Video-Generierung fehlgeschlagen."
      ),
    };
  }
}

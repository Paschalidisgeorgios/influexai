import { fal } from "@fal-ai/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { invalidateUserGenerations } from "@/lib/cache";
import { notifyGenerationCompletePush } from "@/lib/push-notifications";
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
import {
  SEEDANCE_CREDIT_COST,
  SEEDANCE_MODEL,
  SEEDANCE_UI_NAME,
} from "@/lib/seedance-config";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

type SeedanceVideoOutput = {
  data?: { video?: { url?: string } };
  video?: { url?: string };
};

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

function extractVideoUrl(result: unknown): string | null {
  const r = result as SeedanceVideoOutput;
  return r.data?.video?.url ?? r.video?.url ?? null;
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
    return trimmed;
  }

  throw new Error("Ungültige Bild-URL.");
}

export async function runSeedanceGeneration(
  supabase: SupabaseClient,
  userId: string,
  params: { imageUrl: string; prompt: string }
): Promise<SeedanceGenerationResult> {
  const imageUrl = params.imageUrl.trim();
  const prompt = params.prompt.trim();

  if (!imageUrl) {
    return { ok: false, error: "Bild-URL erforderlich." };
  }
  if (!prompt) {
    return { ok: false, error: "Bewegungs-Prompt erforderlich." };
  }

  if (!getFalKey()) {
    return { ok: false, error: "Video-Engine ist nicht konfiguriert." };
  }

  const creditCheck = await hasEnoughCredits(
    supabase,
    userId,
    SEEDANCE_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return { ok: false, error: "Nicht genug Credits." };
  }

  try {
    configureFalClient();
    const falImageUrl = await resolveImageUrlForSeedance(
      supabase,
      userId,
      imageUrl
    );

    let result: unknown;
    try {
      result = await fal.subscribe(SEEDANCE_MODEL, {
        input: {
          image_url: falImageUrl,
          prompt,
          resolution: "720p",
          duration: "auto",
          aspect_ratio: "auto",
          generate_audio: true,
        },
        logs: false,
      });
    } catch (falError) {
      console.error(JSON.stringify(falError));
      throw falError;
    }

    const falVideoUrl = extractVideoUrl(result);
    if (!falVideoUrl) {
      return { ok: false, error: "Keine Video-URL in der Antwort." };
    }

    const generationId = await createGenerationRecord(
      supabase,
      userId,
      "seedance",
      {
        paid: true,
        downloadPaid: true,
        assetKind: "video",
        mode: "final",
        model: SEEDANCE_MODEL,
      },
      0,
      prompt.slice(0, 500)
    );

    const { path: finalPath } = await ingestFinalAssetFromUrl(
      userId,
      generationId,
      falVideoUrl,
      "video"
    );

    await updateGenerationResult(supabase, generationId, userId, {
      finalPath,
      credits_used: SEEDANCE_CREDIT_COST,
    });

    const deduction = await deductCredits(
      supabase,
      userId,
      SEEDANCE_CREDIT_COST,
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

    await invalidateUserGenerations(userId);

    notifyGenerationCompletePush(
      userId,
      SEEDANCE_UI_NAME,
      `/dashboard/seedance?generation=${generationId}`
    );

    return {
      ok: true,
      videoUrl: protectedSeedanceVideoUrl(generationId),
      generationId,
      creditsUsed: SEEDANCE_CREDIT_COST,
      creditsLeft: deduction.remainingCredits ?? 0,
    };
  } catch (error) {
    console.error(JSON.stringify(error));
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

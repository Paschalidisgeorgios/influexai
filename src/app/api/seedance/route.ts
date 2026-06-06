import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

export const maxDuration = 300;

type SeedanceBody = {
  image_url?: string;
  prompt?: string;
};

type SeedanceVideoOutput = {
  data?: { video?: { url?: string } };
  video?: { url?: string };
};

function protectedVideoUrl(generationId: string) {
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
    throw new Error("Ungültige Bild-URL aus der Gallery.");
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

async function resolveImageUrlForFal(
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

  throw new Error("Bitte lade ein Bild hoch oder füge eine gültige URL ein.");
}

export async function POST(request: NextRequest) {
  let body: SeedanceBody;
  try {
    body = (await request.json()) as SeedanceBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const imageUrl = body.image_url?.trim() ?? "";
  const prompt = body.prompt?.trim() ?? "";

  if (!imageUrl) {
    return NextResponse.json({ error: "Bild-URL erforderlich" }, { status: 400 });
  }
  if (!prompt) {
    return NextResponse.json({ error: "Bewegungs-Prompt erforderlich" }, { status: 400 });
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Video-Engine ist nicht konfiguriert." },
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

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    SEEDANCE_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return NextResponse.json(
      { error: "Nicht genug Credits", credits: creditCheck.credits },
      { status: 402 }
    );
  }

  try {
    configureFalClient();
    const falImageUrl = await resolveImageUrlForFal(
      supabase,
      user.id,
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
      throw new Error("Keine Video-URL in der Antwort.");
    }

    const generationId = await createGenerationRecord(
      supabase,
      user.id,
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
      user.id,
      generationId,
      falVideoUrl,
      "video"
    );

    await updateGenerationResult(supabase, generationId, user.id, {
      finalPath,
      credits_used: SEEDANCE_CREDIT_COST,
    });

    const deduction = await deductCredits(
      supabase,
      user.id,
      SEEDANCE_CREDIT_COST,
      SEEDANCE_UI_NAME,
      {
        generationType: "seedance",
        prompt: prompt.slice(0, 500),
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Credit-Abzug fehlgeschlagen" },
        { status: 402 }
      );
    }

    await invalidateUserGenerations(user.id);

    notifyGenerationCompletePush(
      user.id,
      SEEDANCE_UI_NAME,
      `/dashboard/seedance?generation=${generationId}`
    );

    return NextResponse.json({
      videoUrl: protectedVideoUrl(generationId),
      generationId,
      creditsLeft: deduction.remainingCredits,
    });
  } catch (error) {
    console.error(JSON.stringify(error));
    return NextResponse.json(
      {
        error: sanitizeUserMessage(
          error instanceof Error
            ? error.message
            : "Video-Generierung fehlgeschlagen"
        ),
      },
      { status: 500 }
    );
  }
}

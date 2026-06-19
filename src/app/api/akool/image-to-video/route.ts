import { NextRequest, NextResponse } from "next/server";

import {
  calculateAkoolModelCredits,
  findAkoolImageToVideoModel,
} from "@/lib/akool-models";
import { createAkoolJob } from "@/lib/akool-status";
import { runAkoolAsyncPost } from "@/lib/akool-async-route";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";
import { getFalKey } from "@/lib/fal-image";
import {
  clampSelectionToCapabilities,
  getModelCapabilities,
  type SzenenAspectRatio,
  type SzenenAudioMode,
} from "@/lib/szenen-generator-capabilities";
import {
  buildAkoolImage2VideoBodies,
  enrichPrompt,
  type SzenenCinematicParams,
  type SzenenGenerationInput,
  validateGenerationInput,
} from "@/lib/szenen-generator-payload";
import {
  getDefaultDuration,
  getDefaultResolution,
  mergeSzenenGeneratorModels,
} from "@/lib/szenen-generator-models";
import {
  resolveAudioUrlForAkool,
  resolveImageUrlForSeedance,
} from "@/lib/seedance-generate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type ImageToVideoBody = {
  model?: string;
  modelId?: string;
  image_url?: string;
  imageUrl?: string;
  prompt?: string;
  duration?: number;
  resolution?: string;
  last_frame_url?: string;
  lastFrameUrl?: string;
  referenceUrl?: string;
  reference_url?: string;
  audioUrl?: string;
  audio_url?: string;
  audioMode?: SzenenAudioMode;
  aspectRatio?: SzenenAspectRatio;
  videoCount?: number;
  extendPrompt?: boolean;
  cinematic?: SzenenCinematicParams;
  speedRampLabel?: string;
};

export async function POST(request: NextRequest) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Medien-Upload ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  let body: ImageToVideoBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const modelId = (body.model ?? body.modelId)?.trim() ?? "";
  const imageUrl = (body.image_url ?? body.imageUrl)?.trim() ?? "";
  const prompt = body.prompt?.trim() ?? "";

  if (!modelId || !imageUrl || !prompt) {
    return NextResponse.json(
      { error: "Modell, Bild und Prompt erforderlich" },
      { status: 400 }
    );
  }

  const akoolModel = await findAkoolImageToVideoModel(modelId);
  if (!akoolModel) {
    return NextResponse.json({ error: "Unbekanntes Modell" }, { status: 400 });
  }

  const uiModel =
    mergeSzenenGeneratorModels([akoolModel]).find((m) => m.id === modelId) ??
    mergeSzenenGeneratorModels([akoolModel])[0];

  const resolution =
    body.resolution &&
    akoolModel.resolutionList.some(
      (r) => r.value.toLowerCase() === body.resolution!.toLowerCase()
    )
      ? body.resolution
      : getDefaultResolution(uiModel);

  const capabilities = getModelCapabilities(uiModel, resolution);
  const clamped = clampSelectionToCapabilities(capabilities, {
    duration: body.duration ?? getDefaultDuration(uiModel),
    resolution,
    aspectRatio: body.aspectRatio,
    videoCount: body.videoCount ?? 1,
    audioMode: body.audioMode ?? "none",
  });

  const generationInput: SzenenGenerationInput = {
    model: { ...uiModel, akool: akoolModel, apiAvailable: true },
    capabilities,
    prompt,
    duration: clamped.duration,
    resolution: clamped.resolution,
    aspectRatio: clamped.aspectRatio,
    imageUrl,
    lastFrameUrl: (body.last_frame_url ?? body.lastFrameUrl)?.trim(),
    referenceUrl: (body.referenceUrl ?? body.reference_url)?.trim(),
    audioUrl: (body.audioUrl ?? body.audio_url)?.trim(),
    audioMode: clamped.audioMode,
    videoCount: clamped.videoCount,
    extendPrompt: body.extendPrompt,
    cinematic: body.cinematic,
    speedRampLabel: body.speedRampLabel,
  };

  const validationError = validateGenerationInput(generationInput);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const enrichedPrompt = enrichPrompt(generationInput);
  const creditCost =
    calculateAkoolModelCredits(
      akoolModel,
      clamped.resolution,
      clamped.duration
    ) * clamped.videoCount;

  return runAkoolAsyncPost({
    creditCost,
    generationType: "akool-image-to-video",
    label: "Video Generator",
    pollType: "image2video",
    prompt: enrichedPrompt,
    model: modelId,
    createJob: async ({ supabase, userId }) => {
      const publicImage = await resolveImageUrlForSeedance(
        supabase,
        userId,
        imageUrl
      );

      let lastFrame: string | undefined;
      if (generationInput.lastFrameUrl && capabilities.supportsEndFrame) {
        lastFrame = await resolveImageUrlForSeedance(
          supabase,
          userId,
          generationInput.lastFrameUrl
        );
      }

      let referenceUrl: string | undefined;
      if (generationInput.referenceUrl && capabilities.supportsReference) {
        referenceUrl = await resolveImageUrlForSeedance(
          supabase,
          userId,
          generationInput.referenceUrl
        );
      }

      let audioUrl: string | undefined;
      if (
        generationInput.audioMode === "custom" &&
        generationInput.audioUrl
      ) {
        audioUrl = await resolveAudioUrlForAkool(
          supabase,
          userId,
          generationInput.audioUrl
        );
      }

      const bodies = buildAkoolImage2VideoBodies(
        akoolModel,
        {
          imageUrl: publicImage,
          lastFrameUrl: lastFrame,
          referenceUrl,
          audioUrl,
        },
        {
          prompt: enrichedPrompt,
          duration: clamped.duration,
          resolution: clamped.resolution,
          aspectRatio: clamped.aspectRatio,
          audioMode: clamped.audioMode,
          videoCount: clamped.videoCount,
          extendPrompt: generationInput.extendPrompt,
          capabilities,
        }
      );

      if (bodies.useBatch && bodies.batch) {
        return createAkoolJob(
          "/v4/image2Video/createBySourcePrompt/batch",
          bodies.batch
        );
      }

      return createAkoolJob(
        "/v4/image2video/create",
        bodies.primary,
        "/v4/image2Video/createBySourcePrompt",
        bodies.fallback
      );
    },
  });
}

import type { AkoolImageToVideoModel } from "@/lib/akool-models";
import { DEFAULT_NEGATIVE_PROMPT } from "@/lib/akool-models";
import type {
  ModelCapabilities,
  SzenenAspectRatio,
  SzenenAudioMode,
} from "@/lib/szenen-generator-capabilities";
import type { SzenenGeneratorModel } from "@/lib/szenen-generator-models";

export type SzenenCinematicParams = {
  camera?: string;
  shot?: string;
  expression?: string;
  atmosphere?: string;
  light?: string;
  effect?: string;
};

export type SzenenGenerationInput = {
  model: SzenenGeneratorModel;
  capabilities: ModelCapabilities;
  prompt: string;
  duration: number;
  resolution: string;
  aspectRatio?: SzenenAspectRatio;
  imageUrl: string;
  lastFrameUrl?: string;
  referenceUrl?: string;
  audioUrl?: string;
  audioMode: SzenenAudioMode;
  videoCount: number;
  extendPrompt?: boolean;
  cinematic?: SzenenCinematicParams;
  speedRampLabel?: string;
};

export type ResolvedSzenenMedia = {
  imageUrl: string;
  lastFrameUrl?: string;
  referenceUrl?: string;
  audioUrl?: string;
};

export type SzenenClientRequestBody = {
  modelId: string;
  imageUrl: string;
  prompt: string;
  duration: number;
  resolution: string;
  lastFrameUrl?: string;
  referenceUrl?: string;
  audioUrl?: string;
  audioMode?: SzenenAudioMode;
  aspectRatio?: SzenenAspectRatio;
  videoCount?: number;
  extendPrompt?: boolean;
  cinematic?: SzenenCinematicParams;
  speedRampLabel?: string;
};

export type AkoolImage2VideoBodies = {
  primary: Record<string, unknown>;
  fallback: Record<string, unknown>;
  batch?: Record<string, unknown>;
  useBatch: boolean;
};

function appendPromptSegments(
  prompt: string,
  segments: (string | undefined)[]
): string {
  const extras = segments.map((s) => s?.trim()).filter(Boolean) as string[];
  if (!extras.length) return prompt.trim();
  return `${prompt.trim()}\n\n${extras.join(". ")}.`.replace(/\.\.+$/, ".");
}

export function enrichPrompt(input: SzenenGenerationInput): string {
  const { cinematic, speedRampLabel, aspectRatio, capabilities } = input;
  const segments: string[] = [];

  if (aspectRatio && capabilities.supportsMultiRatio) {
    segments.push(`Aspect ratio ${aspectRatio}`);
  }

  if (cinematic && capabilities.supportsCinematicParams) {
    if (cinematic.camera) segments.push(`Camera: ${cinematic.camera}`);
    if (cinematic.shot) segments.push(`Shot: ${cinematic.shot}`);
    if (cinematic.expression) segments.push(`Expression: ${cinematic.expression}`);
    if (cinematic.atmosphere) segments.push(`Atmosphere: ${cinematic.atmosphere}`);
    if (cinematic.light) segments.push(`Lighting: ${cinematic.light}`);
    if (cinematic.effect && cinematic.effect !== "Keine") {
      segments.push(`Effect: ${cinematic.effect}`);
    }
  }

  if (speedRampLabel && capabilities.supportsSpeedRamp) {
    segments.push(`Motion pacing: ${speedRampLabel}`);
  }

  return appendPromptSegments(input.prompt, segments);
}

export function validateGenerationInput(
  input: SzenenGenerationInput
): string | null {
  const { capabilities, model } = input;

  if (!model.apiAvailable || !model.akool) {
    return "Dieses Modell ist derzeit nicht verfügbar.";
  }
  if (!input.prompt.trim()) {
    return "Bitte beschreibe dein Video.";
  }
  if (capabilities.requiresStartImage && !input.imageUrl.trim()) {
    return "Startbild erforderlich.";
  }
  if (!capabilities.durations.includes(input.duration)) {
    return "Dauer für dieses Modell nicht verfügbar.";
  }
  if (!capabilities.resolutions.includes(input.resolution)) {
    return "Auflösung für dieses Modell nicht verfügbar.";
  }
  if (
    input.aspectRatio &&
    capabilities.aspectRatios.length &&
    !capabilities.aspectRatios.includes(input.aspectRatio)
  ) {
    return "Seitenverhältnis für dieses Modell nicht verfügbar.";
  }
  if (
    input.lastFrameUrl?.trim() &&
    !capabilities.supportsEndFrame
  ) {
    return "Endrahmen wird von diesem Modell nicht unterstützt.";
  }
  if (
    input.referenceUrl?.trim() &&
    !capabilities.supportsReference
  ) {
    return "Referenzbild wird von diesem Modell nicht unterstützt.";
  }
  if (input.audioMode === "custom" && !input.audioUrl?.trim()) {
    return "Bitte lade eine Audiodatei hoch oder wähle KI-Audio.";
  }
  if (input.audioMode !== "none" && !capabilities.supportsAudio) {
    return "Audio wird von diesem Modell nicht unterstützt.";
  }
  if (
    input.videoCount > 1 &&
    (!capabilities.supportsBatch || input.videoCount > capabilities.maxVideoCount)
  ) {
    return "Video-Anzahl für dieses Modell nicht verfügbar.";
  }

  return null;
}

export function buildClientRequestBody(
  input: SzenenGenerationInput
): SzenenClientRequestBody {
  const prompt = enrichPrompt(input);
  const body: SzenenClientRequestBody = {
    modelId: input.model.id,
    imageUrl: input.imageUrl.trim(),
    prompt,
    duration: input.duration,
    resolution: input.resolution,
  };

  if (input.lastFrameUrl?.trim() && input.capabilities.supportsEndFrame) {
    body.lastFrameUrl = input.lastFrameUrl.trim();
  }
  if (input.referenceUrl?.trim() && input.capabilities.supportsReference) {
    body.referenceUrl = input.referenceUrl.trim();
  }
  if (input.audioUrl?.trim() && input.audioMode === "custom") {
    body.audioUrl = input.audioUrl.trim();
  }
  if (input.capabilities.supportsAudio && input.audioMode !== "none") {
    body.audioMode = input.audioMode;
  }
  if (input.aspectRatio && input.capabilities.supportsMultiRatio) {
    body.aspectRatio = input.aspectRatio;
  }
  if (input.videoCount > 1 && input.capabilities.supportsBatch) {
    body.videoCount = input.videoCount;
  }
  if (input.extendPrompt && input.capabilities.supportsPromptEnhancement) {
    body.extendPrompt = true;
  }
  if (input.cinematic && input.capabilities.supportsCinematicParams) {
    body.cinematic = input.cinematic;
  }
  if (input.speedRampLabel && input.capabilities.supportsSpeedRamp) {
    body.speedRampLabel = input.speedRampLabel;
  }

  return body;
}

function resolveAudioType(
  audioMode: SzenenAudioMode,
  hasCustomAudio: boolean
): { audioType: number; generateAudio?: boolean; audioUrl?: string } {
  if (audioMode === "custom" && hasCustomAudio) {
    return { audioType: 2 };
  }
  if (audioMode === "ai") {
    return { audioType: 1, generateAudio: true };
  }
  return { audioType: 3 };
}

export function buildAkoolImage2VideoBodies(
  akool: AkoolImageToVideoModel,
  media: ResolvedSzenenMedia,
  input: {
    prompt: string;
    duration: number;
    resolution: string;
    aspectRatio?: SzenenAspectRatio;
    audioMode: SzenenAudioMode;
    videoCount: number;
    extendPrompt?: boolean;
    capabilities: ModelCapabilities;
  }
): AkoolImage2VideoBodies {
  const hasCustomAudio = Boolean(media.audioUrl?.trim());
  const audio = resolveAudioType(input.audioMode, hasCustomAudio);
  const useBatch = input.videoCount > 1 && input.capabilities.supportsBatch;

  const primary: Record<string, unknown> = {
    model: akool.value,
    image_url: media.imageUrl,
    prompt: input.prompt,
    duration: input.duration,
    resolution: input.resolution,
  };

  if (media.lastFrameUrl && input.capabilities.supportsEndFrame) {
    primary.last_frame_url = media.lastFrameUrl;
  }
  if (media.referenceUrl && input.capabilities.supportsReference) {
    primary.reference_image_url = media.referenceUrl;
  }
  if (input.aspectRatio && input.capabilities.supportsMultiRatio) {
    primary.aspect_ratio = input.aspectRatio;
  }
  if (audio.generateAudio && akool.generateAudio !== null) {
    primary.generate_audio = true;
  }

  const fallback: Record<string, unknown> = {
    model_name: akool.value,
    image_url: media.imageUrl,
    prompt: input.prompt,
    negative_prompt: DEFAULT_NEGATIVE_PROMPT,
    extend_prompt: input.extendPrompt ?? akool.supportedExtendPrompt,
    resolution: input.resolution,
    video_length: input.duration,
    audio_type: audio.audioType,
    webhookurl: "",
  };

  if (media.lastFrameUrl && input.capabilities.supportsEndFrame) {
    fallback.last_image_url = media.lastFrameUrl;
  }
  if (media.referenceUrl && input.capabilities.supportsReference) {
    fallback.reference_image_url = media.referenceUrl;
  }
  if (input.aspectRatio && input.capabilities.supportsMultiRatio) {
    fallback.aspect_ratio = input.aspectRatio;
  }
  if (audio.audioType === 2 && media.audioUrl) {
    fallback.audio_url = media.audioUrl;
  }

  let batch: Record<string, unknown> | undefined;
  if (useBatch) {
    batch = {
      ...fallback,
      count: Math.min(input.videoCount, input.capabilities.maxVideoCount),
    };
    if (audio.generateAudio && akool.generateAudio !== null) {
      batch.generate_audio = true;
    }
  }

  return { primary, fallback, batch, useBatch };
}

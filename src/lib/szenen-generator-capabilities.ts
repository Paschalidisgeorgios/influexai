import {
  getModelDurations,
  getModelResolutions,
  modelSupportsTag,
  type SzenenGeneratorModel,
} from "@/lib/szenen-generator-models";

export type SzenenAspectRatio = "16:9" | "9:16" | "1:1" | "4:3";

export type SzenenAudioMode = "none" | "ai" | "custom";

export type ModelCapabilities = {
  requiresStartImage: boolean;
  supportsEndFrame: boolean;
  supportsReference: boolean;
  maxReferenceImages: number;
  supportsAudio: boolean;
  supportsAiAudio: boolean;
  supportsCustomAudio: boolean;
  supportsMultiRatio: boolean;
  supportsMultiShot: boolean;
  supportsSpeedRamp: boolean;
  supportsCinematicParams: boolean;
  supportsPromptEnhancement: boolean;
  supportsBatch: boolean;
  maxVideoCount: number;
  videoCountOptions: number[];
  durations: number[];
  resolutions: string[];
  aspectRatios: SzenenAspectRatio[];
  showDuration: boolean;
  showResolution: boolean;
};

const ASPECT_RATIOS: SzenenAspectRatio[] = ["16:9", "9:16", "1:1", "4:3"];

const CINEMATIC_PROVIDERS = new Set(["SEEDANCE", "KLING", "MINIMAX", "GOOGLE"]);

function uniqueSortedCounts(maxCount: number): number[] {
  const options = [1, 2, 4].filter((n) => n <= maxCount);
  if (maxCount > 4 && !options.includes(maxCount)) {
    options.push(maxCount);
  }
  return options.length ? options : [1];
}

export function getModelCapabilities(
  model: SzenenGeneratorModel,
  resolution: string
): ModelCapabilities {
  const akool = model.akool;
  const durations = getModelDurations(model, resolution);
  const resolutions = getModelResolutions(model);

  const supportsEndFrame =
    model.supportsEnd || akool?.supportedLastFrame === true;
  const maxReferenceImages = Math.max(
    akool?.maxImageCount ?? 1,
    model.supportsReference ? 1 : 0
  );
  const supportsReference =
    model.supportsReference || maxReferenceImages > 1;

  const apiAudio = akool?.generateAudio;
  const supportsAudio =
    model.supportsAudio || apiAudio !== null && apiAudio !== undefined;
  const supportsAiAudio =
    apiAudio === true || (model.supportsAudio && apiAudio !== false);
  const supportsCustomAudio = supportsAudio;

  const supportsMultiRatio = modelSupportsTag(model, "Multi-Ratio");
  const supportsMultiShot = modelSupportsTag(model, "Multi-Shot");
  const maxVideoCount = akool?.maxCount ?? 1;
  const supportsBatch = maxVideoCount > 1;

  return {
    requiresStartImage: modelSupportsTag(model, "Start"),
    supportsEndFrame,
    supportsReference,
    maxReferenceImages,
    supportsAudio,
    supportsAiAudio,
    supportsCustomAudio,
    supportsMultiRatio,
    supportsMultiShot,
    supportsSpeedRamp:
      supportsMultiShot ||
      model.provider === "SEEDANCE" ||
      model.provider === "KLING",
    supportsCinematicParams: CINEMATIC_PROVIDERS.has(model.provider),
    supportsPromptEnhancement: akool?.supportedExtendPrompt === true,
    supportsBatch,
    maxVideoCount,
    videoCountOptions: supportsBatch ? uniqueSortedCounts(maxVideoCount) : [1],
    durations,
    resolutions,
    aspectRatios: supportsMultiRatio ? ASPECT_RATIOS : [],
    showDuration: durations.length > 1,
    showResolution: resolutions.length > 1,
  };
}

export function clampSelectionToCapabilities(
  caps: ModelCapabilities,
  selection: {
    duration: number;
    resolution: string;
    aspectRatio?: SzenenAspectRatio;
    videoCount: number;
    audioMode: SzenenAudioMode;
  }
): {
  duration: number;
  resolution: string;
  aspectRatio?: SzenenAspectRatio;
  videoCount: number;
  audioMode: SzenenAudioMode;
} {
  const duration = caps.durations.includes(selection.duration)
    ? selection.duration
    : (caps.durations[0] ?? 5);

  const resolution = caps.resolutions.includes(selection.resolution)
    ? selection.resolution
    : (caps.resolutions[0] ?? "720p");

  const aspectRatio =
    caps.aspectRatios.length && selection.aspectRatio
      ? caps.aspectRatios.includes(selection.aspectRatio)
        ? selection.aspectRatio
        : caps.aspectRatios[0]
      : undefined;

  const videoCount = caps.videoCountOptions.includes(selection.videoCount)
    ? selection.videoCount
    : 1;

  let audioMode = selection.audioMode;
  if (!caps.supportsAudio) {
    audioMode = "none";
  } else if (audioMode === "ai" && !caps.supportsAiAudio) {
    audioMode = caps.supportsCustomAudio ? "custom" : "none";
  } else if (audioMode === "custom" && !caps.supportsCustomAudio) {
    audioMode = caps.supportsAiAudio ? "ai" : "none";
  }

  return { duration, resolution, aspectRatio, videoCount, audioMode };
}

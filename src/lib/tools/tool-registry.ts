import type {
  ToolId,
  ToolModel,
  ToolParams,
  ToolRegistry,
} from "@/lib/tools/types";

function parseDurationValue(value: unknown): string | number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const match = value.match(/(\d+)/);
    return match ? `${match[1]}s` : value;
  }
  return undefined;
}

function pickUpload(
  uploads: Record<string, string> | undefined,
  ...keys: string[]
): string | undefined {
  if (!uploads) return undefined;
  for (const key of keys) {
    const value = uploads[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export const TOOL_REGISTRY: ToolRegistry = {
  "agent-autopilot": {
    label: "Agent Autopilot",
    route: "/dashboard/ki-agent",
    provider: "Influex Core",
    category: "automation",
    theme: "green",
    capabilities: {
      type: "text-generation",
      hasPrompt: true,
      hasModels: false,
      hasUploads: false,
      hasParams: false,
    },
    models: [],
    ui: {
      layout: "agent",
      primaryInput: "textarea",
      showPayload: true,
    },
    credits: { base: 1, unit: "pro Anfrage" },
    payload: (prompt: string, _model: ToolModel | null, params: ToolParams) => ({
      tool: "agent-autopilot",
      prompt,
      creatorDNA: params.creatorDNA ?? null,
      model: "claude-sonnet-4-5-20250929",
    }),
  },

  "szenen-generator": {
    label: "Szenen Generator",
    route: "/dashboard/szenen-generator",
    provider: "Akool + fal.ai",
    category: "video",
    theme: "blue",
    capabilities: {
      type: "image-to-video",
      hasPrompt: true,
      hasModels: true,
      hasUploads: true,
      hasParams: true,
    },
    models: [
      {
        id: "seedance-2.0-fast",
        name: "Seedance 2.0 Fast",
        provider: "Seedance",
        theme: "green",
        credits: 0,
        durations: ["2s", "5s", "8s"],
        resolutions: ["720p"],
        capabilities: {
          supportsStart: true,
          supportsEnd: true,
          supportsAudio: false,
          supportsReference: true,
          supportsCamera: true,
          supportsShotType: true,
          supportsExpression: true,
          supportsAtmosphere: true,
        },
        params: {
          cameraMovement: [
            "Keiner",
            "Rotate Around",
            "Zoom In",
            "Zoom Out",
            "Pan Left",
            "Pan Right",
          ],
          shotType: ["Keiner", "Wide", "Medium", "Close-Up", "Extreme Close-Up"],
          expression: ["Keiner", "Happy", "Sad", "Surprised", "Neutral"],
          atmosphere: ["Keiner", "Dramatic", "Romantic", "Mysterious"],
          light: ["None", "Golden Hour", "Soft", "Studio", "Natural"],
          effectEnhance: ["Keiner", "Leicht", "Mittel", "Stark"],
        },
      },
      {
        id: "seedance-2.0",
        name: "Seedance 2.0",
        provider: "Seedance",
        theme: "blue",
        credits: 0,
        durations: ["2s", "5s", "8s", "10s"],
        resolutions: ["720p", "1080p"],
        capabilities: {
          supportsStart: true,
          supportsEnd: true,
          supportsAudio: true,
          supportsReference: true,
          supportsCamera: true,
          supportsShotType: true,
          supportsExpression: true,
          supportsAtmosphere: true,
        },
        params: {
          cameraMovement: [
            "Keiner",
            "Rotate Around",
            "Zoom In",
            "Zoom Out",
            "Pan Left",
            "Pan Right",
            "Tilt Up",
            "Tilt Down",
          ],
          shotType: ["Keiner", "Wide", "Medium", "Close-Up", "Extreme Close-Up"],
          expression: ["Keiner", "Happy", "Sad", "Surprised", "Angry", "Neutral"],
          atmosphere: [
            "Keiner",
            "Dramatic",
            "Romantic",
            "Mysterious",
            "Energetic",
            "Peaceful",
          ],
          light: ["None", "Golden Hour", "Soft Box", "Studio", "Natural", "Neon"],
          effectEnhance: ["Keiner", "Leicht", "Mittel", "Stark"],
        },
      },
      {
        id: "kling-3.0-omni",
        name: "Kling 3.0 Omni",
        provider: "Kling",
        theme: "violet",
        credits: 0,
        durations: ["5s", "10s"],
        resolutions: ["1080p"],
        capabilities: {
          supportsStart: true,
          supportsEnd: true,
          supportsAudio: true,
          supportsReference: false,
          supportsCamera: true,
          supportsShotType: true,
          supportsExpression: true,
          supportsAtmosphere: true,
        },
        params: {
          cameraMovement: [
            "Static",
            "Rotate",
            "Zoom In",
            "Zoom Out",
            "Pan",
            "Tilt",
            "Crane",
          ],
          shotType: ["Wide", "Medium", "Close-Up", "Cinematic"],
          expression: ["Neutral", "Happy", "Intense", "Surprised"],
          atmosphere: ["Dramatic", "Golden", "Mystisch", "Clean"],
          light: ["Golden Hour", "Studio", "Natural", "Neon"],
          effectEnhance: ["Standard", "High", "Ultra"],
        },
      },
    ],
    ui: {
      layout: "video-studio",
      primaryInput: "textarea",
      showPayload: true,
    },
    credits: { base: 0, unit: "je Modell & Dauer" },
    payload: (
      prompt: string,
      model: ToolModel | null,
      params: ToolParams,
      uploads?: Record<string, string>
    ) => ({
      model: model?.id,
      prompt,
      image_url: pickUpload(uploads, "startImage", "imageUrl", "start"),
      last_frame_url: pickUpload(uploads, "endFrame", "lastFrameUrl", "end"),
      reference_image_url: pickUpload(uploads, "reference", "referenceUrl"),
      audio_url: pickUpload(uploads, "audio", "audioUrl"),
      duration: parseDurationValue(params.duration),
      resolution: params.resolution,
      parameters: {
        camera_movement: params.cameraMovement,
        shot_type: params.shotType,
        expression: params.expression,
        atmosphere: params.atmosphere,
        light: params.light,
        effect_enhance: params.effectEnhance,
      },
    }),
  },

  "story-creator": {
    label: "Story Creator",
    route: "/dashboard/story-creator",
    provider: "Akool",
    category: "video",
    theme: "blue",
    capabilities: {
      type: "text-to-video",
      hasPrompt: true,
      hasModels: true,
      hasUploads: true,
      hasParams: true,
    },
    models: [
      {
        id: "akool-t2v-fast",
        name: "Akool T2V Fast",
        provider: "Akool",
        theme: "green",
        credits: 30,
        durations: ["5s", "8s", "10s"],
        resolutions: ["720p", "1080p"],
        capabilities: {
          supportsStart: false,
          supportsEnd: false,
          supportsAudio: false,
          supportsReference: true,
          supportsCamera: true,
          supportsShotType: false,
          supportsExpression: false,
          supportsAtmosphere: false,
        },
        params: {
          aspectRatio: ["16:9", "9:16", "1:1", "4:3"],
          style: ["Realistic", "Cinematic", "Anime", "3D Render", "Illustration"],
          cameraMotion: ["Static", "Slow Pan", "Dynamic", "Handheld"],
        },
      },
    ],
    ui: {
      layout: "video-studio",
      primaryInput: "textarea",
      showPayload: true,
    },
    credits: { base: 30, unit: "pro Video" },
    payload: (
      prompt: string,
      model: ToolModel | null,
      params: ToolParams,
      uploads?: Record<string, string>
    ) => ({
      model: model?.id,
      prompt,
      reference_image: pickUpload(uploads, "referenceImage", "reference"),
      duration: parseDurationValue(params.duration),
      resolution: params.resolution,
      aspect_ratio: params.aspectRatio,
      style: params.style,
      camera_motion: params.cameraMotion,
    }),
  },

  "bild-generator": {
    label: "Bild Generator",
    route: "/dashboard/image-generator",
    provider: "fal.ai",
    category: "visuals",
    theme: "green",
    capabilities: {
      type: "text-to-image",
      hasPrompt: true,
      hasModels: true,
      hasUploads: false,
      hasParams: true,
    },
    models: [
      {
        id: "fal-ai/flux-2-pro",
        name: "Flux 2 Pro",
        provider: "fal.ai",
        theme: "blue",
        credits: 5,
        capabilities: {
          supportsNegativePrompt: false,
          supportsAspectRatio: true,
          supportsSteps: false,
          supportsGuidance: false,
          supportsSeed: true,
        },
        params: {
          aspectRatio: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"],
          outputCount: ["1", "2", "4"],
        },
      },
      {
        id: "fal-ai/flux-pro",
        name: "Flux Pro",
        provider: "fal.ai",
        theme: "blue",
        credits: 8,
        capabilities: {
          supportsNegativePrompt: true,
          supportsAspectRatio: true,
          supportsSteps: true,
          supportsGuidance: true,
          supportsSeed: true,
        },
        params: {
          aspectRatio: ["1:1", "16:9", "9:16", "4:3", "3:4"],
          steps: { min: 20, max: 50, default: 28 },
          guidance: { min: 1, max: 20, default: 3.5 },
          outputCount: ["1", "2", "4"],
        },
      },
    ],
    ui: {
      layout: "image-studio",
      primaryInput: "textarea",
      showPayload: true,
    },
    credits: { base: 5, unit: "pro Bild" },
    payload: (prompt: string, model: ToolModel | null, params: ToolParams) => ({
      model: model?.id,
      prompt,
      negative_prompt: params.negativePrompt,
      image_size: params.aspectRatio,
      num_images: params.outputCount,
      num_inference_steps: params.steps,
      guidance_scale: params.guidance,
      seed: params.seed,
    }),
  },
};

export function getToolConfig(toolId: ToolId) {
  return TOOL_REGISTRY[toolId];
}

export function getToolByRoute(pathname: string): ToolId | null {
  const normalized = pathname.split("?")[0]?.replace(/\/$/, "") ?? "";
  if (normalized === "/dashboard") return "agent-autopilot";

  const entries = Object.entries(TOOL_REGISTRY) as [ToolId, (typeof TOOL_REGISTRY)[ToolId]][];
  for (const [id, config] of entries) {
    if (normalized === config.route || normalized.startsWith(`${config.route}/`)) {
      return id;
    }
  }
  return null;
}

export function listRegistryTools() {
  return Object.entries(TOOL_REGISTRY).map(([id, config]) => ({
    id: id as ToolId,
    ...config,
  }));
}

export function getDefaultModel(toolId: ToolId): ToolModel | null {
  const config = TOOL_REGISTRY[toolId];
  return config.models[0] ?? null;
}

export function buildToolPayload(
  toolId: ToolId,
  prompt: string,
  model: ToolModel | null,
  params: ToolParams,
  uploads?: Record<string, string>
): Record<string, unknown> {
  return TOOL_REGISTRY[toolId].payload(prompt, model, params, uploads);
}

export function getDefaultParamsForModel(model: ToolModel): ToolParams {
  const defaults: ToolParams = {};
  if (model.durations?.[0]) defaults.duration = model.durations[0];
  if (model.resolutions?.[0]) defaults.resolution = model.resolutions[0];
  if (!model.params) return defaults;

  for (const [key, schema] of Object.entries(model.params)) {
    if (Array.isArray(schema)) {
      defaults[key] = schema[0];
    } else {
      defaults[key] = schema.default;
    }
  }
  return defaults;
}

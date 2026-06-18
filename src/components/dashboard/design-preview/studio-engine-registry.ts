/** Studio engine registry — design-preview command architecture (mock routing only) */

import type { PreviewIntent } from "./preview-intent";

export type StudioEngineId =
  | "flux-ultra-photo"
  | "lora-training"
  | "topaz-image-upscale"
  | "topaz-video-upscale"
  | "image-standard"
  | "reference-edit"
  | "motion-engine"
  | "campaign-engine"
  | "asset-engine"
  | "production-engine";

export type StudioEngineIntent =
  | "image_generation"
  | "ai_influencer"
  | "product_visual"
  | "product_visual_refinement"
  | "campaign_visual"
  | "lora_training"
  | "brand_style"
  | "image_upscale"
  | "video_upscale"
  | "motion_refinement"
  | "asset_reuse";

export type StudioEngineDefinition = {
  id: StudioEngineId;
  /** User-facing engine label — shown in workflow header */
  label: string;
  /** Tool label for capability registry */
  toolLabel?: string;
  /** Technical model name — advanced settings only */
  advancedLabel?: string;
  provider?: string;
  falModel?: string;
  intents: readonly StudioEngineIntent[];
  capabilities: readonly string[];
  recommendedFor: readonly string[];
  /** Preview MVP route (may include prepared query params) */
  mvpRoute: string;
  supportsExecution: boolean;
  executionHint: { de: string; en: string };
};

const FLUX_ULTRA_EXECUTION_HINT = {
  de: "Ultra Engine vorbereitet · Im Bild-Workflow öffnen",
  en: "Ultra engine prepared · Open in image workflow",
} as const;

export const STUDIO_ENGINES: Record<StudioEngineId, StudioEngineDefinition> = {
  "flux-ultra-photo": {
    id: "flux-ultra-photo",
    label: "InfluexAI Photo Engine Ultra",
    advancedLabel: "FLUX 1.1 Pro Ultra",
    provider: "fal.ai",
    falModel: "fal-ai/flux-pro/v1.1-ultra",
    intents: ["image_generation", "ai_influencer", "product_visual", "campaign_visual"],
    capabilities: [
      "prompt",
      "aspect_ratio",
      "style",
      "quality",
      "reference_image",
      "advanced_model_settings",
    ],
    recommendedFor: [
      "AI Influencer Visuals",
      "Premium Portraits",
      "Produktbilder",
      "Kampagnenmotive",
      "Editorial Ads",
    ],
    mvpRoute: "/dashboard?tool=image-gen&quality=ultra&engine=flux-ultra",
    supportsExecution: false,
    executionHint: FLUX_ULTRA_EXECUTION_HINT,
  },
  "lora-training": {
    id: "lora-training",
    label: "InfluexAI Training Engine",
    toolLabel: "Persona & Style Training",
    advancedLabel: "Flux LoRA",
    provider: "fal.ai",
    intents: ["lora_training", "ai_influencer", "brand_style"],
    capabilities: [
      "image_upload",
      "gallery_pick",
      "consent_required",
      "training_name",
      "training_description",
      "training_type",
      "quality",
      "advanced_model_settings",
      "training_status",
    ],
    recommendedFor: [
      "AI Influencer Personas",
      "Brand Style",
      "Produktstil",
      "Character Consistency",
      "Kampagnenserien",
    ],
    mvpRoute: "/dashboard/lora-training",
    supportsExecution: false,
    executionHint: {
      de: "Training vorbereiten · LoRA-Workflow öffnen",
      en: "Prepare training · Open LoRA workflow",
    },
  },
  "topaz-image-upscale": {
    id: "topaz-image-upscale",
    label: "InfluexAI Upscale Engine",
    advancedLabel: "Topaz Image Upscale",
    provider: "fal",
    falModel: "fal-ai/topaz/upscale/image",
    intents: ["image_upscale", "asset_reuse", "ai_influencer", "product_visual_refinement"],
    capabilities: [
      "image_upload",
      "gallery_pick",
      "current_asset_input",
      "upscale_factor",
      "output_format",
      "subject_detection",
      "face_enhancement",
      "face_enhancement_strength",
      "sharpen",
      "denoise",
      "fix_compression",
      "advanced_model_settings",
    ],
    recommendedFor: [
      "Export-Ready Bilder",
      "AI Influencer Portraits",
      "Produktvisuals",
      "Galerie-Assets",
      "Ads & Kampagnen",
    ],
    mvpRoute: "/dashboard/upscaler",
    supportsExecution: false,
    executionHint: {
      de: "Upscale vorbereitet · Im Upscaler öffnen",
      en: "Upscale prepared · Open in upscaler",
    },
  },
  "topaz-video-upscale": {
    id: "topaz-video-upscale",
    label: "InfluexAI Motion Upscale Engine",
    advancedLabel: "Topaz Video Upscale",
    provider: "fal",
    falModel: "fal-ai/topaz/upscale/video",
    intents: ["video_upscale", "asset_reuse", "motion_refinement"],
    capabilities: [
      "video_upload",
      "gallery_pick",
      "current_asset_input",
      "upscale_factor",
      "target_fps",
      "compression",
      "noise",
      "halo",
      "grain",
      "recover_detail",
      "h264_output",
      "advanced_model_settings",
    ],
    recommendedFor: [
      "Motion Export",
      "Seedance Clips",
      "Bild-zu-Video",
      "Galerie-Videos",
      "High-Detail Motion",
    ],
    mvpRoute: "/dashboard?tool=text-to-video",
    supportsExecution: false,
    executionHint: {
      de: "Video-Upscale vorbereitet · Im Motion-Workflow öffnen",
      en: "Video upscale prepared · Open in motion workflow",
    },
  },
  "image-standard": {
    id: "image-standard",
    label: "InfluexAI Image Engine",
    advancedLabel: "Krea 2 Large",
    provider: "fal.ai",
    intents: ["image_generation"],
    capabilities: ["prompt", "aspect_ratio", "style", "quality"],
    recommendedFor: ["Schnelle Bildideen", "Social Visuals", "Varianten"],
    mvpRoute: "/dashboard?tool=image-gen",
    supportsExecution: true,
    executionHint: {
      de: "Im Bild-Workflow öffnen",
      en: "Open in image workflow",
    },
  },
  "reference-edit": {
    id: "reference-edit",
    label: "InfluexAI Reference Engine",
    intents: ["image_generation"],
    capabilities: ["prompt", "reference_image", "aspect_ratio"],
    recommendedFor: ["Edits", "Remix", "Referenzbilder"],
    mvpRoute: "/dashboard?tool=img-to-img",
    supportsExecution: true,
    executionHint: {
      de: "Im Referenz-Workflow öffnen",
      en: "Open in reference workflow",
    },
  },
  "motion-engine": {
    id: "motion-engine",
    label: "InfluexAI Motion Engine",
    intents: [],
    capabilities: ["prompt", "duration", "motion_direction", "aspect_ratio"],
    recommendedFor: ["Reels", "Motion Clips", "Bild zu Video"],
    mvpRoute: "/dashboard?tool=img-to-video",
    supportsExecution: true,
    executionHint: {
      de: "Im Video-Workflow öffnen",
      en: "Open in video workflow",
    },
  },
  "campaign-engine": {
    id: "campaign-engine",
    label: "InfluexAI Campaign Engine",
    intents: [],
    capabilities: ["prompt", "planning"],
    recommendedFor: ["Kampagnenplanung", "Hooks", "Content-Ideen"],
    mvpRoute: "/dashboard?tool=content-calendar",
    supportsExecution: true,
    executionHint: {
      de: "Im Kampagnen-Workflow öffnen",
      en: "Open in campaign workflow",
    },
  },
  "asset-engine": {
    id: "asset-engine",
    label: "InfluexAI Asset Engine",
    intents: [],
    capabilities: ["reuse", "variant"],
    recommendedFor: ["Galerie", "Varianten", "Remix"],
    mvpRoute: "/dashboard/gallery",
    supportsExecution: true,
    executionHint: {
      de: "In Galerie öffnen",
      en: "Open in gallery",
    },
  },
  "production-engine": {
    id: "production-engine",
    label: "InfluexAI Production Engine",
    intents: [],
    capabilities: ["prompt"],
    recommendedFor: ["Allgemeine Produktion"],
    mvpRoute: "/dashboard?tool=tools",
    supportsExecution: true,
    executionHint: {
      de: "Tools öffnen",
      en: "Open tools",
    },
  },
};

const FLUX_ULTRA_EXPLICIT = [
  "flux ultra",
  "flux 1.1",
  "bestes foto",
  "bestes foto-modell",
  "best photo model",
  "photo engine ultra",
  "ultra foto",
  "ultra modell",
];

const PREMIUM_IMAGE_SIGNALS = [
  "premium",
  "hochwertig",
  "fotorealist",
  "realistisch",
  "editorial",
  "kampagnen",
  "campaign",
  "portrait",
  "produktfoto",
  "produktbild",
  "werbebild",
];

const REFERENCE_SIGNALS = ["referenz", "reference", "remix", "bearbeiten", "edit", "img-to-img"];

const VIDEO_SIGNALS = ["video", "reel", "motion", "animieren", "clip", "tiktok", "zu video"];

export function detectFluxUltraExplicit(input: string): boolean {
  const q = input.toLowerCase();
  return FLUX_ULTRA_EXPLICIT.some((k) => q.includes(k));
}

export function isPremiumImageRequest(input: string): boolean {
  const q = input.toLowerCase();
  return PREMIUM_IMAGE_SIGNALS.some((k) => q.includes(k));
}

export function resolveEngineForIntent(
  intent: PreviewIntent,
  input: string
): StudioEngineDefinition {
  const q = input.toLowerCase().trim();

  if (intent === "image_to_video") return STUDIO_ENGINES["motion-engine"];
  if (intent === "image_upscale") return STUDIO_ENGINES["topaz-image-upscale"];
  if (intent === "video_upscale") return STUDIO_ENGINES["topaz-video-upscale"];
  if (intent === "ai_creator" || intent === "lora_training") {
    return STUDIO_ENGINES["lora-training"];
  }
  if (intent === "hook_generation" || intent === "campaign_planning") {
    return STUDIO_ENGINES["campaign-engine"];
  }
  if (intent === "asset_reuse") return STUDIO_ENGINES["asset-engine"];
  if (intent === "unknown") return STUDIO_ENGINES["production-engine"];

  if (REFERENCE_SIGNALS.some((k) => q.includes(k))) {
    return STUDIO_ENGINES["reference-edit"];
  }

  if (
    intent === "ai_influencer" ||
    intent === "product_visual" ||
    detectFluxUltraExplicit(q) ||
    (intent === "image_generation" && isPremiumImageRequest(q))
  ) {
    return STUDIO_ENGINES["flux-ultra-photo"];
  }

  if (intent === "image_generation") return STUDIO_ENGINES["image-standard"];

  return STUDIO_ENGINES["production-engine"];
}

export function detectEngineMismatch(
  input: string,
  intent: PreviewIntent,
  lang: "de" | "en"
): string | null {
  const q = input.toLowerCase();
  const wantsUltra =
    detectFluxUltraExplicit(q) || intent === "ai_influencer" || intent === "product_visual";
  const wantsVideo = VIDEO_SIGNALS.some((k) => q.includes(k));

  if (wantsUltra && wantsVideo) {
    return lang === "de"
      ? "Flux Ultra ist für Premium-Bilder geeignet. Für Video kann ich danach Motion Engine öffnen."
      : "Flux Ultra is built for premium stills. I can open Motion Engine for video next.";
  }

  return null;
}

export function engineLabelForIntent(intent: PreviewIntent, input = ""): string {
  return resolveEngineForIntent(intent, input).label;
}

export function isUltraPhotoEngine(engine: StudioEngineDefinition): boolean {
  return engine.id === "flux-ultra-photo";
}

export function isLoraTrainingEngine(engine: StudioEngineDefinition): boolean {
  return engine.id === "lora-training";
}

export function isTopazImageUpscaleEngine(engine: StudioEngineDefinition): boolean {
  return engine.id === "topaz-image-upscale";
}

export function isTopazVideoUpscaleEngine(engine: StudioEngineDefinition): boolean {
  return engine.id === "topaz-video-upscale";
}

export function getAgentCapabilityHint(
  intent: PreviewIntent,
  input: string,
  lang: "de" | "en",
  opts?: { hasImageAsset?: boolean; hasVideoAsset?: boolean }
): string | null {
  const de = lang === "de";
  const q = input.toLowerCase();
  const hasImageAsset = opts?.hasImageAsset ?? false;
  const hasVideoAsset = opts?.hasVideoAsset ?? false;

  if (intent === "image_upscale" && !hasImageAsset) {
    return de
      ? "Für Bild-Upscale brauche ich ein Quellbild — Upload, Galerie oder ein frisch erzeugtes Ergebnis."
      : "Image upscale needs a source — upload, gallery, or a freshly generated result.";
  }

  if (intent === "video_upscale" && !hasVideoAsset) {
    return de
      ? "Für Video-Upscale brauche ich ein Quellvideo — Upload, Galerie oder ein Motion-Ergebnis."
      : "Video upscale needs a source video — upload, gallery, or a motion result.";
  }

  if (intent === "ai_creator" || intent === "lora_training") {
    return de
      ? "AI Creator & LoRA Training — Persona aufbauen, Referenzen prüfen, Consent bestätigen, Training vorbereiten."
      : "AI Creator & LoRA training — build persona, review references, confirm consent, prepare training.";
  }

  if (
    intent === "ai_influencer" ||
    (intent === "image_generation" && q.includes("portrait"))
  ) {
    return de
      ? "AI Influencer & Portrait profitieren besonders von Topaz Image Upscale vor Export."
      : "AI influencer and portrait workflows benefit most from Topaz image upscale before export.";
  }

  if (intent === "image_to_video" || VIDEO_SIGNALS.some((k) => q.includes(k))) {
    return de
      ? "Seedance & generierte Motion eignen sich gut für Topaz Video Upscale nach der Erstellung."
      : "Seedance and generated motion work well with Topaz video upscale after creation.";
  }

  if (detectFluxUltraExplicit(q) || intent === "product_visual") {
    return de
      ? "Flux Ultra liefert bereits High-Quality-Bilder — Upscale ist optional für Export und Ads."
      : "Flux Ultra already delivers high-quality stills — upscale is optional for export and ads.";
  }

  if (intent === "asset_reuse") {
    return de
      ? "Galerie-Assets kann ich direkt mit Upscale veredeln — Bild oder Video je nach Asset."
      : "Gallery assets can be refined with upscale — image or video depending on the asset.";
  }

  return null;
}

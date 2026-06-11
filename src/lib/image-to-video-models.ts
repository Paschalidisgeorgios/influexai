import type { Locale } from "@/lib/locale";
import {
  KLING_25_CATEGORY,
  KLING_25_CREDIT_COST,
  KLING_25_DESCRIPTION,
  KLING_25_PROVIDER,
  KLING_25_PROVIDER_ENABLED,
  KLING_25_SAFETY_HINT,
  KLING_25_TURBO_PRO_IMAGE_TO_VIDEO_MODEL,
  KLING_25_UI_BADGE,
  KLING_25_UI_NAME,
  KLING_25_UI_SUBLINE,
} from "@/lib/kling25-config";
import {
  SEEDANCE_CREDIT_COST,
  SEEDANCE_MODEL,
  SEEDANCE_UI_NAME,
} from "@/lib/seedance-config";

export type ImageToVideoModelId = "seedance" | "kling25_turbo_pro";

export type ImageToVideoModelConfig = {
  id: ImageToVideoModelId;
  modelId: string;
  label: string;
  category: string;
  badge?: string;
  creditCost: number;
  provider: string;
  /** When false, UI is shown but no provider job is started. */
  providerEnabled: boolean;
  requiresReferenceImage: true;
  description: { de: string; en: string };
  safetyHint: { de: string; en: string };
  subline: { de: string; en: string };
};

export const IMAGE_TO_VIDEO_MODELS: readonly ImageToVideoModelConfig[] = [
  {
    id: "seedance",
    modelId: SEEDANCE_MODEL,
    label: SEEDANCE_UI_NAME,
    category: "Video / Image-to-Video",
    creditCost: SEEDANCE_CREDIT_COST,
    provider: "akool",
    providerEnabled: true,
    requiresReferenceImage: true,
    description: {
      de: "Statisches Bild in bewegtes Video — alle verfügbaren Modelle.",
      en: "Turn a still image into motion video using available models.",
    },
    safetyHint: {
      de: "Benötigt ein Referenzbild und eine Motion-Beschreibung.",
      en: "Requires a reference image and a motion description.",
    },
    subline: {
      de: "Image-to-Video · Szenen Generator",
      en: "Image-to-video · Scene Generator",
    },
  },
  {
    id: "kling25_turbo_pro",
    modelId: KLING_25_TURBO_PRO_IMAGE_TO_VIDEO_MODEL,
    label: KLING_25_UI_NAME,
    category: KLING_25_CATEGORY,
    badge: KLING_25_UI_BADGE,
    creditCost: KLING_25_CREDIT_COST,
    provider: KLING_25_PROVIDER,
    providerEnabled: KLING_25_PROVIDER_ENABLED,
    requiresReferenceImage: true,
    description: KLING_25_DESCRIPTION,
    safetyHint: KLING_25_SAFETY_HINT,
    subline: KLING_25_UI_SUBLINE,
  },
] as const;

const MODEL_BY_ID = Object.fromEntries(
  IMAGE_TO_VIDEO_MODELS.map((model) => [model.id, model])
) as Record<ImageToVideoModelId, ImageToVideoModelConfig>;

/** Models users can pick in the Image-to-Video UI (provider must be enabled). */
export function getSelectableImageToVideoModels(): ImageToVideoModelConfig[] {
  return IMAGE_TO_VIDEO_MODELS.filter((model) => model.providerEnabled);
}

export function getImageToVideoModel(
  id: ImageToVideoModelId
): ImageToVideoModelConfig {
  return MODEL_BY_ID[id];
}

export function parseImageToVideoModelId(
  raw: string | null | undefined
): ImageToVideoModelId {
  if (raw === "kling25_turbo_pro" || raw === "kling25") {
    const kling = MODEL_BY_ID.kling25_turbo_pro;
    if (kling?.providerEnabled) {
      return "kling25_turbo_pro";
    }
  }
  return "seedance";
}

export function pickLocalizedText(
  locale: Locale | string,
  text: { de: string; en: string }
): string {
  return locale === "de" ? text.de : text.en;
}

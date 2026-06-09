import { FAL_CREDITS } from "@/lib/fal-credits";

/** fal.ai Kling 2.5 Turbo Pro — image-to-video (primary integration target). */
export const KLING_25_TURBO_PRO_IMAGE_TO_VIDEO_MODEL =
  "fal-ai/kling-video/v2.5-turbo/pro/image-to-video" as const;

/** Registered for future use — platform has no text-to-video inputs yet. */
export const KLING_25_TURBO_PRO_TEXT_TO_VIDEO_MODEL =
  "fal-ai/kling-video/v2.5-turbo/pro/text-to-video" as const;

export const KLING_25_TEXT_TO_VIDEO_ENABLED = false;

export const KLING_25_CREDIT_COST = FAL_CREDITS.kling25TurboProVideo;

export const KLING_25_UI_NAME = "Kling 2.5 Turbo Pro";

export const KLING_25_CATEGORY = "Video / Image-to-Video";

export const KLING_25_PROVIDER = "fal.ai" as const;

/** Provider execution disabled until explicitly enabled after review. */
export const KLING_25_PROVIDER_ENABLED = false;

export const KLING_25_DESCRIPTION = {
  de: "Premium Image-to-Video für flüssige, cineastische Motion aus einem Referenzbild.",
  en: "Premium image-to-video for smooth, cinematic motion from a reference image.",
} as const;

export const KLING_25_SAFETY_HINT = {
  de: "Benötigt ein Referenzbild. Für beste Ergebnisse klare Motion-Anweisung verwenden.",
  en: "Requires a reference image. Use a clear motion instruction for best results.",
} as const;

export const KLING_25_UI_BADGE = "Premium";

export const KLING_25_UI_SUBLINE = {
  de: "Image-to-Video · Referenzbild erforderlich",
  en: "Image-to-video · reference image required",
} as const;

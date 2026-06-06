import { FAL_CREDITS } from "@/lib/fal-credits";

export const IMAGE_GEN_CREDITS = {
  standard: FAL_CREDITS.fluxDev,
  highRes: FAL_CREDITS.fluxProT2i,
  upscale: FAL_CREDITS.clarityUpscaler,
  download: 1,
  variation: FAL_CREDITS.fluxDev,
} as const;

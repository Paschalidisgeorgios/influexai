/** InfluexAI credit costs aligned with fal.ai API pricing. */
export const FAL_CREDITS = {
  /** Kling image-to-video (~20s) */
  klingVideo: 75,
  /** Seedance image-to-video (5s) */
  seedanceVideo: 25,
  /** Flux Pro text-to-image */
  fluxProT2i: 8,
  /** Flux Dev text-to-image */
  fluxDev: 5,
  /** Clarity upscaler */
  clarityUpscaler: 4,
  /** Flux PuLID (Mein KI-Ich) */
  fluxPulid: 8,
  /** Live Creator live-portrait frame */
  liveCreatorPortrait: 20,
} as const;

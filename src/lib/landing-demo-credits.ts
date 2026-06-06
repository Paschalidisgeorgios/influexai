/** Client-safe credit costs for landing demo badges (mirrors server tool configs). */
export const LANDING_DEMO_CREDITS = {
  /** generate-script.ts GENERATE_COST */
  script: 2,
  /** PRODUCT_AD_CREDITS.standard (FAL klingVideo) */
  product: 75,
  /** VIRAL_HOOK_EXTRACTOR_CREDIT_COST */
  viralHook: 1,
  /** CONTENT_KALENDER_TOOL_CREDIT_COST */
  contentKalender: 2,
  /** FAL_CREDITS.fluxPulid (Mein KI-Ich) */
  kiIch: 8,
} as const;

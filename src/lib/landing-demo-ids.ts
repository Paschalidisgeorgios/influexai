/** Landing demo step/scene IDs — content lives in landingPage.demos i18n keys. */

export const STACKED_DEMO_STEP_IDS = [
  "script",
  "product",
  "viral_hook",
  "content_kalender",
  "avatar",
] as const;

export type StackedDemoStepId = (typeof STACKED_DEMO_STEP_IDS)[number];

export const HERO_SCENE_IDS = [
  "kalender",
  "hooks",
  "produkt",
  "visual",
  "avatar",
] as const;

export type HeroSceneId = (typeof HERO_SCENE_IDS)[number];

export const ACTIVITY_STREAM_IDS = [
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
  "a7",
  "a8",
  "a9",
  "a10",
  "a11",
  "a12",
] as const;

export const CAMPAIGN_MODE_IDS = ["sprint", "weekly", "monthly"] as const;

export const QUALITY_CHECK_IDS = ["text", "visual", "brand"] as const;

export const STACKED_SCORE_KEYS: Record<
  StackedDemoStepId,
  readonly string[]
> = {
  script: ["hook", "clarity", "risk"],
  product: ["hook", "clarity", "risk"],
  viral_hook: ["hook", "scroll_stop", "risk"],
  content_kalender: ["plan", "platform", "risk"],
  avatar: ["consistency", "consent", "risk"],
};

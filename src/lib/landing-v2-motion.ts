/** GSAP depth presets — landing preview scroll story */

/** Fullscreen brand overlay — auto-start delay (ms) */
export const BRAND_INTRO_AUTO_DELAY_MS = {
  desktop: 550,
  mobile: 400,
  reduced: 120,
} as const;

/** Dissolve timeline length (seconds) */
export const BRAND_INTRO_DURATION_S = {
  desktop: 1.45,
  mobile: 1.05,
  reduced: 0.28,
} as const;

/** When hero line-reveal starts within dissolve (seconds from play) */
export const BRAND_INTRO_HERO_READY_AT_S = {
  desktop: 0.48,
  mobile: 0.34,
  reduced: 0,
} as const;

/** Asset-only depth — text stays flat */
export const STORY_ASSET_DEPTH = {
  hidden: {
    autoAlpha: 0,
    scale: 0.97,
    z: -40,
  },
  active: {
    autoAlpha: 1,
    scale: 1,
    z: 0,
  },
} as const;

/** @deprecated Text panels — use STORY_ASSET_DEPTH */
export const STORY_PANEL_DEPTH = {
  hidden: {
    autoAlpha: 0,
    scale: 0.97,
    z: -40,
    rotateX: 0,
    rotateY: 0,
  },
  inactive: {
    autoAlpha: 0,
    scale: 0.97,
    z: -40,
    rotateX: 0,
    rotateY: 0,
  },
  previous: {
    autoAlpha: 0,
    scale: 0.98,
    z: -20,
    rotateX: 0,
    rotateY: 0,
  },
  active: {
    autoAlpha: 1,
    scale: 1,
    z: 0,
    rotateX: 0,
    rotateY: 0,
  },
} as const;

/** @deprecated Pin removed — chapters scroll normally */
export const STORY_PIN_SCROLL_VH = 0;

export const STUDIO_PANEL_DEPTH = [
  { z: 72, rotateY: -6, rotateX: 3, y: -4, scale: 1 },
  { z: 36, rotateY: 5, rotateX: -2, y: 6, scale: 0.98 },
  { z: 18, rotateY: -4, rotateX: 2, y: -8, scale: 0.97 },
  { z: 88, rotateY: 4, rotateX: -3, y: 2, scale: 1 },
] as const;

/** GSAP depth presets — landing preview scroll story */

/** Fullscreen brand overlay — delay before timeline plays (ms) */
export const BRAND_INTRO_AUTO_DELAY_MS = {
  desktop: 180,
  mobile: 120,
  reduced: 80,
} as const;

/** Minimum time intro must remain visible before scroll can accelerate exit (ms) */
export const BRAND_INTRO_MIN_VISIBLE_MS = 1200;

/** Brand intro phase durations (seconds) — desktop total ~3.3s */
export const BRAND_INTRO_PHASES = {
  desktop: {
    fadeIn: 0.5,
    hold: 0.9,
    breath: 0.6,
    signal: 1.05,
    dissolve: 0.55,
    overlayFade: 0.85,
  },
  mobile: {
    fadeIn: 0.35,
    hold: 0.55,
    breath: 0.4,
    signal: 0.45,
    dissolve: 0.5,
    overlayFade: 0.55,
  },
} as const;

/** Hero line-reveal fires when logo dissolve is ~65% complete */
export const BRAND_INTRO_HERO_DISSOLVE_PROGRESS = 0.65;

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

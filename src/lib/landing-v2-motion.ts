/** GSAP depth presets — landing preview scroll story */

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

/** Viewport-heights of scroll per pinned story (reduced for stable pin release) */
export const STORY_PIN_SCROLL_VH = 52;

export const STUDIO_PANEL_DEPTH = [
  { z: 72, rotateY: -6, rotateX: 3, y: -4, scale: 1 },
  { z: 36, rotateY: 5, rotateX: -2, y: 6, scale: 0.98 },
  { z: 18, rotateY: -4, rotateX: 2, y: -8, scale: 0.97 },
  { z: 88, rotateY: 4, rotateX: -3, y: 2, scale: 1 },
] as const;

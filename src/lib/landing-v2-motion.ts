/** GSAP depth presets — landing preview scroll story */

export const STORY_PANEL_DEPTH = {
  hidden: {
    autoAlpha: 0,
    scale: 0.92,
    z: -220,
    rotateX: 9,
    rotateY: 0,
  },
  inactive: {
    autoAlpha: 0.36,
    scale: 0.94,
    z: -190,
    rotateX: 8,
    rotateY: 0,
  },
  previous: {
    autoAlpha: 0.52,
    scale: 0.96,
    z: -120,
    rotateX: -7,
    rotateY: 0,
  },
  active: {
    autoAlpha: 1,
    scale: 1,
    z: 80,
    rotateX: 0,
    rotateY: 0,
  },
} as const;

export const STORY_PIN_SCROLL_VH = 95;

export const STUDIO_PANEL_DEPTH = [
  { z: 72, rotateY: -6, rotateX: 3, y: -4, scale: 1 },
  { z: 36, rotateY: 5, rotateX: -2, y: 6, scale: 0.98 },
  { z: 18, rotateY: -4, rotateX: 2, y: -8, scale: 0.97 },
  { z: 88, rotateY: 4, rotateX: -3, y: 2, scale: 1 },
] as const;

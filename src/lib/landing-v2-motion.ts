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

/** Hero product panel — scroll + mouse depth */
export const HERO_PARALLAX = {
  scroll: { y: -36, scale: 0.97, z: 28 },
  mouse: { rotateY: 4, rotateX: 2 },
  ambient: { yPercent: 10, scale: 1.05 },
} as const;

/** Preview hero — video stage parallax (subtle — no zoom-out effect) */
export const HERO_VIDEO_STAGE = {
  opacityStart: 0.52,
  opacityEnd: 0.38,
  scrollY: 24,
  scrollScale: 1,
  videoScaleFrom: 1.05,
  videoScaleTo: 1,
  videoYPercent: 2,
} as const;

/** Editorial chapter video — enter / peak / exit on scroll */
export const EDITORIAL_VIDEO_SCROLL = {
  enter: { opacity: 0.38, scale: 1.03, y: 32 },
  peak: { opacity: 0.58, scale: 1, y: 0 },
  exit: { opacity: 0.28, scale: 0.97, y: -24 },
  video: { scaleFrom: 1.06, scaleTo: 1 },
} as const;

/** Preview hero — entrance timeline (headline words + Motion signal) */
export const HERO_ENTRANCE = {
  word: {
    y: 32,
    opacity: 0,
    duration: 0.82,
    stagger: 0.07,
    ease: "power3.out" as const,
    delay: 0.1,
  },
  subline: { delay: 0.56, duration: 0.68 },
  cta: { delay: 0.7, duration: 0.58, stagger: 0.08 },
  motionSignal: {
    brightnessPeak: 1.14,
    brightnessIn: 0.22,
    brightnessOut: 0.38,
    lineIn: 0.48,
    lineFade: 0.32,
    lineHold: 0.14,
  },
} as const;

/** Preview hero — rotating full headline (legacy) */
export const HERO_ROTATE_COPY = {
  intervalMs: 3600,
  intervalReducedMs: 8000,
  enter: { y: 18, opacity: 0, duration: 0.68, ease: "power3.out" },
  exit: { y: -12, opacity: 0, duration: 0.55, ease: "power3.in" },
  keyword: { fromOpacity: 0.72, toOpacity: 1, duration: 0.72, ease: "power2.out" },
} as const;

/** Preview hero — single lime keyword rotation */
export const HERO_KEYWORD_ROTATE = {
  intervalMinMs: 3500,
  intervalMaxMs: 4500,
  intervalReducedMs: 12000,
  entranceDelayMs: 2400,
  exit: { y: -16, opacity: 0, duration: 0.42, ease: "power2.in" as const },
  enter: { y: 20, opacity: 0, duration: 0.68, ease: "power3.out" as const },
  pulse: { brightnessPeak: 1.1, durationIn: 0.18, durationOut: 0.28 },
} as const;

/** Preview hero — scroll-fading backdrop video (single mp4) */
export const HERO_VIDEO_BG = {
  opacityStart: 0.58,
  opacityEnd: 0.22,
  scaleStart: 1.03,
  scaleEnd: 1,
  scrimOpacityStart: 1,
  scrimOpacityEnd: 1.18,
  readabilityScrimStart: 1,
  readabilityScrimEnd: 1.22,
  scrub: 0.55,
} as const;

/** Global landing background — scroll-linked lime glow */
export const LANDING_BACKGROUND_GLOW = {
  yMax: 180,
  xStart: -40,
  xEnd: 60,
  opacityMin: 0.82,
  opacityMax: 1,
  scrub: 0.85,
} as const;

/** Preview hero — subtle parallax only */
export const HERO_PARALLAX_PREVIEW = {
  scroll: { y: -18, scale: 1, z: 0 },
  mouse: { rotateY: 2, rotateX: 1 },
  video: { scaleFrom: 1.02, scaleTo: 1, yPercent: 2 },
  ambient: { yPercent: 2, scale: 1.02 },
} as const;

/** Section reveal presets */
export const SECTION_REVEAL = {
  standard: { start: "top 78%", y: 22, opacity: 0 },
  preview: { start: "top 82%", y: 36, opacity: 0.72 },
} as const;

/** Workflow stage visual frames — no pin, no rotate on text-adjacent frames */
export const WORKFLOW_STAGE_MOTION = {
  enter: { y: 40, scale: 0.97, opacity: 0.55 },
  peak: { y: 0, scale: 1, opacity: 1 },
  exit: { y: -12, scale: 0.98, opacity: 0.88 },
} as const;

/** Editorial production path blocks */
export const PATHS_REVEAL = {
  y: 50,
  stagger: 0.15,
  duration: 0.8,
} as const;

/** Output gallery — per-item scroll offsets (desktop) */
export const GALLERY_PARALLAX = [
  { yPercent: -8, scale: 1.02 },
  { yPercent: 6, scale: 0.99 },
  { yPercent: -5, scale: 1.015 },
  { yPercent: 7, scale: 0.985 },
] as const;

/** Creator production flow — station reveal on scroll */
export const CREATOR_FLOW_REVEAL = {
  start: "top 82%",
  stationY: 22,
  stagger: 0.14,
  duration: 0.75,
  lineDuration: 1.35,
} as const;

/** System model — command-first dashboard story reveal */
export const SYSTEM_MODEL_REVEAL = {
  start: "top 84%",
  stepY: 18,
  stagger: 0.1,
  duration: 0.65,
  lineDuration: 1.1,
} as const;

export type MediaStageBlend = {
  layers: Record<
    "hero" | "system" | "workflow" | "studio" | "outputs",
    number
  >;
  scrim: number;
  primaryScale: number;
  primaryY: number;
  secondaryScale: number;
  secondaryY: number;
};

/** Cinematic media stage — scroll blends (preview only) */
export const MEDIA_STAGE_SCROLL = {
  heroScrub: 0.72,
  heroHook: {
    heroOpacity: 1,
    heroFade: 0.55,
    systemRise: 0.42,
    scrimStart: 0.32,
    scrimDelta: 0.18,
    scaleStart: 1.05,
    scaleDelta: 0.04,
    yDelta: 3,
  },
  blends: {
    hero: {
      layers: { hero: 1, system: 0, workflow: 0, studio: 0, outputs: 0 },
      scrim: 0.32,
      primaryScale: 1.05,
      primaryY: 0,
      secondaryScale: 1.03,
      secondaryY: 0,
    },
    system: {
      layers: { hero: 0.35, system: 0.85, workflow: 0.12, studio: 0, outputs: 0 },
      scrim: 0.48,
      primaryScale: 1.03,
      primaryY: 2,
      secondaryScale: 1.03,
      secondaryY: 0,
    },
    workflow: {
      layers: { hero: 0.12, system: 0.25, workflow: 0.92, studio: 0.08, outputs: 0 },
      scrim: 0.52,
      primaryScale: 1.02,
      primaryY: 3,
      secondaryScale: 1.04,
      secondaryY: 1,
    },
    studio: {
      layers: { hero: 0.08, system: 0.15, workflow: 0.28, studio: 0.88, outputs: 0.1 },
      scrim: 0.58,
      primaryScale: 1,
      primaryY: 4,
      secondaryScale: 1.03,
      secondaryY: 2,
    },
    outputs: {
      layers: { hero: 0.05, system: 0.1, workflow: 0.22, studio: 0.35, outputs: 0.9 },
      scrim: 0.62,
      primaryScale: 1,
      primaryY: 5,
      secondaryScale: 1.04,
      secondaryY: 3,
    },
  } satisfies Record<string, MediaStageBlend>,
} as const;

/** Lenis / window scroll bridge — nav progress reads this when smooth scroll is active */
let landingScrollY = 0;
let landingLenisActive = false;

export function syncLandingScrollY(y: number) {
  landingLenisActive = true;
  landingScrollY = y;
}

export function resetLandingScrollY() {
  landingLenisActive = false;
  landingScrollY = 0;
}

export function readLandingScrollY(): number {
  if (typeof window === "undefined") return 0;
  if (landingLenisActive) return landingScrollY;
  return window.scrollY || document.documentElement.scrollTop || 0;
}

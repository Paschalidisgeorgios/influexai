export const LANDING_GLOW_SECTIONS = ["create", "visuals", "video", "pricing"] as const;

export type LandingGlowSection = (typeof LANDING_GLOW_SECTIONS)[number];

export const LANDING_GLOW_DATA_ATTR = "data-landing-glow";

export const LANDING_GLOW_THRESHOLD = 0.3;

export const LANDING_GLOW_OBSERVER_THRESHOLDS = [
  0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
] as const;

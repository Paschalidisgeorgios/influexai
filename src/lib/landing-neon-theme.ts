/** Central neon AI tokens for landing page (TS / inline styles). Prefer CSS vars in .landing-neon. */
export const LANDING_NEON = {
  green: "#CCFF00",
  blue: "#00D5FF",
  yellow: "#FFD84D",
  cyan: "#00F0FF",
  violet: "#8B5DFF",
  magenta: "#FF4DDF",
  bgPrimary: "#030304",
  bgSecondary: "#0A0D12",
  textPrimary: "#F5F7FA",
  textSecondary: "rgba(255,255,255,0.68)",
  greenRgb: "204,255,0",
  blueRgb: "0,213,255",
  yellowRgb: "255,216,77",
  cyanRgb: "0,240,255",
  violetRgb: "139,93,255",
  magentaRgb: "255,77,223",
} as const;

export type LandingNeonAccent = "green" | "blue" | "violet" | "yellow";

export const LANDING_SECTION_ACCENTS: LandingNeonAccent[] = ["green", "blue", "violet"];

export const LANDING_ACCENT_RGB: Record<LandingNeonAccent, string> = {
  green: LANDING_NEON.greenRgb,
  blue: LANDING_NEON.blueRgb,
  violet: LANDING_NEON.violetRgb,
  yellow: LANDING_NEON.yellowRgb,
};

export const LANDING_BENTO_ACCENT_RGB = {
  green: LANDING_NEON.greenRgb,
  blue: LANDING_NEON.blueRgb,
  gold: LANDING_NEON.yellowRgb,
} as const;

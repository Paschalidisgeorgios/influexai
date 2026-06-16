/** InfluexAI Studio design tokens — ivory stage on dark shell */

export const STUDIO_SHELL_BG = "#050506";
export const STUDIO_IVORY = "#FAF6EE";
export const STUDIO_STONE = "#EBE2D2";
export const STUDIO_TEXT = "#080808";
export const STUDIO_MUTED = "rgba(8,8,8,0.58)";
export const STUDIO_ACCENT = "#b4ff00";
export const STUDIO_SURFACE =
  "linear-gradient(148deg, #FAF6EE 0%, #F5EFE3 46%, #EBE2D2 100%)";
export const STUDIO_PANEL_BG = "rgba(255,252,247,0.78)";
export const STUDIO_INPUT_BG = "#FFFCF7";

export const STUDIO_RADIUS = {
  stage: "rounded-[32px]",
  panel: "rounded-[24px]",
  input: "rounded-[18px]",
  button: "rounded-full",
  pill: "rounded-full",
  card: "rounded-[20px]",
} as const;

export const STUDIO_SHADOW = {
  stage:
    "0 0 0 1px rgba(255,255,255,0.35), 0 32px 80px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.72)",
  panel: "0 2px 24px rgba(8,8,8,0.04), inset 0 1px 0 rgba(255,255,255,0.85)",
  card: "0 1px 16px rgba(8,8,8,0.04)",
} as const;

/** InfluexAI Studio design tokens — ivory glass stage on dark shell */

export const STUDIO_SHELL_BG = "#050506";

/** Subtle radial depth — no loud effects, no color noise */
export const STUDIO_SHELL_GRADIENT =
  "radial-gradient(ellipse 110% 75% at 50% -18%, rgba(255,255,255,0.045) 0%, transparent 58%), radial-gradient(ellipse 70% 55% at 8% 100%, rgba(255,255,255,0.025) 0%, transparent 50%), #050506";

export const STUDIO_IVORY = "#FAF6EE";
export const STUDIO_STONE = "#EBE2D2";
export const STUDIO_TEXT = "#080808";
export const STUDIO_MUTED = "rgba(8,8,8,0.58)";
export const STUDIO_ACCENT = "#b4ff00";

/** Opaque reference gradient (legacy / exports) */
export const STUDIO_SURFACE =
  "linear-gradient(148deg, #FAF6EE 0%, #F5EFE3 46%, #EBE2D2 100%)";

/** Warm ivory glass — alpha only, pair with backdrop-blur on stage */
export const STUDIO_SURFACE_GLASS =
  "linear-gradient(148deg, rgba(250,246,238,0.86) 0%, rgba(245,239,227,0.80) 48%, rgba(235,226,210,0.76) 100%)";

export const STUDIO_STAGE_BORDER = "rgba(255,255,255,0.38)";

export const STUDIO_PANEL_BG = "rgba(255,255,255,0.55)";
export const STUDIO_INPUT_BG = "rgba(255,252,247,0.88)";

export const STUDIO_CARD_BG = "rgba(255,255,255,0.55)";
export const STUDIO_CARD_BG_HOVER = "rgba(255,255,250,0.68)";
export const STUDIO_CARD_BG_SOFT = "rgba(255,250,242,0.52)";
export const STUDIO_CARD_BG_FEATURED = "rgba(255,252,247,0.68)";
export const STUDIO_CARD_BORDER = "rgba(255,255,255,0.45)";

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
    "0 1px 0 rgba(255,255,255,0.48) inset, 0 40px 96px rgba(0,0,0,0.22), 0 12px 36px rgba(0,0,0,0.09)",
  panel: "0 1px 0 rgba(255,255,255,0.35) inset, 0 8px 28px rgba(8,8,8,0.05)",
  card: "0 1px 0 rgba(255,255,255,0.28) inset, 0 4px 20px rgba(8,8,8,0.04)",
  cardHover: "0 1px 0 rgba(255,255,255,0.32) inset, 0 12px 36px rgba(8,8,8,0.07)",
  featured:
    "0 1px 0 rgba(255,255,255,0.42) inset, 0 10px 32px rgba(8,8,8,0.06), 0 2px 8px rgba(8,8,8,0.03)",
} as const;

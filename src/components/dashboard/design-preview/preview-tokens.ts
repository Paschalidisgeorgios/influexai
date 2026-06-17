/** Shared design tokens — design-preview only */

import type { CSSProperties } from "react";

export const PREVIEW_ACCENT = "#b4ff00";
export const PREVIEW_SHELL = "#050506";
export const PREVIEW_DARK = "#080808";
export const PREVIEW_SUBLINE = "rgba(8,8,8,0.72)";
export const PREVIEW_BODY = "rgba(8,8,8,0.68)";
export const PREVIEW_META = "rgba(8,8,8,0.45)";
export const PREVIEW_LIGHT_CARD = "rgba(221,212,196,0.28)";
export const PREVIEW_LIGHT_BORDER = "rgba(8,8,8,0.08)";
export const PREVIEW_SURFACE_DARK = "#0a0a10";

export const PREVIEW_HL: CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

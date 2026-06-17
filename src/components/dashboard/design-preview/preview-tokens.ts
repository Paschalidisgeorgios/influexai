/** Shared design tokens — design-preview only */

import type { CSSProperties } from "react";

export const PREVIEW_ACCENT = "#b4ff00";
export const PREVIEW_SHELL = "#050506";
export const PREVIEW_DARK = "#080808";
export const PREVIEW_SHELL_TEXT = "#f5f2ea";
export const PREVIEW_SHELL_TEXT_MUTED = "rgba(245,242,234,0.68)";
export const PREVIEW_SUBLINE = "rgba(245,242,234,0.72)";
export const PREVIEW_BODY = "rgba(245,242,234,0.78)";
export const PREVIEW_META = "rgba(245,242,234,0.45)";
export const PREVIEW_LIGHT_CARD = "rgba(244,240,232,0.92)";
export const PREVIEW_LIGHT_BORDER = "rgba(8,8,8,0.1)";
export const PREVIEW_IVORY_CARD = "rgba(244,240,232,0.08)";
export const PREVIEW_IVORY_BORDER = "rgba(255,255,255,0.1)";
export const PREVIEW_IVORY_META = "rgba(245,242,234,0.45)";
export const PREVIEW_SURFACE_DARK = "rgba(8,8,10,0.88)";

export const PREVIEW_HL: CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

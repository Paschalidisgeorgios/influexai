/** Design-preview tokens — aligned with landing-v2 OS DNA (--font-dm, --font-fraunces) */

import type { CSSProperties } from "react";

export const PREVIEW_ACCENT = "#b4ff00";
export const PREVIEW_SHELL = "#09090b";
export const PREVIEW_SURFACE = "rgba(13, 16, 24, 0.72)";
export const PREVIEW_SURFACE_SOLID = "#0d1018";
export const PREVIEW_BORDER = "rgba(255,255,255,0.08)";
export const PREVIEW_BORDER_ACTIVE = "rgba(180,255,0,0.32)";
export const PREVIEW_TEXT = "#f5f2ea";
export const PREVIEW_TEXT_SECONDARY = "rgba(245,242,234,0.72)";
export const PREVIEW_TEXT_MUTED = "rgba(245,242,234,0.52)";
export const PREVIEW_TEXT_LABEL = "rgba(245,242,234,0.5)";

export const STUDIO_FONT =
  'var(--studio-font, var(--font-dm, "DM Sans"), system-ui, sans-serif)';
export const STUDIO_FONT_DISPLAY =
  'var(--studio-font-display, var(--font-fraunces, Fraunces), Georgia, serif)';

/** @deprecated Use STUDIO_FONT_DISPLAY via preview-type-* classes */
export const PREVIEW_HL: CSSProperties = {
  fontFamily: STUDIO_FONT_DISPLAY,
};

export const STUDIO_TYPE: Record<string, CSSProperties> = {
  display: {
    fontFamily: STUDIO_FONT_DISPLAY,
    fontWeight: 800,
    letterSpacing: "-0.04em",
    lineHeight: 0.96,
    color: PREVIEW_TEXT,
  },
  body: {
    fontFamily: STUDIO_FONT,
    fontSize: "1rem",
    lineHeight: 1.65,
    color: PREVIEW_TEXT_SECONDARY,
  },
  label: {
    fontFamily: STUDIO_FONT,
    fontSize: "0.6875rem",
    fontWeight: 600,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: PREVIEW_TEXT_LABEL,
  },
  workflowTitle: {
    fontFamily: STUDIO_FONT_DISPLAY,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.05,
    color: PREVIEW_TEXT,
  },
};

import type { CSSProperties } from "react";
import type { SzenenGeneratorModel } from "@/lib/szenen-generator-models";

export type SzenenThemeKey = "green" | "blue" | "violet";

export type SzenenThemeTokens = {
  key: SzenenThemeKey;
  primary: string;
  rgb: string;
  spotOpacity: number;
  label: string;
  accent: string;
  accentRgb: string;
  accent10: string;
  accent20: string;
  accent30: string;
  accentGlow: string;
  accentText: string;
  accentTextMuted: string;
  onAccent: string;
};

export const THEMES: Record<SzenenThemeKey, SzenenThemeTokens> = {
  green: {
    key: "green",
    primary: "#B4FF00",
    rgb: "180,255,0",
    spotOpacity: 0.12,
    label: "MATRIX MODE",
    accent: "#B4FF00",
    accentRgb: "180,255,0",
    accent10: "rgba(180,255,0,0.1)",
    accent20: "rgba(180,255,0,0.2)",
    accent30: "rgba(180,255,0,0.3)",
    accentGlow: "rgba(180,255,0,0.3)",
    accentText: "#B4FF00",
    accentTextMuted: "#7ab800",
    onAccent: "#08080a",
  },
  blue: {
    key: "blue",
    primary: "#40A0FF",
    rgb: "40,160,255",
    spotOpacity: 0.14,
    label: "RENDERING MODE",
    accent: "#40A0FF",
    accentRgb: "40,160,255",
    accent10: "rgba(40,160,255,0.1)",
    accent20: "rgba(40,160,255,0.2)",
    accent30: "rgba(40,160,255,0.3)",
    accentGlow: "rgba(40,160,255,0.3)",
    accentText: "#40A0FF",
    accentTextMuted: "#6bb5ff",
    onAccent: "#ffffff",
  },
  violet: {
    key: "violet",
    primary: "#A040FF",
    rgb: "160,64,255",
    spotOpacity: 0.13,
    label: "CINEMATIC MODE",
    accent: "#A040FF",
    accentRgb: "160,64,255",
    accent10: "rgba(160,64,255,0.1)",
    accent20: "rgba(160,64,255,0.2)",
    accent30: "rgba(160,64,255,0.3)",
    accentGlow: "rgba(160,64,255,0.3)",
    accentText: "#A040FF",
    accentTextMuted: "#c080ff",
    onAccent: "#ffffff",
  },
};

export function getThemeTokens(key: SzenenThemeKey): SzenenThemeTokens {
  return THEMES[key];
}

export function resolveModelThemeKey(model: SzenenGeneratorModel): SzenenThemeKey {
  return model.themeKey ?? inferThemeKeyFromName(model.name);
}

export function inferThemeKeyFromName(name: string): SzenenThemeKey {
  const lower = name.toLowerCase();
  if (lower.includes("fast")) return "green";
  if (lower.includes("wan 2.7") || lower.includes("wan2.7") || lower.includes("happyhorse")) {
    return "green";
  }
  if (lower.includes("lite")) return "violet";
  if (lower.includes("hailuo") && !lower.includes("fast")) return "violet";
  if (lower.includes("pro") || lower.includes("omni")) return "blue";
  if (lower.includes("2.0") && !lower.includes("fast")) return "blue";
  return "blue";
}

export function themeCssVars(theme: SzenenThemeTokens): CSSProperties {
  return {
    ["--szenen-accent" as string]: theme.primary,
    ["--szenen-accent-rgb" as string]: theme.rgb,
    ["--szenen-accent-10" as string]: theme.accent10,
    ["--szenen-accent-20" as string]: theme.accent20,
    ["--szenen-accent-30" as string]: theme.accent30,
    ["--szenen-accent-glow" as string]: theme.accentGlow,
    ["--szenen-accent-text" as string]: theme.accentText,
    ["--szenen-accent-text-muted" as string]: theme.accentTextMuted,
    ["--szenen-on-accent" as string]: theme.onAccent,
    ["--szenen-spot-opacity" as string]: String(theme.spotOpacity),
  };
}

export function spotlightBackground(theme: SzenenThemeTokens): string {
  return `radial-gradient(ellipse, rgba(${theme.rgb},0.18), transparent 70%)`;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LandingThemeKey = "green" | "blue" | "violet";

export type LandingTheme = {
  key: LandingThemeKey;
  r: number;
  g: number;
  b: number;
  accent: string;
  onAccent: string;
  badgeLabel: string;
};

export const LANDING_THEMES: LandingTheme[] = [
  {
    key: "green",
    r: 180,
    g: 255,
    b: 0,
    accent: "#B4FF00",
    onAccent: "#08080a",
    badgeLabel: "AI CORE: ACTIVE [MODEL_COMPUTING]",
  },
  {
    key: "blue",
    r: 40,
    g: 160,
    b: 255,
    accent: "#28A0FF",
    onAccent: "#ffffff",
    badgeLabel: "AI CORE: ACTIVE [RENDERING_IMAGE]",
  },
  {
    key: "violet",
    r: 160,
    g: 64,
    b: 255,
    accent: "#A040FF",
    onAccent: "#ffffff",
    badgeLabel: "AI CORE: ACTIVE [SYNTHESIZING_VIDEO]",
  },
];

export function getLandingTheme(key: LandingThemeKey): LandingTheme {
  return LANDING_THEMES.find((t) => t.key === key) ?? LANDING_THEMES[0];
}

export function applyThemeToRoot(theme: LandingTheme): void {
  const root = document.documentElement;
  root.style.setProperty("--theme-r", String(theme.r));
  root.style.setProperty("--theme-g", String(theme.g));
  root.style.setProperty("--theme-b", String(theme.b));
  root.style.setProperty("--theme-accent", theme.accent);
  root.style.setProperty("--theme-on-accent", theme.onAccent);
  root.style.setProperty(
    "--theme-accent-08",
    `rgba(${theme.r},${theme.g},${theme.b},0.08)`
  );
  root.style.setProperty(
    "--theme-accent-10",
    `rgba(${theme.r},${theme.g},${theme.b},0.1)`
  );
  root.style.setProperty(
    "--theme-accent-15",
    `rgba(${theme.r},${theme.g},${theme.b},0.15)`
  );
  root.style.setProperty(
    "--theme-accent-25",
    `rgba(${theme.r},${theme.g},${theme.b},0.25)`
  );
  root.style.setProperty(
    "--theme-accent-30",
    `rgba(${theme.r},${theme.g},${theme.b},0.3)`
  );
  root.style.setProperty(
    "--theme-glow",
    `0 0 60px rgba(${theme.r},${theme.g},${theme.b},0.35), 0 0 120px rgba(${theme.r},${theme.g},${theme.b},0.12)`
  );
}

export function useTheme(initialKey: LandingThemeKey = "green") {
  const [themeKey, setThemeKeyState] = useState<LandingThemeKey>(initialKey);
  const [cycling, setCycling] = useState(true);
  const cycleIndex = useRef(0);

  const theme = getLandingTheme(themeKey);

  useEffect(() => {
    applyThemeToRoot(theme);
  }, [theme]);

  useEffect(() => {
    if (!cycling) return;
    const interval = window.setInterval(() => {
      cycleIndex.current = (cycleIndex.current + 1) % LANDING_THEMES.length;
      setThemeKeyState(LANDING_THEMES[cycleIndex.current].key);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [cycling]);

  const lockTheme = useCallback((key: LandingThemeKey) => {
    setCycling(false);
    setThemeKeyState(key);
  }, []);

  const resumeCycling = useCallback(() => {
    setCycling(true);
  }, []);

  return { theme, themeKey, lockTheme, resumeCycling, cycling };
}

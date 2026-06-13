"use client";

import { useEffect } from "react";
import { THEME_COLORS, type ThemeKey } from "@/lib/dashboard-v2/model-registry";

export function applyModelTheme(themeKey: ThemeKey): void {
  const t = THEME_COLORS[themeKey];
  const root = document.documentElement;
  root.style.setProperty("--dash-v2-r", String(t.r));
  root.style.setProperty("--dash-v2-g", String(t.g));
  root.style.setProperty("--dash-v2-b", String(t.b));
  root.style.setProperty("--dash-v2-accent", t.hex);
  root.style.setProperty("--dash-v2-rgb", t.rgb);
  root.style.setProperty("--dash-v2-accent-08", `rgba(${t.rgb},0.08)`);
  root.style.setProperty("--dash-v2-accent-12", `rgba(${t.rgb},0.12)`);
  root.style.setProperty("--dash-v2-accent-25", `rgba(${t.rgb},0.25)`);
  root.style.setProperty(
    "--dash-v2-glow",
    `0 0 40px rgba(${t.rgb},0.25), 0 0 80px rgba(${t.rgb},0.1)`
  );
}

export function useModelTheme(themeKey: ThemeKey) {
  useEffect(() => {
    applyModelTheme(themeKey);
  }, [themeKey]);

  return THEME_COLORS[themeKey];
}

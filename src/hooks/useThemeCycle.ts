"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HERO_SCENES, THEME_CONFIG, type ThemeKey } from "@/lib/hero-videos";

interface ThemeState {
  themeKey: ThemeKey;
  sceneIdx: number;
  rgb: string;
  hex: string;
  scene: (typeof HERO_SCENES)[number];
  isLocked: boolean;
}

export function useThemeCycle(intervalMs = 4000) {
  const [state, setState] = useState<ThemeState>({
    themeKey: "green",
    sceneIdx: 0,
    rgb: THEME_CONFIG.green.rgb,
    hex: THEME_CONFIG.green.hex,
    scene: HERO_SCENES[0],
    isLocked: false,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const advance = useCallback(() => {
    setState((prev) => {
      if (prev.isLocked) return prev;
      const nextIdx = (prev.sceneIdx + 1) % HERO_SCENES.length;
      const nextScene = HERO_SCENES[nextIdx];
      const nextTheme = THEME_CONFIG[nextScene.theme];
      return {
        ...prev,
        sceneIdx: nextIdx,
        themeKey: nextScene.theme,
        rgb: nextTheme.rgb,
        hex: nextTheme.hex,
        scene: nextScene,
      };
    });
  }, []);

  const lockTheme = useCallback((key: ThemeKey) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const t = THEME_CONFIG[key];
    setState((prev) => ({
      ...prev,
      themeKey: key,
      rgb: t.rgb,
      hex: t.hex,
      isLocked: true,
    }));
  }, []);

  const unlockTheme = useCallback(() => {
    setState((prev) => ({ ...prev, isLocked: false }));
    timerRef.current = setInterval(advance, intervalMs);
  }, [advance, intervalMs]);

  useEffect(() => {
    timerRef.current = setInterval(advance, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advance, intervalMs]);

  return { ...state, lockTheme, unlockTheme, advance };
}

"use client";

import { useEffect, useState } from "react";

const SPLASH_KEY = "influex-splash-done";

export function AppSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    const done = sessionStorage.getItem(SPLASH_KEY);
    if (!standalone && done) return;

    setVisible(true);
    const t = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      setVisible(false);
    }, standalone ? 1400 : 900);

    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-[#060608]"
      role="status"
      aria-label="App wird geladen"
    >
      <div className="pwa-splash-logo font-[family-name:var(--font-bebas)] text-5xl tracking-[0.12em] text-[#B4FF00]">
        INFLUEXAI
      </div>
      <p className="mt-3 text-[rgba(255,255,255,0.65)] text-sm">Dein KI-Stratege</p>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLandingViewport } from "./useLandingViewport";
import { useLandingV2Links } from "../LandingV2ModeContext";

/** Dev-only motion diagnostics — no UI labels */
export function useLandingMotionDebug() {
  const { enableLenis: previewLenis, enablePreviewMotion } = useLandingV2Links();
  const { reduceMotion, enableCinematicScroll, enableParallax3D, enableLenis: viewportLenis, ready } =
    useLandingViewport();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !ready) return;

    const timer = window.setTimeout(() => {
      console.info("[landing-v2 motion]", {
        active: true,
        previewMotion: enablePreviewMotion,
        reducedMotion: reduceMotion,
        desktop3D: enableCinematicScroll,
        parallax3D: enableParallax3D,
        lenis: viewportLenis && previewLenis,
        scrollTriggerCount: ScrollTrigger.getAll().length,
      });
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [
    ready,
    reduceMotion,
    enableCinematicScroll,
    enableParallax3D,
    viewportLenis,
    previewLenis,
    enablePreviewMotion,
  ]);
}

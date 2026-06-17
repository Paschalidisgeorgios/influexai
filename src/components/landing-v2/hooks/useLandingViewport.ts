"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * enableCinematicScroll — pinned story, depth transforms (desktop only)
 * enableParallax3D — hero mouse parallax (desktop + fine pointer)
 */
export function useLandingViewport() {
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(true);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const widthMq = window.matchMedia("(max-width: 767px)");
    const coarseMq = window.matchMedia("(pointer: coarse)");
    const update = () => {
      setIsMobile(widthMq.matches);
      setIsCoarsePointer(coarseMq.matches);
      setReady(true);
    };
    update();
    widthMq.addEventListener("change", update);
    coarseMq.addEventListener("change", update);
    return () => {
      widthMq.removeEventListener("change", update);
      coarseMq.removeEventListener("change", update);
    };
  }, []);

  const enableCinematicScroll = ready && !reduceMotion && !isMobile;
  const enableParallax3D = enableCinematicScroll && !isCoarsePointer;
  const enableLenis = ready && !reduceMotion && !isMobile;

  return {
    reduceMotion,
    isMobile,
    ready,
    enableCinematicScroll,
    enableParallax3D,
    /** @deprecated use enableCinematicScroll or enableParallax3D */
    enable3D: enableParallax3D,
    enableLenis,
  };
}

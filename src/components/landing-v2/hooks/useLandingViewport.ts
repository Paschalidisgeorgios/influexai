"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/** Desktop 3D enabled when wide viewport, fine pointer, and motion not reduced */
export function useLandingViewport() {
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(true);
  const [isCoarsePointer, setIsCoarsePointer] = useState(true);

  useEffect(() => {
    const widthMq = window.matchMedia("(max-width: 767px)");
    const coarseMq = window.matchMedia("(pointer: coarse)");
    const update = () => {
      setIsMobile(widthMq.matches);
      setIsCoarsePointer(coarseMq.matches);
    };
    update();
    widthMq.addEventListener("change", update);
    coarseMq.addEventListener("change", update);
    return () => {
      widthMq.removeEventListener("change", update);
      coarseMq.removeEventListener("change", update);
    };
  }, []);

  const enable3D = !reduceMotion && !isMobile && !isCoarsePointer;

  return { reduceMotion, isMobile, enable3D };
}

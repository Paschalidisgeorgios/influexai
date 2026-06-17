"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Lenis smooth scroll — scoped to landing-v2 preview mount lifecycle only */
export function useLandingLenis(enabled = true) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled || reduceMotion) return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      touchMultiplier: 1.1,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 120);

    return () => {
      window.clearTimeout(refreshTimer);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      ScrollTrigger.refresh();
    };
  }, [enabled, reduceMotion]);
}

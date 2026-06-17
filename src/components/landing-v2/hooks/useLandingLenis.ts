"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLandingViewport } from "./useLandingViewport";

import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

/** Lenis smooth scroll — preview route mount scope only */
export function useLandingLenis() {
  const { enableLenis } = useLandingViewport();

  useEffect(() => {
    if (!enableLenis) return;

    const lenis = new Lenis({
      duration: 1.12,
      smoothWheel: true,
      lerp: 0.09,
      wheelMultiplier: 0.92,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    const refresh = () => ScrollTrigger.refresh();
    const refreshTimer = window.setTimeout(refresh, 150);
    window.addEventListener("resize", refresh);

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("resize", refresh);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      ScrollTrigger.refresh();
    };
  }, [enableLenis]);
}

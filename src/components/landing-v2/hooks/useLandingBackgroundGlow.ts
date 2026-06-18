"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { LANDING_BACKGROUND_GLOW } from "@/lib/landing-v2-motion";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Scroll-scrubbed lime glow for the global landing background */
export function useLandingBackgroundGlow(
  containerRef: RefObject<HTMLElement | null>
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preset = LANDING_BACKGROUND_GLOW;

    container.style.setProperty("--lv2-bg-glow-y", "0px");
    container.style.setProperty("--lv2-bg-glow-x", `${preset.xStart}px`);
    container.style.setProperty("--lv2-bg-glow-opacity", String(preset.opacityMin));

    if (reduceMotion) return;

    const scrollRoot =
      document.querySelector<HTMLElement>(".landing-v2-main") ?? document.documentElement;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        container,
        {
          "--lv2-bg-glow-y": "0px",
          "--lv2-bg-glow-x": `${preset.xStart}px`,
          "--lv2-bg-glow-opacity": preset.opacityMin,
        },
        {
          "--lv2-bg-glow-y": `${preset.yMax}px`,
          "--lv2-bg-glow-x": `${preset.xEnd}px`,
          "--lv2-bg-glow-opacity": preset.opacityMax,
          ease: "none",
          scrollTrigger: {
            trigger: scrollRoot,
            start: "top top",
            end: "bottom bottom",
            scrub: preset.scrub,
          },
        }
      );
    }, container);

    return () => {
      ctx.revert();
      container.style.removeProperty("--lv2-bg-glow-y");
      container.style.removeProperty("--lv2-bg-glow-x");
      container.style.removeProperty("--lv2-bg-glow-opacity");
    };
  }, [containerRef, reduceMotion]);
}

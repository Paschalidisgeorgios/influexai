"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { LANDING_BACKGROUND_GLOW } from "@/lib/landing-v2-motion";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Optional scroll-scrubbed lime glow for marketing backgrounds */
export function useInfluexBackgroundGlow(
  containerRef: RefObject<HTMLElement | null>,
  scrollRootSelector = ".landing-v2-main",
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const preset = LANDING_BACKGROUND_GLOW;

    container.style.setProperty("--influex-bg-glow-y", "0px");
    container.style.setProperty("--influex-bg-glow-x", `${preset.xStart}px`);
    container.style.setProperty("--influex-bg-glow-opacity", String(preset.opacityMin));
    container.style.setProperty("--lv2-bg-glow-y", "0px");
    container.style.setProperty("--lv2-bg-glow-x", `${preset.xStart}px`);
    container.style.setProperty("--lv2-bg-glow-opacity", String(preset.opacityMin));

    if (prefersReducedMotion()) return;

    const scrollRoot =
      document.querySelector<HTMLElement>(scrollRootSelector) ??
      document.documentElement;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        container,
        {
          "--influex-bg-glow-y": "0px",
          "--influex-bg-glow-x": `${preset.xStart}px`,
          "--influex-bg-glow-opacity": preset.opacityMin,
          "--lv2-bg-glow-y": "0px",
          "--lv2-bg-glow-x": `${preset.xStart}px`,
          "--lv2-bg-glow-opacity": preset.opacityMin,
        },
        {
          "--influex-bg-glow-y": `${preset.yMax}px`,
          "--influex-bg-glow-x": `${preset.xEnd}px`,
          "--influex-bg-glow-opacity": preset.opacityMax,
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
      container.style.removeProperty("--influex-bg-glow-y");
      container.style.removeProperty("--influex-bg-glow-x");
      container.style.removeProperty("--influex-bg-glow-opacity");
      container.style.removeProperty("--lv2-bg-glow-y");
      container.style.removeProperty("--lv2-bg-glow-x");
      container.style.removeProperty("--lv2-bg-glow-opacity");
    };
  }, [containerRef, scrollRootSelector, enabled]);
}

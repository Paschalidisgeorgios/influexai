"use client";

import { useEffect, type RefObject } from "react";
import { readLandingScrollY } from "@/lib/landing-v2-motion";
import { useReducedMotion } from "./useReducedMotion";

/** Scroll-linked glow position for the global landing background */
export function useLandingBackgroundGlow(
  containerRef: RefObject<HTMLElement | null>
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const parallax = reduceMotion ? 0 : 0.2;
    const driftX = reduceMotion ? 0 : 0.012;

    const apply = (scrollY: number) => {
      container.style.setProperty("--lv2-bg-glow-y", `${scrollY * parallax}px`);
      container.style.setProperty(
        "--lv2-bg-glow-x",
        `calc(52% + ${scrollY * driftX}px)`
      );
    };

    apply(readLandingScrollY());

    if (reduceMotion) return;

    let frame = 0;
    let lastScroll = -1;

    const tick = () => {
      const scrollY = readLandingScrollY();
      if (scrollY !== lastScroll) {
        lastScroll = scrollY;
        apply(scrollY);
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    const onScroll = () => {
      const scrollY = readLandingScrollY();
      if (scrollY !== lastScroll) {
        lastScroll = scrollY;
        apply(scrollY);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      container.style.removeProperty("--lv2-bg-glow-y");
      container.style.removeProperty("--lv2-bg-glow-x");
    };
  }, [containerRef, reduceMotion]);
}

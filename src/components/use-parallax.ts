"use client";

import { useEffect, type RefObject } from "react";

const DEFAULT_FACTOR = 0.15;
const DEFAULT_SCALE = 1.06;

export function useParallax<T extends HTMLElement>(
  ref: RefObject<T | null>,
  factor = DEFAULT_FACTOR,
  scale = DEFAULT_SCALE
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      el.style.transform = "none";
      return;
    }

    el.style.willChange = "transform";

    let rafId: number | null = null;

    const apply = () => {
      rafId = null;
      const node = ref.current;
      if (!node) return;

      const offsetY = window.scrollY * factor;
      node.style.transform = `translate3d(0, ${offsetY}px, 0) scale(${scale})`;
    };

    const schedule = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(apply);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      el.style.willChange = "";
      el.style.transform = "";
    };
  }, [ref, factor, scale]);
}

"use client";

import { useEffect, useRef } from "react";

const MIN_OPACITY = 0.3;
const MIN_SCALE = 0.96;
const MAX_TRANSLATE_Y = 24;
/** Viewport-height fraction — at this distance from center, min opacity/scale apply. */
const FOCUS_RANGE = 0.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function useScrollFocus<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    const applyFocus = () => {
      rafRef.current = null;
      const node = ref.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;
      const elementCenter = rect.top + rect.height * 0.5;
      const viewportCenter = vh * 0.5;
      const distance = Math.abs(elementCenter - viewportCenter);
      const falloff = vh * FOCUS_RANGE;
      const t = clamp(distance / falloff, 0, 1);

      const opacity = lerp(1, MIN_OPACITY, t);
      const scale = lerp(1, MIN_SCALE, t);
      const direction = elementCenter < viewportCenter ? -1 : 1;
      const translateY = lerp(0, MAX_TRANSLATE_Y, t) * direction;

      node.style.opacity = String(opacity);
      node.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
    };

    const schedule = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(applyFocus);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      el.style.opacity = "";
      el.style.transform = "";
    };
  }, []);

  return ref;
}

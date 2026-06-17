"use client";

import { useEffect, type RefObject } from "react";

/** Tracks which workflow chapter is in view — no GSAP pin */
export function useScrollStoryActiveChapter(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  onActiveChange: (index: number) => void
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const steps = Array.from(
      container.querySelectorAll<HTMLElement>("[data-chapter-step]")
    );
    if (!steps.length) return;

    const ratios = new Map<Element, number>();

    const pickActive = () => {
      let bestIdx = 0;
      let bestRatio = -1;
      steps.forEach((step, index) => {
        const ratio = ratios.get(step) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestIdx = index;
        }
      });
      onActiveChange(bestIdx);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target, entry.intersectionRatio);
        });
        pickActive();
      },
      {
        root: null,
        rootMargin: "-32% 0px -32% 0px",
        threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
      }
    );

    steps.forEach((step) => observer.observe(step));
    onActiveChange(0);

    return () => observer.disconnect();
  }, [containerRef, enabled, onActiveChange]);
}

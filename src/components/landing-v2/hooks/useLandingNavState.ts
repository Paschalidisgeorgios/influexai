"use client";

import { useEffect, useState } from "react";

export function useLandingNavState(sectionIds: readonly string[]) {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 32);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ratios = new Map<string, number>();
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
          });

          let bestId = sectionIds[0] ?? "";
          let bestRatio = 0;

          sectionIds.forEach((sectionId) => {
            const ratio = ratios.get(sectionId) ?? 0;
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestId = sectionId;
            }
          });

          if (bestRatio > 0.12) {
            setActiveId(bestId);
          }
        },
        { rootMargin: "-18% 0px -52% 0px", threshold: [0, 0.12, 0.25, 0.4, 0.6] }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [sectionIds]);

  return { scrolled, progress, activeId };
}

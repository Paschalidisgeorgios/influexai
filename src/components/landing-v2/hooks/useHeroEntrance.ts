"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { useReducedMotion } from "./useReducedMotion";

export function useHeroEntrance(sectionRef: RefObject<HTMLElement | null>) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;

    const ctx = gsap.context(() => {
      const eyebrow = section.querySelector("[data-hero-eyebrow]");
      const lines = section.querySelectorAll("[data-hero-line]");
      const subline = section.querySelector("[data-hero-subline]");
      const chips = section.querySelectorAll("[data-hero-chip]");
      const ctas = section.querySelectorAll("[data-hero-cta]");
      const panel = section.querySelector("[data-hero-panel]");

      gsap.set([eyebrow, ...lines, subline, ...chips, ...ctas, panel].filter(Boolean), {
        opacity: 0,
        y: 18,
      });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.55 }, 0.1);
      if (lines.length) {
        tl.to(lines, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 }, 0.22);
      }
      if (subline) tl.to(subline, { opacity: 1, y: 0, duration: 0.65 }, 0.48);
      if (chips.length) tl.to(chips, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 }, 0.62);
      if (ctas.length) tl.to(ctas, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 }, 0.78);
      if (panel) {
        tl.fromTo(
          panel,
          { opacity: 0, y: 32, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power2.out" },
          0.35
        );
      }
    }, section);

    return () => ctx.revert();
  }, [sectionRef, reduceMotion]);
}

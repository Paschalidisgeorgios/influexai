"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import SplitType from "split-type";
import { useReducedMotion } from "./useReducedMotion";

export function useHeroEntrance(
  sectionRef: RefObject<HTMLElement | null>,
  heroReady = true
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !heroReady) return;
    if (reduceMotion) return;

    let split: SplitType | null = null;

    const ctx = gsap.context(() => {
      const eyebrow = section.querySelector("[data-hero-eyebrow]");
      const headline = section.querySelector<HTMLElement>("[data-hero-headline]");
      const subline = section.querySelector("[data-hero-subline]");
      const ctas = section.querySelectorAll("[data-hero-cta]");
      const panel = section.querySelector("[data-hero-panel]");

      if (headline) {
        split = new SplitType(headline, {
          types: "lines",
          tagName: "span",
        });
      }

      const lines = split?.lines ?? [];

      gsap.set([eyebrow, subline, ...ctas, panel].filter(Boolean), {
        opacity: 0,
        y: 20,
      });
      if (lines.length) {
        gsap.set(lines, { yPercent: 108, opacity: 0 });
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.55 }, 0.08);
      if (lines.length) {
        tl.to(
          lines,
          { yPercent: 0, opacity: 1, duration: 0.82, stagger: 0.11, ease: "power3.out" },
          0.2
        );
      }
      if (subline) tl.to(subline, { opacity: 1, y: 0, duration: 0.65 }, 0.52);
      if (ctas.length) tl.to(ctas, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 }, 0.68);
      if (panel) {
        tl.fromTo(
          panel,
          { opacity: 0, y: 40, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power2.out" },
          0.38
        );
      }
    }, section);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, [sectionRef, reduceMotion, heroReady]);
}

"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { GALLERY_PARALLAX } from "@/lib/landing-v2-motion";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Subtle differential scroll on output gallery visuals — desktop only */
export function useGalleryParallax(
  sectionRef: RefObject<HTMLElement | null>,
  enabled: boolean
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!enabled || !section || reduceMotion) return;

    const visuals = section.querySelectorAll<HTMLElement>("[data-gallery-visual]");
    if (!visuals.length) return;

    const ctx = gsap.context(() => {
      visuals.forEach((visual, index) => {
        const cfg = GALLERY_PARALLAX[index % GALLERY_PARALLAX.length];
        const item = visual.closest<HTMLElement>("[data-gallery-item]") ?? visual;

        gsap.fromTo(
          visual,
          { yPercent: -cfg.yPercent * 0.45, scale: 1 },
          {
            yPercent: cfg.yPercent,
            scale: cfg.scale,
            ease: "none",
            scrollTrigger: {
              trigger: item,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.55,
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, [sectionRef, enabled, reduceMotion]);
}

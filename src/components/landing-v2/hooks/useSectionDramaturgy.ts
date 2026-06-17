"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Eyebrow + headline lines + subline scroll reveals */
export function useSectionDramaturgy(sectionRef: RefObject<HTMLElement | null>) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;

    const ctx = gsap.context(() => {
      const eyebrow = section.querySelector("[data-lv2-eyebrow]");
      const lines = section.querySelectorAll("[data-lv2-headline-line]");
      const subline = section.querySelector("[data-lv2-subline]");
      const staggerItems = section.querySelectorAll("[data-lv2-stagger]");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          once: true,
        },
        defaults: { ease: "power2.out" },
      });

      if (eyebrow) tl.fromTo(eyebrow, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 });
      if (lines.length) {
        tl.fromTo(
          lines,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.1 },
          eyebrow ? "-=0.2" : 0
        );
      }
      if (subline) {
        tl.fromTo(subline, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.55 }, "-=0.35");
      }
      if (staggerItems.length) {
        tl.fromTo(
          staggerItems,
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 },
          "-=0.25"
        );
      }
    }, section);

    return () => ctx.revert();
  }, [sectionRef, reduceMotion]);
}

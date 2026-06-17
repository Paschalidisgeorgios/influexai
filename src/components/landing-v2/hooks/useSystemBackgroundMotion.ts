"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Subtle grid parallax + fade-in for system section backdrop */
export function useSystemBackgroundMotion(
  sectionRef: RefObject<HTMLElement | null>,
  gridRef: RefObject<HTMLElement | null>,
  enabled = true
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    if (!section || !grid || !enabled || reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.set(grid, { opacity: 0.4, y: 20 });

      gsap.to(grid, {
        opacity: 0.8,
        duration: 1.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.to(grid, {
        y: -20,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.55,
        },
      });
    }, section);

    return () => ctx.revert();
  }, [sectionRef, gridRef, enabled, reduceMotion]);
}

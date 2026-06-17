"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Studio product scenes — flat stagger reveal (no pin, no 3D blur) */
export function useStudioScenesReveal(
  containerRef: RefObject<HTMLElement | null>,
  enabled = true
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled || reduceMotion) return;

    const scenes = container.querySelectorAll<HTMLElement>("[data-studio-scene]");

    const ctx = gsap.context(() => {
      gsap.set(scenes, { opacity: 0, y: 24 });

      gsap.to(scenes, {
        opacity: 1,
        y: 0,
        duration: 0.62,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: container,
          start: "top 82%",
          once: true,
        },
        onComplete: () => {
          gsap.set(scenes, { clearProps: "transform" });
        },
      });
    }, container);

    return () => ctx.revert();
  }, [containerRef, enabled, reduceMotion]);
}

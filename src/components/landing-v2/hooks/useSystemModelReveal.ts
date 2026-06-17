"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SYSTEM_MODEL_REVEAL } from "@/lib/landing-v2-motion";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Stagger system-model steps + draw connector on scroll */
export function useSystemModelReveal(
  containerRef: RefObject<HTMLElement | null>,
  enabled = true
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled || reduceMotion) return;

    const ctx = gsap.context(() => {
      const steps = container.querySelectorAll<HTMLElement>("[data-system-model-step]");
      const connectorLine = container.querySelector<HTMLElement>("[data-system-model-line]");

      gsap.set(steps, { opacity: 0, y: SYSTEM_MODEL_REVEAL.stepY });

      gsap.to(steps, {
        opacity: 1,
        y: 0,
        duration: SYSTEM_MODEL_REVEAL.duration,
        stagger: SYSTEM_MODEL_REVEAL.stagger,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container,
          start: SYSTEM_MODEL_REVEAL.start,
          toggleActions: "play none none reverse",
        },
      });

      if (connectorLine) {
        const vertical = window.matchMedia("(max-width: 767px)").matches;
        gsap.set(connectorLine, {
          scaleX: vertical ? 1 : 0,
          scaleY: vertical ? 0 : 1,
          transformOrigin: vertical ? "top center" : "left center",
        });
        gsap.to(connectorLine, {
          scaleX: 1,
          scaleY: 1,
          duration: SYSTEM_MODEL_REVEAL.lineDuration,
          ease: "power2.out",
          scrollTrigger: {
            trigger: container,
            start: SYSTEM_MODEL_REVEAL.start,
            toggleActions: "play none none reverse",
          },
        });
      }
    }, container);

    return () => ctx.revert();
  }, [containerRef, enabled, reduceMotion]);
}

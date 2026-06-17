"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CREATOR_FLOW_REVEAL } from "@/lib/landing-v2-motion";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Stagger stations + draw lime connector on scroll (no pin) */
export function useCreatorFlowReveal(
  containerRef: RefObject<HTMLElement | null>,
  enabled = true,
  variant: "hero" | "system" | "workflow" = "system"
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const stations = container.querySelectorAll<HTMLElement>("[data-creator-flow-station]");
    const activePaths = container.querySelectorAll<SVGPathElement>(
      ".landing-v2-creator-flow__path--active"
    );

    if (!enabled || reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.set(stations, { opacity: 0, y: CREATOR_FLOW_REVEAL.stationY });

      if (variant === "hero") {
        const tl = gsap.timeline({ delay: 0.85 });
        tl.to(stations, {
          opacity: 1,
          y: 0,
          duration: CREATOR_FLOW_REVEAL.duration,
          stagger: CREATOR_FLOW_REVEAL.stagger,
          ease: "power2.out",
        });
        activePaths.forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          tl.to(
            path,
            {
              strokeDashoffset: 0,
              duration: CREATOR_FLOW_REVEAL.lineDuration,
              ease: "power2.out",
            },
            "-=0.55"
          );
        });
        return;
      }

      gsap.to(stations, {
        opacity: 1,
        y: 0,
        duration: CREATOR_FLOW_REVEAL.duration,
        stagger: CREATOR_FLOW_REVEAL.stagger,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container,
          start: CREATOR_FLOW_REVEAL.start,
          toggleActions: "play none none reverse",
        },
      });

      activePaths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: CREATOR_FLOW_REVEAL.lineDuration,
          ease: "power2.out",
          scrollTrigger: {
            trigger: container,
            start: CREATOR_FLOW_REVEAL.start,
            toggleActions: "play none none reverse",
          },
        });
      });
    }, container);

    return () => ctx.revert();
  }, [containerRef, enabled, reduceMotion, variant]);
}

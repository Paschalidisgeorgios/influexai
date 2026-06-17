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

    if (!enabled || reduceMotion) return;

    const ctx = gsap.context(() => {
      if (variant === "hero") {
        const headerItems = container.querySelectorAll<HTMLElement>("[data-creator-flow-hero-item]");
        const accent = container.querySelector<HTMLElement>(".landing-v2-creator-flow__accent");
        const tl = gsap.timeline({ delay: 0.85 });

        gsap.set(headerItems, { opacity: 0, y: CREATOR_FLOW_REVEAL.stationY });

        tl.to(headerItems, {
          opacity: 1,
          y: 0,
          duration: CREATOR_FLOW_REVEAL.duration,
          stagger: CREATOR_FLOW_REVEAL.stagger * 0.65,
          ease: "power2.out",
        });

        if (accent) {
          gsap.set(accent, { scaleX: 0, transformOrigin: "left center" });
          tl.to(
            accent,
            {
              scaleX: 1,
              duration: CREATOR_FLOW_REVEAL.lineDuration * 0.75,
              ease: "power2.out",
            },
            "-=0.35"
          );
        }
        return;
      }

      const stations = container.querySelectorAll<HTMLElement>("[data-creator-flow-station]");
      const connectorLine = container.querySelector<HTMLElement>("[data-creator-flow-line]");

      gsap.set(stations, { opacity: 0, y: CREATOR_FLOW_REVEAL.stationY });

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
          duration: CREATOR_FLOW_REVEAL.lineDuration,
          ease: "power2.out",
          scrollTrigger: {
            trigger: container,
            start: CREATOR_FLOW_REVEAL.start,
            toggleActions: "play none none reverse",
          },
        });
      }
    }, container);

    return () => ctx.revert();
  }, [containerRef, enabled, reduceMotion, variant]);
}

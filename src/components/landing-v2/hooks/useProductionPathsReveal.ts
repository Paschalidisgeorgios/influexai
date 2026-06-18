"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { PATHS_REVEAL } from "@/lib/landing-v2-motion";
import { flushMissedScrollReveal } from "./scrollRevealUtils";
import { useLandingViewport } from "./useLandingViewport";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Staggered editorial path blocks on scroll */
export function useProductionPathsReveal(
  sectionRef: RefObject<HTMLElement | null>,
  cinematic: boolean
) {
  const reduceMotion = useReducedMotion();
  const { isMobile } = useLandingViewport();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;

    const paths = section.querySelectorAll<HTMLElement>(".landing-v2-path-track");
    const grid = section.querySelector(".landing-v2-path-tracks");
    if (!paths.length || !grid) return;

    const ctx = gsap.context(() => {
      const tween = gsap.fromTo(
        paths,
        {
          opacity: isMobile ? 1 : 0,
          y: isMobile ? 24 : cinematic ? PATHS_REVEAL.y : 32,
        },
        {
          opacity: 1,
          y: 0,
          duration: cinematic ? PATHS_REVEAL.duration : 0.6,
          stagger: cinematic ? PATHS_REVEAL.stagger : 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: grid,
            start: "top 82%",
            once: true,
          },
        }
      );

      flushMissedScrollReveal(tween.scrollTrigger, paths, { opacity: 1, y: 0 });
    }, section);

    return () => ctx.revert();
  }, [sectionRef, cinematic, reduceMotion, isMobile]);
}

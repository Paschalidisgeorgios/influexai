"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WORKFLOW_STAGE_MOTION } from "@/lib/landing-v2-motion";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Depth reveal on workflow stage visuals — no pin, text stays flat */
export function useWorkflowStageMotion(
  chaptersRef: RefObject<HTMLElement | null>,
  enabled: boolean
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = chaptersRef.current;
    if (!container || reduceMotion) return;

    const chapters = Array.from(
      container.querySelectorAll<HTMLElement>("[data-chapter-step]")
    );
    if (!chapters.length) return;

    const ctx = gsap.context(() => {
      chapters.forEach((chapter) => {
        const frame = chapter.querySelector<HTMLElement>("[data-workflow-stage-frame]");
        if (!frame) return;

        if (!enabled) {
          gsap.fromTo(
            frame,
            { opacity: 0, y: 32 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              ease: "power2.out",
              scrollTrigger: {
                trigger: chapter,
                start: "top 84%",
                once: true,
              },
            }
          );
          return;
        }

        gsap.set(frame, {
          transformPerspective: 1200,
          transformStyle: "preserve-3d",
          force3D: true,
        });

        const motion = WORKFLOW_STAGE_MOTION;
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: chapter,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.65,
          },
        });

        tl.fromTo(
          frame,
          motion.enter,
          { ...motion.peak, ease: "power2.out", duration: 0.38 },
          0
        ).to(frame, { ...motion.exit, ease: "power2.in", duration: 0.32 }, 0.62);
      });
    }, container);

    return () => ctx.revert();
  }, [chaptersRef, enabled, reduceMotion]);
}

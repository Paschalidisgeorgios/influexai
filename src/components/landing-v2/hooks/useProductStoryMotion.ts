"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TERMINAL_STORY_MOTION } from "@/lib/landing-v2-motion";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useLandingViewport } from "./useLandingViewport";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Terminal story block — number reveal, tool wipe, visual parallax */
export function useProductStoryMotion(
  blockRef: RefObject<HTMLElement | null>,
  enabled = true
) {
  const reduceMotion = useReducedMotion();
  const { isMobile } = useLandingViewport();
  const { enablePreviewMotion } = useLandingV2Links();
  const motionOn = enabled && enablePreviewMotion && !reduceMotion && !isMobile;

  useEffect(() => {
    const block = blockRef.current;
    if (!block || !motionOn) return;

    const number = block.querySelector("[data-terminal-number]");
    const tool = block.querySelector("[data-terminal-tool]");
    const copy = block.querySelector("[data-terminal-copy]");
    const visual = block.querySelector("[data-terminal-visual]");
    const textTargets = [number, tool, copy].filter(Boolean) as Element[];

    const ctx = gsap.context(() => {
      gsap.set(textTargets, { clearProps: "transform" });

      const enterTl = gsap.timeline({
        scrollTrigger: {
          trigger: block,
          start: TERMINAL_STORY_MOTION.enterStart,
          once: true,
        },
        onComplete: () => {
          gsap.set(textTargets, { clearProps: "transform" });
        },
      });

      if (number) {
        enterTl.fromTo(
          number,
          { opacity: 0, y: TERMINAL_STORY_MOTION.numberReveal.y },
          {
            opacity: 1,
            y: 0,
            duration: TERMINAL_STORY_MOTION.numberReveal.duration,
            ease: "power2.out",
          }
        );
      }

      if (tool) {
        enterTl.fromTo(
          tool,
          {
            opacity: 0,
            x: TERMINAL_STORY_MOTION.toolNameReveal.x,
            clipPath: "inset(0 100% 0 0)",
          },
          {
            opacity: 1,
            x: 0,
            clipPath: "inset(0 0% 0 0)",
            duration: TERMINAL_STORY_MOTION.toolNameReveal.duration,
            ease: "power3.out",
          },
          "-=0.2"
        );
      }

      if (copy) {
        enterTl.fromTo(
          copy,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.65, ease: "power2.out" },
          "-=0.35"
        );
      }

      if (visual && copy) {
        ScrollTrigger.create({
          trigger: block,
          start: "top bottom",
          end: "bottom top",
          scrub: TERMINAL_STORY_MOTION.scrub,
          onUpdate: (self) => {
            const p = self.progress - 0.5;
            gsap.set(visual, {
              y: p * TERMINAL_STORY_MOTION.visualParallax.y,
            });
            gsap.set(copy, {
              y: p * TERMINAL_STORY_MOTION.textParallax.y,
            });
          },
        });
      }
    }, block);

    return () => ctx.revert();
  }, [blockRef, motionOn]);
}

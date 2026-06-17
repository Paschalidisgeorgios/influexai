"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SECTION_REVEAL } from "@/lib/landing-v2-motion";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { flushMissedScrollReveal } from "./scrollRevealUtils";
import { useLandingViewport } from "./useLandingViewport";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

/** Eyebrow + headline lines + subline scroll reveals */
export function useSectionDramaturgy(sectionRef: RefObject<HTMLElement | null>) {
  const reduceMotion = useReducedMotion();
  const { isMobile } = useLandingViewport();
  const { enablePreviewMotion } = useLandingV2Links();
  const reveal = enablePreviewMotion ? SECTION_REVEAL.preview : SECTION_REVEAL.standard;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;

    const ctx = gsap.context(() => {
      const eyebrow = section.querySelector("[data-lv2-eyebrow]");
      const chapter = section.querySelector("[data-lv2-chapter]");
      const lines = section.querySelectorAll("[data-lv2-headline-line]");
      const subline = section.querySelector("[data-lv2-subline]");
      const staggerItems = section.querySelectorAll("[data-lv2-stagger]");
      const animated = [
        ...(chapter ? [chapter] : []),
        ...(eyebrow ? [eyebrow] : []),
        ...lines,
        ...(subline ? [subline] : []),
        ...staggerItems,
      ];

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: reveal.start,
          once: true,
        },
        defaults: { ease: enablePreviewMotion ? "power3.out" : "power2.out" },
      });

      if (chapter) {
        tl.fromTo(
          chapter,
          { opacity: isMobile ? 1 : 0, y: isMobile ? 16 : enablePreviewMotion ? 28 : 18 },
          { opacity: 1, y: 0, duration: 0.55 }
        );
      }
      if (eyebrow) {
        tl.fromTo(
          eyebrow,
          { opacity: isMobile ? 1 : 0, y: isMobile ? 18 : enablePreviewMotion ? 24 : 14 },
          { opacity: 1, y: 0, duration: 0.55 },
          chapter ? "-=0.15" : 0
        );
      }
      if (lines.length) {
        tl.fromTo(
          lines,
          {
            opacity: isMobile ? 1 : reveal.opacity,
            y: isMobile ? 24 : reveal.y,
          },
          {
            opacity: 1,
            y: 0,
            duration: enablePreviewMotion ? 0.78 : 0.65,
            stagger: enablePreviewMotion ? 0.12 : 0.1,
          },
          chapter || eyebrow ? "-=0.2" : 0
        );
      }
      if (subline) {
        tl.fromTo(
          subline,
          { opacity: isMobile ? 1 : 0, y: isMobile ? 20 : enablePreviewMotion ? 28 : 16 },
          { opacity: 1, y: 0, duration: 0.62 },
          "-=0.35"
        );
      }
      if (staggerItems.length) {
        tl.fromTo(
          staggerItems,
          { opacity: isMobile ? 1 : 0, y: isMobile ? 24 : enablePreviewMotion ? 50 : 28 },
          {
            opacity: 1,
            y: 0,
            duration: enablePreviewMotion ? 0.8 : 0.7,
            stagger: enablePreviewMotion ? 0.15 : 0.12,
          },
          "-=0.25"
        );
      }

      flushMissedScrollReveal(tl.scrollTrigger, animated, { opacity: 1, y: 0 });
    }, section);

    return () => ctx.revert();
  }, [sectionRef, reduceMotion, enablePreviewMotion, reveal, isMobile]);
}

"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HERO_VIDEO_BG } from "@/lib/landing-v2-motion";

gsap.registerPlugin(ScrollTrigger);

/** Hero backdrop — opacity + scale fade on scroll (preview only) */
export function useHeroVideoParallax(
  sectionRef: RefObject<HTMLElement | null>,
  mediaRef: RefObject<HTMLElement | null>,
  enabled = false
) {
  useEffect(() => {
    const section = sectionRef.current;
    const video = mediaRef.current;
    if (!section || !video) return;

    const preset = HERO_VIDEO_BG;
    const innerScrim = section.querySelector<HTMLElement>(
      ".landing-v2-hero-video-bg__scrim"
    );
    const readabilityScrim = section.querySelector<HTMLElement>(
      ".landing-v2-hero__readability-scrim"
    );

    gsap.set(video, {
      opacity: preset.opacityStart,
      scale: preset.scaleStart,
      transformOrigin: "center center",
    });

    if (!enabled) return;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: preset.scrub,
        },
      });

      timeline.to(
        video,
        {
          opacity: preset.opacityEnd,
          scale: preset.scaleEnd,
          ease: "none",
        },
        0
      );

      if (innerScrim) {
        gsap.set(innerScrim, { opacity: preset.scrimOpacityStart });
        timeline.to(
          innerScrim,
          {
            opacity: preset.scrimOpacityEnd,
            ease: "none",
          },
          0
        );
      }

      if (readabilityScrim) {
        gsap.set(readabilityScrim, { opacity: preset.readabilityScrimStart });
        timeline.to(
          readabilityScrim,
          {
            opacity: preset.readabilityScrimEnd,
            ease: "none",
          },
          0
        );
      }
    }, section);

    return () => ctx.revert();
  }, [sectionRef, mediaRef, enabled]);
}

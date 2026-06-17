"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EDITORIAL_VIDEO_SCROLL } from "@/lib/landing-v2-motion";

gsap.registerPlugin(ScrollTrigger);

type UseEditorialVideoScrollOptions = {
  sectionRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  videoRef?: RefObject<HTMLVideoElement | null>;
  enabled?: boolean;
};

/** Scroll-driven video stage — comes forward, then fades back (no pin) */
export function useEditorialVideoScroll({
  sectionRef,
  stageRef,
  videoRef,
  enabled = true,
}: UseEditorialVideoScrollOptions) {
  useEffect(() => {
    if (!enabled) return;

    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const video = videoRef?.current ?? null;
    const preset = EDITORIAL_VIDEO_SCROLL;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        stage,
        { opacity: preset.enter.opacity, scale: preset.enter.scale, y: preset.enter.y },
        {
          opacity: preset.peak.opacity,
          scale: preset.peak.scale,
          y: preset.peak.y,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            end: "center center",
            scrub: 0.55,
          },
        }
      );

      gsap.fromTo(
        stage,
        { opacity: preset.peak.opacity, scale: preset.peak.scale, y: preset.peak.y },
        {
          opacity: preset.exit.opacity,
          scale: preset.exit.scale,
          y: preset.exit.y,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "center center",
            end: "bottom 15%",
            scrub: 0.55,
          },
        }
      );

      if (video) {
        gsap.fromTo(
          video,
          { scale: preset.video.scaleFrom },
          {
            scale: preset.video.scaleTo,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.65,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, [enabled, sectionRef, stageRef, videoRef]);
}

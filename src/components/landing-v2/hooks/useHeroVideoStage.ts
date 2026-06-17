"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HERO_VIDEO_STAGE } from "@/lib/landing-v2-motion";

gsap.registerPlugin(ScrollTrigger);

type UseHeroVideoStageOptions = {
  sectionRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  videoRef?: RefObject<HTMLVideoElement | null>;
  enabled?: boolean;
};

/** Hero video parallax — subtle depth on scroll, no panel 3D */
export function useHeroVideoStage({
  sectionRef,
  stageRef,
  videoRef,
  enabled = true,
}: UseHeroVideoStageOptions) {
  useEffect(() => {
    if (!enabled) return;

    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const video = videoRef?.current ?? null;
    const preset = HERO_VIDEO_STAGE;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        stage,
        { y: 0, scale: 1, opacity: preset.opacityStart },
        {
          y: preset.scrollY,
          scale: preset.scrollScale,
          opacity: preset.opacityEnd,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
          },
        }
      );

      if (video) {
        gsap.fromTo(
          video,
          { scale: preset.videoScaleFrom, yPercent: 0 },
          {
            scale: preset.videoScaleTo,
            yPercent: preset.videoYPercent,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
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

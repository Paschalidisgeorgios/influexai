"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HERO_VIDEO_BG } from "@/lib/landing-v2-motion";

gsap.registerPlugin(ScrollTrigger);

/** Minimal hero video parallax — no crossfade, scale capped at 1.04 */
export function useHeroVideoParallax(
  sectionRef: RefObject<HTMLElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled = false
) {
  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video || !enabled) return;

    const ctx = gsap.context(() => {
      gsap.set(video, {
        scale: HERO_VIDEO_BG.scaleStart,
        yPercent: 0,
        transformOrigin: "center center",
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: HERO_VIDEO_BG.scrub,
        onUpdate: (self) => {
          const p = self.progress;
          gsap.set(video, {
            yPercent: p * HERO_VIDEO_BG.yPercentMax,
            scale: HERO_VIDEO_BG.scaleStart - p * HERO_VIDEO_BG.scaleDelta,
          });
        },
      });
    }, section);

    return () => ctx.revert();
  }, [sectionRef, videoRef, enabled]);
}

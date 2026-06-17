"use client";

import type { RefObject } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useReducedMotion } from "../hooks/useReducedMotion";

const backdrop = LANDING_V2_ASSETS.heroBackdrop;

type LandingV2HeroAmbientProps = {
  ambientRef?: RefObject<HTMLDivElement | null>;
  videoRef?: RefObject<HTMLVideoElement | null>;
  showVideo?: boolean;
};

/** Cinematic hero backdrop — optional loop video + readable gradients */
export function LandingV2HeroAmbient({
  ambientRef,
  videoRef,
  showVideo = false,
}: LandingV2HeroAmbientProps) {
  const reduceMotion = useReducedMotion();
  const { isMobile } = useLandingViewport();
  const useVideo = showVideo && !reduceMotion && !isMobile;

  return (
    <div
      className={`landing-v2-hero__ambient ${useVideo ? "landing-v2-hero__ambient--video" : ""}`}
      aria-hidden
    >
      {useVideo ? (
        <video
          ref={videoRef}
          className="landing-v2-hero__ambient-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={backdrop.poster}
        >
          <source src={backdrop.webm} type="video/webm" />
          <source src={backdrop.mp4} type="video/mp4" />
        </video>
      ) : null}
      <div ref={ambientRef} className="landing-v2-hero__ambient-gradient" />
      <div className="landing-v2-hero__ambient-texture" />
      <div
        className={`landing-v2-hero__ambient-scrim ${
          useVideo ? "landing-v2-hero__ambient-scrim--video" : ""
        }`}
      />
    </div>
  );
}

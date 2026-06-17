"use client";

import { useRef, type RefObject } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useHeroVideoParallax } from "../hooks/useHeroVideoParallax";

const video = LANDING_V2_ASSETS.heroPreviewVideo;

type LandingV2HeroVideoBackgroundProps = {
  sectionRef: RefObject<HTMLElement | null>;
};

/** Preview hero backdrop — single mp4, scroll-fades within hero only */
export function LandingV2HeroVideoBackground({
  sectionRef,
}: LandingV2HeroVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isMobile, enableCinematicScroll } = useLandingViewport();
  const reduceMotion = useReducedMotion();
  const { enableHeroVideo, enablePreviewMotion } = useLandingV2Links();

  const showVideo = enableHeroVideo && !isMobile && !reduceMotion;
  const motionEnabled =
    enablePreviewMotion && enableCinematicScroll && showVideo;

  useHeroVideoParallax(sectionRef, videoRef, motionEnabled);

  if (!showVideo) {
    return (
      <div
        className="landing-v2-hero-video-bg landing-v2-hero-video-bg--poster"
        aria-hidden
        style={{ backgroundImage: `url(${video.poster})` }}
      />
    );
  }

  return (
    <div className="landing-v2-hero-video-bg" aria-hidden>
      <video
        ref={videoRef}
        className="landing-v2-hero-video-bg__video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={video.poster}
      >
        <source src={video.mp4} type="video/mp4" />
      </video>
      <div className="landing-v2-hero-video-bg__scrim" />
    </div>
  );
}

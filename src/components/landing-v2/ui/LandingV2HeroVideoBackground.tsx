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

function PosterFallback() {
  return (
    <div className="landing-v2-hero-video-bg__poster-wrap">
      <div
        className="landing-v2-hero-video-bg__poster"
        style={{ backgroundImage: `url(${video.poster})` }}
      />
      <div className="landing-v2-hero-video-bg__poster-gradient" aria-hidden />
    </div>
  );
}

/** Preview hero backdrop — ambient loop video (no compare overlay) */
export function LandingV2HeroVideoBackground({
  sectionRef,
}: LandingV2HeroVideoBackgroundProps) {
  const mediaRef = useRef<HTMLDivElement>(null);

  const { isMobile, enableCinematicScroll } = useLandingViewport();
  const reduceMotion = useReducedMotion();
  const { enableHeroVideo, enablePreviewMotion } = useLandingV2Links();

  const showVideo = enableHeroVideo && !reduceMotion && !isMobile;
  const motionEnabled = enablePreviewMotion && enableCinematicScroll && showVideo;

  useHeroVideoParallax(sectionRef, mediaRef, motionEnabled);

  return (
    <div className="landing-v2-hero-video-bg" aria-hidden>
      <div ref={mediaRef} className="landing-v2-hero-video-bg__stage">
        {showVideo ? (
          <video
            className="landing-v2-hero-video-bg__media"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={video.poster}
          >
            {"webm" in video && video.webm ? (
              <source src={video.webm} type="video/webm" />
            ) : null}
            <source src={video.mp4} type="video/mp4" />
          </video>
        ) : (
          <PosterFallback />
        )}
      </div>

      <div className="landing-v2-hero-video-bg__scrim" />
    </div>
  );
}

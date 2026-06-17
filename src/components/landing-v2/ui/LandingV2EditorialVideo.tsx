"use client";

import { forwardRef } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { useLandingViewport } from "../hooks/useLandingViewport";
import { useReducedMotion } from "../hooks/useReducedMotion";

type LandingV2EditorialVideoProps = {
  className?: string;
  enabled?: boolean;
};

/** Editorial video stage — crisp loop, poster on mobile / reduced motion */
export const LandingV2EditorialVideo = forwardRef<
  HTMLVideoElement,
  LandingV2EditorialVideoProps
>(function LandingV2EditorialVideo({ className = "", enabled = true }, ref) {
  const { isMobile } = useLandingViewport();
  const reduceMotion = useReducedMotion();
  const asset = LANDING_V2_ASSETS.editorialVideo;
  const showVideo = enabled && !isMobile && !reduceMotion;
  const rootClass = ["landing-v2-editorial-video", className].filter(Boolean).join(" ");

  if (!showVideo) {
    return (
      <div
        className={`${rootClass} landing-v2-editorial-video--poster`}
        style={{ backgroundImage: `url(${asset.poster})` }}
      />
    );
  }

  return (
    <video
      ref={ref}
      className={rootClass}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={asset.poster}
    >
      <source src={asset.mp4} type="video/mp4" />
    </video>
  );
});

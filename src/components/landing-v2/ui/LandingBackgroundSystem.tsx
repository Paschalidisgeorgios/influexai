"use client";

import { useRef } from "react";
import { useLandingBackgroundGlow } from "../hooks/useLandingBackgroundGlow";

/** Fixed global landing stage — gradient, grid, scrolling glow, vignette */
export function LandingBackgroundSystem() {
  const rootRef = useRef<HTMLDivElement>(null);
  useLandingBackgroundGlow(rootRef);

  return (
    <div ref={rootRef} className="landing-v2-bg-system" aria-hidden>
      <div className="landing-v2-bg-system__base" />
      <div className="landing-v2-bg-system__grid" />
      <div className="landing-v2-bg-system__glow" />
      <div className="landing-v2-bg-system__vignette" />
      <div className="landing-v2-bg-system__noise" />
    </div>
  );
}

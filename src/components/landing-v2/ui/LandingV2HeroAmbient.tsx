"use client";

import type { RefObject } from "react";

/** Cinematic hero backdrop — gradient only, no video faces */
export function LandingV2HeroAmbient({
  ambientRef,
}: {
  ambientRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="landing-v2-hero__ambient" aria-hidden>
      <div ref={ambientRef} className="landing-v2-hero__ambient-gradient" />
      <div className="landing-v2-hero__ambient-texture" />
      <div className="landing-v2-hero__ambient-scrim" />
    </div>
  );
}

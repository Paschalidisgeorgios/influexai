"use client";

/** Cinematic hero backdrop — gradient only, no video faces */
export function LandingV2HeroAmbient() {
  return (
    <div className="landing-v2-hero__ambient" aria-hidden>
      <div className="landing-v2-hero__ambient-gradient" />
      <div className="landing-v2-hero__ambient-texture" />
      <div className="landing-v2-hero__ambient-scrim" />
    </div>
  );
}

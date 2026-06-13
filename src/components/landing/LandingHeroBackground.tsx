"use client";

import { useEffect, useRef } from "react";
import { HERO_BACKGROUND_VIDEO } from "@/lib/hero-videos";

export function LandingHeroBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    el.muted = true;

    const ensurePlay = () => {
      void el.play().catch(() => {});
    };

    ensurePlay();
    el.addEventListener("ended", ensurePlay);

    return () => {
      el.removeEventListener("ended", ensurePlay);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-top"
        src={HERO_BACKGROUND_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />

      <div className="landing-hero-dot-grid absolute inset-0 opacity-30" />
      <div className="landing-hero-glow landing-hero-glow--violet" />
      <div className="landing-hero-glow landing-hero-glow--green" />
      <div className="landing-hero-vignette absolute inset-0" />
    </div>
  );
}

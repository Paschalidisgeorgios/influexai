"use client";

import { useEffect, useState } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { useReducedMotion } from "../hooks/useReducedMotion";

async function assetExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Full-bleed hero ambient — only if studio loop exists */
export function LandingV2HeroAmbient() {
  const reduceMotion = useReducedMotion();
  const [showVideo, setShowVideo] = useState(false);
  const { studioLoop } = LANDING_V2_ASSETS;

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    void assetExists(studioLoop.mp4).then((ok) => {
      if (!cancelled) setShowVideo(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [reduceMotion, studioLoop.mp4]);

  return (
    <div className="landing-v2-hero__ambient" aria-hidden>
      <div className="landing-v2-hero__ambient-gradient" />
      {showVideo ? (
        <video
          className="landing-v2-hero__ambient-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={studioLoop.poster}
          onError={() => setShowVideo(false)}
        >
          <source src={studioLoop.webm} type="video/webm" />
          <source src={studioLoop.mp4} type="video/mp4" />
        </video>
      ) : null}
      <div className="landing-v2-hero__ambient-scrim" />
    </div>
  );
}

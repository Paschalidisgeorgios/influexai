"use client";

import { useEffect, useState } from "react";
import { LANDING_V2_ASSETS } from "@/lib/landing-v2-assets";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useReducedMotion } from "../hooks/useReducedMotion";

const panelCopy = LANDING_V2_COPY.hero.productPanel;

async function assetExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

function HeroStudioAmbient() {
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

  if (!showVideo) return null;

  return (
    <div className="landing-v2-hero-product__ambient" aria-hidden>
      <video
        className="landing-v2-hero-product__ambient-video"
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
    </div>
  );
}

export function LandingV2HeroProductPanel({ variant = "default" }: { variant?: "default" | "stage" }) {
  return (
    <div
      className={`landing-v2-hero-product ${
        variant === "stage" ? "landing-v2-hero-product--stage" : ""
      }`}
    >
      <HeroStudioAmbient />
      <div className="landing-v2-hero-product__scrim" aria-hidden />
      <div className="landing-v2-hero-product__content">
        <header className="landing-v2-hero-product__header">
          <p className="landing-v2-hero-product__label">
            <span className="landing-v2-kicker__dot" aria-hidden />
            {panelCopy.label}
          </p>
          <h2 className="landing-v2-hero-product__headline">{panelCopy.headline}</h2>
        </header>

        <div className="landing-v2-hero-product__briefing">
          <p className="landing-v2-hero-product__section-title">{panelCopy.briefing.title}</p>
          <p className="landing-v2-hero-product__briefing-text">{panelCopy.briefing.text}</p>
        </div>

        <div className="landing-v2-hero-product__block">
          <p className="landing-v2-hero-product__section-title">{panelCopy.paths.title}</p>
          <ul className="landing-v2-hero-product__chips" aria-label={panelCopy.paths.title}>
            {panelCopy.paths.items.map((item, index) => (
              <li key={item}>
                <span
                  className={`landing-v2-hero-product__chip ${
                    index === 0 ? "landing-v2-hero-product__chip--active" : ""
                  }`}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="landing-v2-hero-product__block">
          <p className="landing-v2-hero-product__section-title">{panelCopy.queue.title}</p>
          <ul className="landing-v2-hero-product__queue">
            {panelCopy.queue.items.map((item, index) => (
              <li key={item} className="landing-v2-hero-product__queue-item">
                <span
                  className={`landing-v2-hero-product__queue-dot ${
                    index === 0 ? "landing-v2-hero-product__queue-dot--lime" : ""
                  }`}
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

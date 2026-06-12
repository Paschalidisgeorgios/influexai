"use client";

import { useState, useEffect } from "react";
import { HERO_SCENES } from "@/lib/hero-videos";

interface HeroImageCarouselProps {
  currentIdx: number;
  rgb: string;
  label?: string;
}

export function HeroImageCarousel({
  currentIdx,
  rgb,
  label = "",
}: HeroImageCarouselProps) {
  const [prevIdx, setPrevIdx] = useState(currentIdx);
  const [isCrossFading, setIsCrossFading] = useState(false);
  const current = HERO_SCENES[currentIdx];
  const previous = HERO_SCENES[prevIdx];

  useEffect(() => {
    if (currentIdx === prevIdx) return;
    setIsCrossFading(true);
    const t = setTimeout(() => {
      setPrevIdx(currentIdx);
      setIsCrossFading(false);
    }, 800);
    return () => clearTimeout(t);
  }, [currentIdx, prevIdx]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[14px]">
      {isCrossFading && (
        <div
          className="absolute inset-0"
          style={{ opacity: 0, transition: "opacity 0.8s ease-in-out" }}
        >
          <video
            key={previous.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={previous.fallbackImageUrl}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "brightness(0.45) saturate(0.9)" }}
          >
            <source src={previous.videoUrl} type="video/mp4" />
          </video>
        </div>
      )}
      <div
        className="absolute inset-0"
        style={{
          opacity: isCrossFading ? 0 : 1,
          transition: "opacity 0.8s ease-in-out",
        }}
      >
        <video
          key={current.videoUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={current.fallbackImageUrl}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "brightness(0.45) saturate(0.9)" }}
          aria-label={label || current.label}
        >
          <source src={current.videoUrl} type="video/mp4" />
        </video>
      </div>
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          background: `radial-gradient(ellipse at center,rgba(${rgb},0.12),transparent 70%)`,
          transition: "background 1.2s ease",
        }}
      />
    </div>
  );
}

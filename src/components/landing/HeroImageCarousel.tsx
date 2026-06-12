"use client";

import { useState, useEffect } from "react";
import { HERO_SCENES } from "@/lib/hero-videos";

interface HeroImageCarouselProps {
  currentIdx: number;
  rgb: string;
  label?: string;
}

function HeroCarouselVideo({
  videoUrl,
  label,
  active,
}: {
  videoUrl: string;
  label: string;
  active: boolean;
}) {
  return (
    <video
      key={videoUrl}
      autoPlay
      loop
      playsInline
      preload="auto"
      ref={(el) => {
        if (el) {
          el.muted = true;
          if (active) el.play().catch(() => {});
        }
      }}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ filter: "brightness(0.5) saturate(0.9)", display: "block" }}
      aria-label={label}
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  );
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
          <HeroCarouselVideo
            videoUrl={previous.videoUrl}
            label={previous.label}
            active={false}
          />
        </div>
      )}
      <div
        className="absolute inset-0"
        style={{
          opacity: isCrossFading ? 0 : 1,
          transition: "opacity 0.8s ease-in-out",
        }}
      >
        <HeroCarouselVideo
          videoUrl={current.videoUrl}
          label={label || current.label}
          active={!isCrossFading}
        />
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

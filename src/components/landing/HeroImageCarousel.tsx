"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
          <Image
            src={HERO_SCENES[prevIdx].imageUrl}
            alt=""
            fill
            priority={currentIdx === prevIdx}
            sizes="560px"
            className="object-cover"
            style={{ filter: "brightness(0.45) saturate(0.9)" }}
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
        <Image
          src={HERO_SCENES[currentIdx].imageUrl}
          alt={label || HERO_SCENES[currentIdx].label}
          fill
          priority
          sizes="560px"
          className="object-cover"
          style={{
            filter: "brightness(0.45) saturate(0.9)",
          }}
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

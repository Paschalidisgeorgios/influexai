"use client";

import { useEffect, useRef } from "react";

const HERO_BG_VIDEO = "/videos/landing/feature-4.mp4";

interface Hero3DSceneProps {
  rgb: string;
}

export function Hero3DScene({ rgb }: Hero3DSceneProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={HERO_BG_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{ opacity: 0.42 }}
      />

      {/* Dark base + left-weighted gradient for headline legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(105deg, rgba(8,8,10,0.92) 0%, rgba(8,8,10,0.78) 28%, rgba(8,8,10,0.45) 55%, rgba(8,8,10,0.72) 100%),
            linear-gradient(to bottom, rgba(8,8,10,0.55) 0%, transparent 35%, rgba(8,8,10,0.85) 100%)
          `,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 22% 50%, transparent 0%, rgba(8,8,10,0.55) 100%)",
        }}
      />

      {/* Subtle theme accent glow — left side */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 45% 55% at 12% 45%, rgba(${rgb},0.12), transparent 70%)`,
          transition: "background 1.2s ease",
        }}
      />

      {/* Light film grain / blur wash on video edges */}
      <div
        className="absolute inset-0 backdrop-blur-[1px]"
        style={{
          maskImage: "linear-gradient(to right, black 0%, transparent 45%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, black 0%, transparent 45%, transparent 100%)",
        }}
      />
    </div>
  );
}

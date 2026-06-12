"use client";

import { useRef, useEffect, useState } from "react";
import type { HeroScene } from "@/lib/hero-videos";

interface Hero3DSceneProps {
  scene: HeroScene;
  sceneIdx: number;
  rgb: string;
  depthProgress: number;
  impulse?: number;
}

export function Hero3DScene({
  scene,
  rgb,
  depthProgress,
  impulse = 0,
}: Hero3DSceneProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, [scene.id]);

  const glowVisible = revealed || depthProgress > 0.3;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        perspective: "1200px",
        perspectiveOrigin: "50% 45%",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Ambient glow — z-index 0 */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 rounded-full transition-all duration-[1400ms] ease-out"
        style={{
          zIndex: 0,
          transform: "translate(-50%,-50%)",
          width: glowVisible ? "700px" : "0px",
          height: glowVisible ? "480px" : "0px",
          opacity: glowVisible ? 1 : 0,
          background: `radial-gradient(ellipse,rgba(${rgb},0.22) 0%,rgba(${rgb},0.07) 40%,transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      {/* 3D reveal container — z-index 2 */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "clamp(320px, 58vw, 580px)",
          height: "clamp(200px, 36vw, 370px)",
          borderRadius: "14px",
          overflow: "hidden",
          willChange: "transform, opacity, filter",
          zIndex: 2,
          boxShadow: `0 0 0 0.5px rgba(${rgb},0.35),
                      0 0 40px rgba(${rgb},0.2),
                      0 0 80px rgba(${rgb},0.08),
                      0 40px 80px rgba(0,0,0,0.7)`,
          transform: revealed
            ? `translate(-50%,-50%) perspective(1200px) translateZ(${impulse}px) scale(1)`
            : "translate(-50%,-50%) perspective(1200px) translateZ(-600px) scale(0.4)",
          opacity: revealed ? 1 : 0,
          filter: revealed ? "blur(0px)" : "blur(24px)",
          transition:
            "transform 2.5s cubic-bezier(0.16,1,0.3,1), opacity 2s ease, filter 2s ease",
        }}
      >
        <video
          key={scene.videoUrl}
          autoPlay
          loop
          playsInline
          preload="auto"
          ref={(el) => {
            if (el) {
              el.muted = true;
              el.play().catch(() => {});
            }
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.5) saturate(0.9)",
            display: "block",
            transform: "translateZ(0.01px)",
            WebkitTransform: "translateZ(0.01px)",
          }}
        >
          <source src={scene.videoUrl} type="video/mp4" />
        </video>

        {/* Gradient overlay — z-index 6 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: 6,
            background: `linear-gradient(135deg,rgba(${rgb},0.06),transparent 50%,rgba(${rgb},0.03))`,
            mixBlendMode: "screen",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(8,8,10,0.4)]"
          style={{ zIndex: 6 }}
        />

        {/* Border overlay — z-index 8 */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[14px]"
          style={{
            zIndex: 8,
            border: `0.5px solid rgba(${rgb},0.3)`,
          }}
        />

        {/* Scan line — z-index 10 */}
        <div
          className="pointer-events-none absolute right-0 left-0 h-px"
          style={{
            zIndex: 10,
            background: `linear-gradient(90deg,transparent,rgba(${rgb},0.8),transparent)`,
            animation: "scanLine 2.5s linear infinite",
            top: 0,
          }}
        />

        {/* Scene label */}
        <div
          className="pointer-events-none absolute bottom-3 left-3 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            zIndex: 10,
            background: "rgba(8,8,10,0.55)",
            color: `rgba(${rgb},0.85)`,
            backdropFilter: "blur(8px)",
          }}
        >
          {scene.label}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Ambient glow — z:0 */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: glowVisible ? "600px" : "0px",
          height: glowVisible ? "400px" : "0px",
          opacity: glowVisible ? 1 : 0,
          background: `radial-gradient(ellipse,rgba(${rgb},0.15),transparent 70%)`,
          filter: "blur(70px)",
          zIndex: 0,
          pointerEvents: "none",
          transition: "background 1.2s ease, width 1.4s ease, height 1.4s ease, opacity 1.4s ease",
        }}
      />

      {/* 3D video container — z:2 */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "clamp(280px, 88vw, 680px)",
          height: "clamp(180px, 55vw, 440px)",
          transform: revealed
            ? `translate(-50%, -50%) perspective(1200px) translateZ(${impulse}px) scale(1)`
            : "translate(-50%, -50%) perspective(1200px) translateZ(-600px) scale(0.4)",
          opacity: revealed ? 1 : 0,
          filter: revealed ? "blur(0px)" : "blur(24px)",
          transition:
            "transform 2.5s cubic-bezier(0.16,1,0.3,1), opacity 2s ease, filter 2s ease",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: `0 0 0 0.5px rgba(${rgb},0.35), 0 0 40px rgba(${rgb},0.15), 0 40px 80px rgba(0,0,0,0.7)`,
          willChange: "transform, opacity, filter",
          zIndex: 2,
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

        {/* Bottom gradient — z:6 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, transparent 40%, rgba(8,8,10,0.6))",
            zIndex: 6,
            pointerEvents: "none",
          }}
        />

        {/* Border — z:8 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "16px",
            border: `0.5px solid rgba(${rgb},0.3)`,
            zIndex: 8,
            pointerEvents: "none",
          }}
        />

        {/* Scene label */}
        <div
          className="absolute bottom-3 left-3 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            zIndex: 10,
            background: "rgba(8,8,10,0.55)",
            color: `rgba(${rgb},0.85)`,
            backdropFilter: "blur(8px)",
            pointerEvents: "none",
          }}
        >
          {scene.label}
        </div>
      </div>
    </div>
  );
}

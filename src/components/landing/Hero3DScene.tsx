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
  const innerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const mxRef = useRef(0);
  const myRef = useRef(0);
  const mxSmoothRef = useRef(0);
  const mySmoothRef = useRef(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mxRef.current = e.clientX / window.innerWidth - 0.5;
      myRef.current = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    if (!revealed) return;

    const tick = () => {
      mxSmoothRef.current += (mxRef.current - mxSmoothRef.current) * 0.06;
      mySmoothRef.current += (myRef.current - mySmoothRef.current) * 0.06;

      const tiltX = mySmoothRef.current * 8;
      const tiltY = mxSmoothRef.current * -8;

      if (innerRef.current) {
        innerRef.current.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [revealed]);

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
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -z-0 rounded-full transition-all duration-[1400ms] ease-out"
        style={{
          transform: "translate(-50%,-50%)",
          width: glowVisible ? "700px" : "0px",
          height: glowVisible ? "480px" : "0px",
          opacity: glowVisible ? 1 : 0,
          background: `radial-gradient(ellipse,rgba(${rgb},0.22) 0%,rgba(${rgb},0.07) 40%,transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "clamp(320px, 58vw, 580px)",
          height: "clamp(200px, 36vw, 370px)",
          transform: revealed
            ? `translate(-50%,-50%) perspective(1200px) translateZ(${impulse}px) scale(1)`
            : "translate(-50%,-50%) perspective(1200px) translateZ(-600px) scale(0.4)",
          opacity: revealed ? 1 : 0,
          filter: revealed ? "blur(0px)" : "blur(24px)",
          transition: [
            "transform 2.5s cubic-bezier(0.16,1,0.3,1)",
            "opacity 2s ease",
            "filter 2s ease",
          ].join(", "),
          willChange: "transform, opacity, filter",
          zIndex: 2,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          ref={innerRef}
          className="relative h-full w-full"
          style={{
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          <div
            className="relative h-full w-full overflow-hidden rounded-[14px]"
            style={{
              boxShadow: `0 0 0 0.5px rgba(${rgb},0.35),
                          0 0 40px rgba(${rgb},0.2),
                          0 0 80px rgba(${rgb},0.08),
                          0 40px 80px rgba(0,0,0,0.7)`,
              transition: "box-shadow 1.2s ease",
            }}
          >
            <video
              key={scene.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster={scene.fallbackImageUrl}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                filter: "brightness(0.45) saturate(0.9)",
                borderRadius: "14px",
              }}
            >
              <source src={scene.videoUrl} type="video/mp4" />
            </video>

            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(135deg,rgba(${rgb},0.06),transparent 50%,rgba(${rgb},0.03))`,
                mixBlendMode: "screen",
                transition: "background 1.2s ease",
              }}
            />

            <div
              className="pointer-events-none absolute right-0 left-0 z-10 h-px"
              style={{
                background: `linear-gradient(90deg,transparent,rgba(${rgb},0.8),transparent)`,
                animation: "scanLine 2.5s linear infinite",
                top: "0",
              }}
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(8,8,10,0.4)]" />

            <div
              className="pointer-events-none absolute inset-0 rounded-[14px]"
              style={{
                border: `0.5px solid rgba(${rgb},0.3)`,
                transition: "border-color 1.2s ease",
              }}
            />

            <div
              className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: "rgba(8,8,10,0.55)",
                color: `rgba(${rgb},0.85)`,
                backdropFilter: "blur(8px)",
              }}
            >
              {scene.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

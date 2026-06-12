"use client";

import { useRef, useEffect } from "react";
import type { HeroScene } from "@/lib/hero-videos";
import { HeroImageCarousel } from "./HeroImageCarousel";

interface Hero3DSceneProps {
  scene: HeroScene;
  sceneIdx: number;
  rgb: string;
  depthProgress: number;
  impulse?: number;
}

export function Hero3DScene({
  scene,
  sceneIdx,
  rgb,
  depthProgress,
  impulse = 0,
}: Hero3DSceneProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const depthRef = useRef(0);
  const targetDepthRef = useRef(depthProgress);
  const mxRef = useRef(0);
  const myRef = useRef(0);
  const mxSmoothRef = useRef(0);
  const mySmoothRef = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mxRef.current = e.clientX / window.innerWidth - 0.5;
      myRef.current = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    targetDepthRef.current = depthProgress;
  }, [depthProgress]);

  useEffect(() => {
    let last = performance.now();

    const tick = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;

      depthRef.current += (targetDepthRef.current - depthRef.current) * 0.028;

      mxSmoothRef.current += (mxRef.current - mxSmoothRef.current) * 0.06;
      mySmoothRef.current += (myRef.current - mySmoothRef.current) * 0.06;

      const d = depthRef.current;
      const ep = 1 - Math.pow(1 - d, 3);
      const z = -500 + 500 * ep + impulse;
      const scale = 0.5 + 0.5 * ep;
      const blur = Math.max(0, 20 - 20 * ep);
      const opacity = Math.min(1, d * 2.5);
      const tiltX = mySmoothRef.current * 8 * ep;
      const tiltY = mxSmoothRef.current * -8 * ep;

      if (wrapRef.current) {
        wrapRef.current.style.transform = `translate(-50%,-50%) perspective(1200px) translateZ(${z}px) scale(${scale}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        wrapRef.current.style.opacity = String(opacity);
        wrapRef.current.style.filter = `blur(${blur}px)`;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [impulse]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ perspective: "1200px", perspectiveOrigin: "50% 45%" }}
    >
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -z-0 rounded-full transition-all duration-[1400ms] ease-out"
        style={{
          transform: "translate(-50%,-50%)",
          width: depthProgress > 0.3 ? "700px" : "0px",
          height: depthProgress > 0.3 ? "480px" : "0px",
          opacity: depthProgress > 0.3 ? 1 : 0,
          background: `radial-gradient(ellipse,rgba(${rgb},0.22) 0%,rgba(${rgb},0.07) 40%,transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      <div
        ref={wrapRef}
        className="absolute top-1/2 left-1/2"
        style={{
          width: "560px",
          height: "356px",
          willChange: "transform, opacity, filter",
          transformStyle: "preserve-3d",
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
          <HeroImageCarousel currentIdx={sceneIdx} rgb={rgb} label={scene.label} />

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
        </div>
      </div>
    </div>
  );
}

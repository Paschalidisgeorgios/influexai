"use client";

import { useEffect, useRef } from "react";

const HERO_BG_VIDEO = "/videos/landing/feature-4.mp4";

export function Hero3DScene() {
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
        style={{ opacity: 0.44 }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(105deg, rgba(5,6,8,0.84) 0%, rgba(5,6,8,0.58) 28%, rgba(5,6,8,0.18) 55%, rgba(5,6,8,0.52) 100%),
            linear-gradient(to bottom, rgba(5,6,8,0.12) 0%, transparent 22%, rgba(5,6,8,0.72) 100%)
          `,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 22% 50%, transparent 0%, rgba(5,6,8,0.5) 100%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 40% 50% at 12% 40%, rgba(var(--ai-green-rgb), 0.14), transparent 70%),
            radial-gradient(ellipse 35% 45% at 88% 25%, rgba(var(--ai-blue-rgb), 0.1), transparent 70%),
            radial-gradient(ellipse 30% 40% at 70% 90%, rgba(var(--ai-yellow-rgb), 0.06), transparent 70%)
          `,
        }}
      />
    </div>
  );
}

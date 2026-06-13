"use client";

import { forwardRef } from "react";
import type { AIModel, ThemeColor } from "@/lib/dashboard-v3/registry";

interface WorkspaceMediaRevealProps {
  model: AIModel;
  theme: ThemeColor;
}

export const WorkspaceMediaReveal = forwardRef<HTMLDivElement, WorkspaceMediaRevealProps>(
  function WorkspaceMediaReveal({ model, theme }, ref) {
    return (
      <div
        ref={ref}
        className="absolute top-1/2 left-1/2"
        style={{
          width: "clamp(300px, 56vw, 600px)",
          aspectRatio: "16/10",
          willChange: "transform, opacity, filter",
          transformStyle: "preserve-3d",
          borderRadius: "14px",
          overflow: "hidden",
          opacity: 0,
          zIndex: 3,
          boxShadow: `
            0 0 0 0.5px rgba(${theme.rgb},0.35),
            0 0 40px rgba(${theme.rgb},0.18),
            0 0 80px rgba(${theme.rgb},0.07),
            0 40px 80px rgba(0,0,0,0.75)
          `,
          transition: "box-shadow 1.2s ease",
        }}
      >
        <video
          key={model.sampleMediaUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          ref={(el) => {
            if (el) {
              el.muted = true;
              void el.play().catch(() => {});
            }
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.45) saturate(0.9)",
          }}
        >
          <source src={model.sampleMediaUrl} type="video/mp4" />
        </video>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "1px",
            background: `linear-gradient(90deg,transparent,rgba(${theme.rgb},0.8),transparent)`,
            animation: "scanLine 2.5s linear infinite",
            zIndex: 5,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, rgba(7,7,9,0.5))",
            zIndex: 4,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "14px",
            border: `0.5px solid rgba(${theme.rgb},0.3)`,
            zIndex: 6,
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }
);

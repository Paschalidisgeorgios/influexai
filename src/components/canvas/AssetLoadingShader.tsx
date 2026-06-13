"use client";

import { memo, type CSSProperties } from "react";

export type AssetShaderAccent = "green" | "violet";

type AssetLoadingShaderProps = {
  progress: number;
  label?: string;
  accent?: AssetShaderAccent;
  className?: string;
};

const ACCENT_COLORS: Record<AssetShaderAccent, { primary: string; rgb: string }> = {
  green: { primary: "#ccff00", rgb: "204,255,0" },
  violet: { primary: "#a855f7", rgb: "168,85,247" },
};

function accentForOutputType(outputType?: string): AssetShaderAccent {
  if (outputType === "video" || outputType === "audio") return "violet";
  return "green";
}

export { accentForOutputType };

function AssetLoadingShaderComponent({
  progress,
  label = "Rendering",
  accent = "green",
  className = "",
}: AssetLoadingShaderProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const { primary, rgb } = ACCENT_COLORS[accent];
  const calm = clamped / 100;
  const animationDuration = `${Math.max(1.8, 3.4 - calm * 1.6)}s`;

  return (
    <div
      className={`asset-shader relative overflow-hidden rounded-lg bg-[#050505] ${className}`}
      style={
        {
          "--shader-accent": primary,
          "--shader-accent-rgb": rgb,
          "--shader-duration": animationDuration,
          "--shader-calm": calm,
        } as CSSProperties
      }
      role="status"
      aria-live="polite"
      aria-label={`${label}: ${Math.round(clamped)} Prozent`}
    >
      <div className="asset-shader-noise pointer-events-none absolute inset-0" aria-hidden />
      <div className="asset-shader-grid pointer-events-none absolute inset-0" aria-hidden />
      <svg
        className="asset-shader-waves pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 400 225"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="shader-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} stopOpacity="0" />
            <stop offset="50%" stopColor={primary} stopOpacity="0.35" />
            <stop offset="100%" stopColor={primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="asset-shader-wave-path"
          d="M0,140 C80,100 120,180 200,130 S320,90 400,140 L400,225 L0,225 Z"
          fill="url(#shader-wave-grad)"
          opacity={0.25 + calm * 0.15}
        />
        <path
          className="asset-shader-wave-path asset-shader-wave-path--delay"
          d="M0,160 C90,120 140,200 220,150 S330,110 400,160 L400,225 L0,225 Z"
          fill="url(#shader-wave-grad)"
          opacity={0.15 + calm * 0.1}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <p
          className="asset-shader-percent font-mono text-sm font-semibold tracking-wide"
          style={{
            color: primary,
            textShadow: `0 0 18px rgba(${rgb}, 0.55)`,
          }}
        >
          {label}: {Math.round(clamped)}%
        </p>
        <p className="text-[9px] uppercase tracking-[0.14em] text-white/35">
          KI berechnet…
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-white/5">
        <div
          className="asset-shader-progress h-full transition-[width] duration-300 ease-out"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
            boxShadow: `0 0 12px rgba(${rgb}, 0.6)`,
          }}
        />
      </div>
    </div>
  );
}

export const AssetLoadingShader = memo(AssetLoadingShaderComponent);

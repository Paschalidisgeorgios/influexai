"use client";

import { useRef, useState } from "react";
import type { SzenenFeatureTag, SzenenGeneratorModel } from "@/lib/szenen-generator-models";

const TAG_ICONS: Record<SzenenFeatureTag, string> = {
  Start: "▶",
  End: "◼",
  Audio: "♪",
  Referenz: "◎",
  "Multi-Shot": "⧉",
  "Multi-Ratio": "⬒",
};

type ModelCardProps = {
  model: SzenenGeneratorModel;
  active: boolean;
  neighborHover: boolean;
  onSelect: () => void;
  onLongHover: () => void;
  cardRef?: (el: HTMLButtonElement | null) => void;
};

export function ModelCard({
  model,
  active,
  neighborHover,
  onSelect,
  onLongHover,
  cardRef,
}: ModelCardProps) {
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, px: 0, py: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: y * -8,
      y: x * 8,
      px: x * -8,
      py: y * -8,
    });
  };

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onSelect}
      onMouseEnter={() => {
        setHovered(true);
        hoverTimer.current = setTimeout(onLongHover, 2000);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setTilt({ x: 0, y: 0, px: 0, py: 0 });
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
      }}
      onMouseMove={handleMouseMove}
      className="relative mb-1.5 w-full rounded-[14px] border px-3 py-2.5 text-left will-change-transform"
      style={{
        borderColor: active
          ? "var(--szenen-accent-30)"
          : "rgba(255,255,255,0.06)",
        background: active
          ? "rgba(255,255,255,0.04)"
          : "rgba(255,255,255,0.025)",
        transform: hovered
          ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
          : neighborHover
            ? "scale(0.99)"
            : "scale(1)",
        transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), border-color 0.7s ease, background 0.3s ease",
        borderLeftWidth: active ? 2 : 1,
        borderLeftColor: active ? "var(--szenen-accent)" : undefined,
      }}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 h-[14px] w-[14px] shrink-0 rounded-full border transition-all duration-[1200ms] ease-in-out"
          style={{
            borderColor: active ? "var(--szenen-accent)" : "rgba(255,255,255,0.2)",
            background: active ? "var(--szenen-accent)" : "transparent",
            transform: `translate(${tilt.px * 0.3}px, ${tilt.py * 0.3}px)`,
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#e0e0e0]">{model.name}</span>
            {model.badge && (
              <span
                className="rounded px-1.5 py-0.5 text-[9px]"
                style={{
                  background: "var(--szenen-accent-10)",
                  color: "var(--szenen-accent-text-muted)",
                }}
              >
                {model.badge}
              </span>
            )}
          </div>
          <p className="ml-[22px] mt-1 text-[11px] leading-snug text-white/25">
            {model.description}
          </p>
          <div className="ml-[22px] mt-2 flex flex-wrap gap-1">
            {model.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-full border-[0.5px] border-white/10 px-1.5 py-0.5 text-[10px] text-white/25"
              >
                <span aria-hidden>{TAG_ICONS[tag]}</span>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-[10px] text-white/25">{model.creditEstimate}</span>
      </div>
    </button>
  );
}

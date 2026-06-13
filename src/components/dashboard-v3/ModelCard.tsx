"use client";

import { useRef } from "react";
import type { AIModel, ThemeColor } from "@/lib/dashboard-v3/registry";

interface ModelCardProps {
  model: AIModel;
  theme: ThemeColor;
  active: boolean;
  onSelect: (modelId: string) => void;
  onLongHover?: () => void;
}

export function ModelCard({ model, theme, active, onSelect, onLongHover }: ModelCardProps) {
  const hoverTimer = useRef<number | null>(null);

  return (
    <button
      type="button"
      onClick={() => onSelect(model.id)}
      onMouseEnter={() => {
      hoverTimer.current = window.setTimeout(() => onLongHover?.(), 2000);
      }}
      onMouseLeave={() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
      }}
      className="w-full px-4 py-2.5 text-left transition-colors duration-300"
      style={{
        borderLeft: active
          ? `2px solid rgba(${theme.rgb},0.7)`
          : "2px solid transparent",
        background: active ? `rgba(${theme.rgb},0.06)` : undefined,
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="text-[13px] font-bold"
          style={{ color: active ? `rgb(${theme.rgb})` : "rgba(255,255,255,0.85)" }}
        >
          {model.name}
        </span>
        <span className="font-mono text-[10px] text-white/35">{model.creditCost}</span>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-white/35">{model.description}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {model.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-sm border border-white/[0.08] bg-white/[0.05] px-1.5 py-0.5 text-[8px] text-white/45"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

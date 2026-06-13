"use client";

import { memo, useMemo } from "react";

type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

type CanvasDonutChartProps = {
  segments: DonutSegment[];
  size?: number;
};

function CanvasDonutChartComponent({ segments, size = 88 }: CanvasDonutChartProps) {
  const { paths, total } = useMemo(() => {
    const sum = segments.reduce((acc, s) => acc + s.value, 0) || 1;
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const items = segments.map((seg) => {
      const pct = seg.value / sum;
      const dash = pct * circumference;
      const path = {
        ...seg,
        dash,
        gap: circumference - dash,
        offset,
      };
      offset += dash;
      return path;
    });

    return { paths: items, total: sum };
  }, [segments]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 88 88"
        className="h-full w-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="44"
          cy="44"
          r="34"
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="9"
        />
        {paths.map((seg) =>
          seg.value > 0 ? (
            <circle
              key={seg.label}
              cx="44"
              cy="44"
              r="34"
              fill="none"
              stroke={seg.color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-seg.offset}
              className="canvas-donut-segment"
            />
          ) : null
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold tabular-nums text-white">{total}</span>
        <span className="text-[8px] uppercase tracking-wider text-zinc-500">Coins</span>
      </div>
    </div>
  );
}

export const CanvasDonutChart = memo(CanvasDonutChartComponent);

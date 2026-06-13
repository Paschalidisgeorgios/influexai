"use client";

import { memo, useId, useMemo } from "react";

type CanvasSparklineProps = {
  data: number[];
  color: string;
  label: string;
  total: number;
};

function CanvasSparklineComponent({ data, color, label, total }: CanvasSparklineProps) {
  const gradId = useId().replace(/:/g, "");
  const points = useMemo(() => {
    const w = 100;
    const h = 32;
    const max = Math.max(...data, 1);
    if (data.length <= 1) return { w, h, polyline: `0,${h} ${w},${h}` };

    const polyline = data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / max) * (h - 4) - 2;
        return `${x},${y}`;
      })
      .join(" ");

    return { w, h, polyline };
  }, [data]);

  return (
    <div className="canvas-sparkline min-w-0 flex-1">
      <div className="mb-1 flex items-baseline justify-between gap-1">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</span>
        <span className="font-mono text-[10px] tabular-nums text-zinc-300">
          {total.toLocaleString("de-DE")}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${points.w} ${points.h}`}
        preserveAspectRatio="none"
        className="h-8 w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${points.h} ${points.polyline} ${points.w},${points.h}`}
          fill={`url(#${gradId})`}
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points.polyline}
          className="canvas-sparkline-line"
        />
      </svg>
    </div>
  );
}

export const CanvasSparkline = memo(CanvasSparklineComponent);

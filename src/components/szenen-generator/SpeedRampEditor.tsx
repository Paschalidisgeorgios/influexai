"use client";

import { useMemo, useState } from "react";

type SpeedPreset = "auto" | "linear" | "ease-in" | "ease-out";

const PRESETS: { id: SpeedPreset; label: string; points: [number, number][] }[] = [
  { id: "auto", label: "Auto", points: [[0, 0.85], [0.35, 0.95], [0.65, 0.75], [1, 0.2]] },
  { id: "linear", label: "Linear", points: [[0, 0.2], [0.33, 0.45], [0.66, 0.7], [1, 0.95]] },
  { id: "ease-in", label: "Ease In", points: [[0, 0.95], [0.35, 0.8], [0.7, 0.45], [1, 0.15]] },
  { id: "ease-out", label: "Ease Out", points: [[0, 0.15], [0.3, 0.4], [0.65, 0.75], [1, 0.95]] },
];

function toPath(points: [number, number][], w: number, h: number) {
  const scaled = points.map(([x, y]) => [x * w, (1 - y) * h] as const);
  return `M ${scaled[0][0]},${scaled[0][1]} C ${scaled[1][0]},${scaled[1][1]} ${scaled[2][0]},${scaled[2][1]} ${scaled[3][0]},${scaled[3][1]}`;
}

export function SpeedRampEditor() {
  const [preset, setPreset] = useState<SpeedPreset>("auto");
  const [points, setPoints] = useState<[number, number][]>(PRESETS[0].points);

  const path = useMemo(() => toPath(points, 280, 80), [points]);

  const applyPreset = (id: SpeedPreset) => {
    setPreset(id);
    const found = PRESETS.find((p) => p.id === id);
    if (found) setPoints(found.points);
  };

  const dragPoint = (index: number, e: React.MouseEvent<SVGCircleElement>) => {
    e.preventDefault();
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();

    const onMove = (ev: MouseEvent) => {
      const x = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, 1 - (ev.clientY - rect.top) / rect.height));
      setPoints((prev) => {
        const next = [...prev] as [number, number][];
        next[index] = [x, y];
        return next;
      });
      setPreset("auto");
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-white/50">Speed Ramp</span>
        <select
          value={preset}
          onChange={(e) => applyPreset(e.target.value as SpeedPreset)}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[12px] text-white/70 outline-none"
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <svg viewBox="0 0 280 80" className="w-full rounded-[14px] border border-white/10 bg-black/30">
        <path d={path} fill="none" stroke="var(--szenen-accent)" strokeWidth="2" />
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x * 280}
            cy={(1 - y) * 80}
            r={5}
            fill="var(--szenen-accent)"
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => dragPoint(i, e)}
          />
        ))}
      </svg>
    </div>
  );
}

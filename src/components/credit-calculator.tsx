"use client";

import { useMemo, useState } from "react";
import { CREDIT_CALCULATOR_TIERS } from "@/lib/credit-packages";
import "@/styles/credits-glass.css";

const USE_CASES = [
  { key: "scripts", icon: "📝", label: "Scripts", divisor: 2 },
  { key: "niche", icon: "📈", label: "Niche Analysen", divisor: 2 },
  { key: "outlier", icon: "🔥", label: "Outlier Detektionen", divisor: 3 },
  { key: "thumbnails", icon: "🖼️", label: "Thumbnails", divisor: 1 },
  { key: "ads", icon: "🛍️", label: "Video Ads", divisor: 3 },
] as const;

const HIGHLIGHT_BY_TYPE: Record<string, string> = {
  "script-generator": "scripts",
  "niche-analyzer": "niche",
  "outlier-detector": "outlier",
  "thumbnail-concept": "thumbnails",
  produkt: "ads",
  "video-remix": "scripts",
};

const GLASS_CARD =
  "rounded-xl border border-zinc-800/50 bg-zinc-950/40 p-6 shadow-2xl backdrop-blur-md";

type Props = {
  topFeatureType?: string | null;
};

export function CreditCalculator({ topFeatureType }: Props) {
  const [tierIndex, setTierIndex] = useState(1);
  const credits = CREDIT_CALCULATOR_TIERS[tierIndex];

  const highlightKey = topFeatureType
    ? (HIGHLIGHT_BY_TYPE[topFeatureType] ?? "scripts")
    : "scripts";

  const rows = useMemo(
    () =>
      USE_CASES.map((u) => ({
        ...u,
        count: Math.floor(credits / u.divisor),
        highlight: u.key === highlightKey,
      })),
    [credits, highlightKey]
  );

  const maxCount = useMemo(
    () => Math.max(...rows.map((row) => row.count), 1),
    [rows]
  );

  return (
    <div className={`${GLASS_CARD} mb-6`}>
      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        Credit Rechner
      </p>
      <h2 className="mb-2 font-sans text-xl font-extrabold uppercase tracking-tight text-white md:text-2xl">
        Was kannst du mit{" "}
        <span className="font-mono font-bold text-[#ccff00]">{credits}</span> Credits
        machen?
      </h2>
      <p className="mb-6 font-sans text-sm leading-relaxed text-zinc-400">
        Ziehe den Slider — sieh live, wie viele Creationen möglich sind.
      </p>

      <input
        type="range"
        data-testid="credit-calculator-slider"
        aria-label="Credits für Rechner"
        min={0}
        max={CREDIT_CALCULATOR_TIERS.length - 1}
        step={1}
        value={tierIndex}
        onChange={(e) => setTierIndex(Number(e.target.value))}
        className="credits-glass-slider mb-4"
      />

      <div className="mb-6 flex justify-between font-mono text-[10px] text-zinc-500">
        {CREDIT_CALCULATOR_TIERS.map((n) => (
          <span
            key={n}
            className={
              credits === n ? "font-bold text-[#ccff00]" : "text-zinc-500"
            }
          >
            {n}
          </span>
        ))}
      </div>

      <ul className="space-y-4">
        {rows.map((row) => {
          const fillPercent = Math.round((row.count / maxCount) * 100);

          return (
            <li key={row.key}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-sans text-sm text-zinc-300">
                  {row.icon} {row.label}
                  {row.highlight ? (
                    <span className="ml-2 font-mono text-[9px] font-bold uppercase tracking-wider text-[#ccff00]">
                      Dein Favorit
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 font-mono text-sm font-bold text-zinc-400">
                  {row.count}
                </span>
              </div>
              <div className="h-px w-full overflow-hidden rounded-full bg-zinc-800/70">
                <div
                  className="h-full rounded-full bg-[#ccff00] transition-[width] duration-500 ease-out"
                  style={{
                    width: `${fillPercent}%`,
                    opacity: row.highlight ? 1 : 0.72,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

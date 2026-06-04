"use client";

import { useMemo, useState } from "react";
import { CREDIT_CALCULATOR_TIERS } from "@/lib/credit-packages";

const USE_CASES = [
  { key: "scripts", icon: "📝", label: "Scripts", divisor: 2 },
  { key: "niche", icon: "📈", label: "Niche Analysen", divisor: 2 },
  { key: "outlier", icon: "🔥", label: "Outlier Detektionen", divisor: 3 },
  { key: "thumbnails", icon: "🖼️", label: "Thumbnails", divisor: 1 },
  { key: "ads", icon: "🛍️", label: "Video Ads", divisor: 5 },
] as const;

const HIGHLIGHT_BY_TYPE: Record<string, string> = {
  "script-generator": "scripts",
  "niche-analyzer": "niche",
  "outlier-detector": "outlier",
  "thumbnail-concept": "thumbnails",
  produkt: "ads",
  "video-remix": "scripts",
};

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

  return (
    <div
      style={{
        padding: 22,
        borderRadius: 16,
        background: "#0f0f12",
        border: "1px solid rgba(255,255,255,0.07)",
        marginBottom: 28,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "1.35rem",
          letterSpacing: "0.02em",
          color: "#F0EFE8",
          marginBottom: 6,
        }}
      >
        Was kannst du mit {credits} Credits machen?
      </h2>
      <p style={{ fontSize: "0.8rem", color: "#505055", marginBottom: 18 }}>
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
        style={{
          width: "100%",
          marginBottom: 20,
          accentColor: "#B4FF00",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.72rem",
          color: "#505055",
          marginTop: -12,
          marginBottom: 16,
        }}
      >
        {CREDIT_CALCULATOR_TIERS.map((n) => (
          <span
            key={n}
            style={{
              fontWeight: credits === n ? 700 : 400,
              color: credits === n ? "#B4FF00" : "#505055",
            }}
          >
            {n}
          </span>
        ))}
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((row) => (
          <li
            key={row.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              marginBottom: 6,
              borderRadius: 10,
              background: row.highlight
                ? "rgba(180,255,0,0.08)"
                : "rgba(255,255,255,0.02)",
              border: row.highlight
                ? "1px solid rgba(180,255,0,0.2)"
                : "1px solid transparent",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: "#F0EFE8" }}>
              {row.icon} {row.label}
              {row.highlight && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: "0.62rem",
                    color: "#B4FF00",
                    fontWeight: 700,
                  }}
                >
                  Dein Favorit
                </span>
              )}
            </span>
            <span
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "1.25rem",
                color: row.highlight ? "#B4FF00" : "#F0EFE8",
              }}
            >
              {row.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

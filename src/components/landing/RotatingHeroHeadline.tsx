"use client";

import { useEffect, useState } from "react";

const DIRECTIONS = ["up", "down", "left", "right"] as const;
type Direction = (typeof DIRECTIONS)[number];

type Props = {
  titles: string[];
  intervalMs?: number;
};

function parseLines(title: string): string[] {
  return title.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function RotatingHeroHeadline({ titles, intervalMs = 2000 }: Props) {
  const [index, setIndex] = useState(0);
  const [dirIndex, setDirIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const direction: Direction = DIRECTIONS[dirIndex % DIRECTIONS.length];
  const lines = parseLines(titles[index] ?? "");
  const accentIndex = Math.max(0, lines.length - 1);

  useEffect(() => {
    if (titles.length <= 1) return;

    let swapTimeout: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setVisible(false);
      swapTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % titles.length);
        setDirIndex((d) => (d + 1) % DIRECTIONS.length);
        setVisible(true);
      }, 320);
    }, intervalMs);

    return () => {
      clearInterval(id);
      clearTimeout(swapTimeout);
    };
  }, [titles.length, intervalMs]);

  if (lines.length === 0) return null;

  return (
    <h1
      className="mb-7 overflow-hidden"
      style={{
        fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
        fontSize: "clamp(3.2rem, 8vw, 7.5rem)",
        letterSpacing: "0.02em",
        lineHeight: 0.92,
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        key={`${index}-${direction}`}
        className={`hero-rotate hero-rotate--${direction} ${
          visible ? "hero-rotate--in" : "hero-rotate--out"
        }`}
      >
        {lines.map((line, i) => (
          <span key={`${index}-${i}`} className="block">
            {i === accentIndex ? (
              <span style={{ color: "#B4FF00" }}>{line}</span>
            ) : (
              line
            )}
          </span>
        ))}
      </span>
    </h1>
  );
}

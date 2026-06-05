"use client";

import { useEffect, useMemo, useState } from "react";

const LINE_1_DELAY = 50;
const LINE_2_DELAY = 200;
const LINE_3_DELAY = 350;
const HOLD_UNTIL = 2800;
const NEXT_TITLE_AT = 3200;

type TitleSlide = { lines: string[] };

type Props = {
  titles: string[];
};

function parseSlides(raw: string[]): TitleSlide[] {
  return raw
    .map((title) => ({
      lines: title
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    }))
    .filter((slide) => slide.lines.length > 0);
}

export function HeroTitle({ titles }: Props) {
  const slides = useMemo(() => parseSlides(titles), [titles]);
  const [index, setIndex] = useState(0);
  const [lines, setLines] = useState([false, false, false]);

  const slide = slides[index];
  const lineCount = slide?.lines.length ?? 0;

  useEffect(() => {
    if (slides.length === 0) return;

    setLines([false, false, false]);

    const t1 = setTimeout(() => setLines([true, false, false]), LINE_1_DELAY);
    const t2 = setTimeout(() => setLines([true, true, false]), LINE_2_DELAY);
    const t3 = setTimeout(() => setLines([true, true, true]), LINE_3_DELAY);
    const t4 = setTimeout(() => setLines([false, false, false]), HOLD_UNTIL);
    const t5 = setTimeout(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, NEXT_TITLE_AT);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [index, slides.length]);

  if (!slide || lineCount === 0) return null;

  const accentIndex = lineCount - 1;

  return (
    <h1
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "relative",
        minHeight: 320,
        marginBottom: 28,
        fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
      }}
    >
      {slide.lines.map((line, i) => {
        const visible = lines[i] ?? false;
        return (
          <span
            key={`${index}-${i}-${line}`}
            style={{
              display: "block",
              fontSize: "clamp(52px, 12vw, 120px)",
              fontWeight: 400,
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              color: i === accentIndex ? "var(--accent, #B4FF00)" : "#ffffff",
              textShadow: "none",
              WebkitTextStroke: "0",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0px)" : "translateY(16px)",
              transition: visible
                ? "opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
                : "opacity 0.3s ease, transform 0.3s ease",
              marginBottom: 2,
            }}
          >
            {line}
          </span>
        );
      })}
    </h1>
  );
}

/** @deprecated Use HeroTitle */
export function RotatingHeroHeadline({ titles }: Props) {
  return <HeroTitle titles={titles} />;
}

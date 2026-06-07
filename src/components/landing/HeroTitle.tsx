"use client";

import { useEffect, useMemo, useState } from "react";

const SLIDE_INTERVAL_MS = 3200;

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
  const slideCount = slides.length;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

  const maxLines = useMemo(
    () => Math.max(...slides.map((s) => s.lines.length), 1),
    [slides]
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (slideCount <= 1 || reducedMotion) return;

    const id = setInterval(() => {
      setFadeIn(false);
      window.setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slideCount);
        setFadeIn(true);
      }, 200);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(id);
  }, [slideCount, reducedMotion]);

  if (slideCount === 0) return null;

  const slide = slides[currentSlide];
  if (!slide) return null;

  const accentIndex = slide.lines.length - 1;

  const headingStyle = {
    fontFamily: "var(--heading-font)",
    fontWeight: "var(--heading-weight, 400)" as unknown as number,
    fontStyle: "var(--heading-style, normal)" as React.CSSProperties["fontStyle"],
    letterSpacing: "var(--heading-tracking, -0.04em)",
    textTransform:
      "var(--heading-transform, uppercase)" as React.CSSProperties["textTransform"],
    opacity: fadeIn || reducedMotion ? 1 : 0,
    transition: reducedMotion ? "none" : "opacity 280ms ease-out",
  };

  const minHeight =
    maxLines >= 3
      ? "clamp(5.75rem, 28vw, 20rem)"
      : maxLines >= 2
        ? "clamp(3.75rem, 18vw, 14rem)"
        : "clamp(2.5rem, 10vw, 7rem)";

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="w-full max-w-full"
      style={{ minHeight }}
    >
      <h1 style={headingStyle}>
        {slide.lines.map((line, i) => (
          <span
            key={`${currentSlide}-${i}-${line}`}
            className="block w-full max-w-full text-[clamp(36px,9vw,72px)] md:text-[clamp(52px,12vw,120px)]"
            style={{
              fontWeight: "inherit",
              lineHeight: "var(--heading-leading, 0.88)",
              letterSpacing: "inherit",
              textTransform: "inherit",
              color: i === accentIndex ? "var(--accent, #B4FF00)" : "#ffffff",
              textShadow: "none",
              WebkitTextStroke: "0",
              marginBottom: 2,
            }}
          >
            {line}
          </span>
        ))}
      </h1>
    </div>
  );
}

/** @deprecated Use HeroTitle */
export function RotatingHeroHeadline({ titles }: Props) {
  return <HeroTitle titles={titles} />;
}

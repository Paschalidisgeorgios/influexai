"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseHeroTitleSlides,
  type HeroTitleInput,
  type HeroTitleSlide,
} from "@/data/heroRotatingTitles";

const SLIDE_INTERVAL_MS = 3200;
const ACCENT = "var(--accent, #B4FF00)";
const WHITE = "#ffffff";

type Props = {
  titles: HeroTitleInput[];
};

function accentLineIndex(slide: HeroTitleSlide): number {
  if (slide.highlightWord) {
    const idx = slide.lines.findIndex(
      (line) =>
        line.trim() === slide.highlightWord ||
        line.trim().endsWith(` ${slide.highlightWord}`) ||
        line.includes(slide.highlightWord ?? "")
    );
    if (idx >= 0) return idx;
  }
  if (slide.highlightLine != null) return slide.highlightLine;
  return slide.lines.length - 1;
}

function renderLineContent(line: string, slide: HeroTitleSlide, lineIndex: number) {
  const accentIdx = accentLineIndex(slide);
  const isAccentLine = lineIndex === accentIdx;

  if (!slide.highlightWord || !isAccentLine) {
    return line;
  }

  const word = slide.highlightWord;
  const idx = line.indexOf(word);
  if (idx < 0) {
    return line;
  }

  const before = line.slice(0, idx);
  const after = line.slice(idx + word.length);

  return (
    <>
      {before ? <span style={{ color: WHITE }}>{before}</span> : null}
      <span style={{ color: ACCENT }}>{word}</span>
      {after ? <span style={{ color: WHITE }}>{after}</span> : null}
    </>
  );
}

export function HeroTitle({ titles }: Props) {
  const slides = useMemo(() => parseHeroTitleSlides(titles), [titles]);
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

  const accentIdx = accentLineIndex(slide);

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
      ? "clamp(4.5rem, 24vw, 20rem)"
      : maxLines >= 2
        ? "clamp(3rem, 16vw, 14rem)"
        : "clamp(2.25rem, 9vw, 7rem)";

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
            className="block w-full max-w-full text-[clamp(36px,10vw,84px)] md:text-[clamp(52px,12vw,120px)]"
            style={{
              fontWeight: "inherit",
              lineHeight: "var(--heading-leading, 0.88)",
              letterSpacing: "inherit",
              textTransform: "inherit",
              color: i === accentIdx && !slide.highlightWord ? ACCENT : WHITE,
              textShadow: "none",
              WebkitTextStroke: "0",
              marginBottom: 2,
            }}
          >
            {slide.highlightWord && i === accentIdx
              ? renderLineContent(line, slide, i)
              : line}
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

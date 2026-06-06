"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

  useEffect(() => {
    if (slideCount <= 1) return;

    const id = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(id);
  }, [slideCount]);

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
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="relative mb-7 min-h-[160px] w-full max-w-full md:mb-7 md:min-h-[320px]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** @deprecated Use HeroTitle */
export function RotatingHeroHeadline({ titles }: Props) {
  return <HeroTitle titles={titles} />;
}

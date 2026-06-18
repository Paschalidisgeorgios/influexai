"use client";

import { useMemo, useRef, useState } from "react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useHeroKeywordRotate } from "../hooks/useHeroKeywordRotate";

type LandingV2HeroKeywordHeadlineProps = {
  id?: string;
  className?: string;
};

const copy = LANDING_V2_COPY.hero;
const keywords = copy.rotatingKeywords;

const LONG_KEYWORD_LENGTH = 14;

export function LandingV2HeroKeywordHeadline({
  id = "lv2-hero-heading",
  className = "",
}: LandingV2HeroKeywordHeadlineProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const keywordRef = useRef<HTMLSpanElement>(null);

  const longestKeyword = useMemo(
    () =>
      keywords.reduce(
        (longest, keyword) => (keyword.length > longest.length ? keyword : longest),
        keywords[0]
      ),
    []
  );

  const activeKeyword = keywords[activeIndex] ?? keywords[0];
  const isLongKeyword = activeKeyword.length >= LONG_KEYWORD_LENGTH;

  useHeroKeywordRotate({
    keywordRef,
    keywords,
    setActiveIndex,
  });

  const rootClass = ["landing-v2-hero-headline", "landing-v2-hero-headline--studio-for", className]
    .filter(Boolean)
    .join(" ");

  return (
    <h1
      id={id}
      className={rootClass}
      data-hero-headline
      data-hero-keyword-headline
    >
      <span
        className="landing-v2-hero__headline-line landing-v2-hero__headline-line--lead"
        data-hero-headline-line
      >
        {copy.primaryHeadlineLead}
      </span>

      <span
        className={`landing-v2-hero__headline-line landing-v2-hero__headline-line--keyword${
          isLongKeyword ? " landing-v2-hero__headline-line--keyword-long" : ""
        }`}
        data-hero-headline-line
        data-hero-keyword-line
      >
        <span className="landing-v2-hero-keyword-slot" aria-live="polite" aria-atomic="true">
          <span className="landing-v2-hero-keyword-slot__measure" aria-hidden>
            {longestKeyword}
          </span>
          <span
            ref={keywordRef}
            className={`landing-v2-hero-keyword landing-v2-hero-keyword-slot__word${
              isLongKeyword ? " is-long" : ""
            }`}
            data-hero-rotating-keyword
          >
            {activeKeyword}
          </span>
        </span>
        <span className="sr-only">
          {copy.primaryHeadlineLead} {activeKeyword}.
        </span>
      </span>
    </h1>
  );
}

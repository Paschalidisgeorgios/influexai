"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { HERO_ROTATE_COPY } from "@/lib/landing-v2-motion";
import { useReducedMotion } from "../hooks/useReducedMotion";

const headlines = LANDING_V2_COPY.hero.rotatingHeadlines;

type LandingV2RotatingHeadlineProps = {
  id?: string;
  className?: string;
};

function renderLine(line: string, highlight: string) {
  const index = line.indexOf(highlight);
  if (index === -1) {
    return line;
  }

  return (
    <>
      {line.slice(0, index)}
      <span className="landing-v2-hero-rotate__keyword">{highlight}</span>
      {line.slice(index + highlight.length)}
    </>
  );
}

export function LandingV2RotatingHeadline({
  id = "lv2-hero-heading",
  className = "",
}: LandingV2RotatingHeadlineProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const cycleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimatingRef = useRef(false);
  const hasEnteredRef = useRef(false);

  const active = headlines[activeIndex] ?? headlines[0];

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const keyword = body.querySelector<HTMLElement>(".landing-v2-hero-rotate__keyword");

    if (!hasEnteredRef.current) {
      hasEnteredRef.current = true;

      if (reduceMotion) {
        gsap.set(body, { opacity: 1, y: 0 });
        if (keyword) gsap.set(keyword, { opacity: 1 });
        return;
      }

      gsap.fromTo(
        body,
        { y: HERO_ROTATE_COPY.enter.y, opacity: HERO_ROTATE_COPY.enter.opacity },
        {
          y: 0,
          opacity: 1,
          duration: HERO_ROTATE_COPY.enter.duration,
          ease: HERO_ROTATE_COPY.enter.ease,
          onComplete: () => {
            gsap.set(body, { clearProps: "transform" });
          },
        }
      );

      if (keyword) {
        gsap.fromTo(
          keyword,
          { opacity: HERO_ROTATE_COPY.keyword.fromOpacity },
          {
            opacity: HERO_ROTATE_COPY.keyword.toOpacity,
            duration: HERO_ROTATE_COPY.keyword.duration,
            ease: HERO_ROTATE_COPY.keyword.ease,
          }
        );
      }
      return;
    }

    if (reduceMotion) {
      gsap.set(body, { opacity: 1, y: 0, clearProps: "transform" });
      if (keyword) gsap.set(keyword, { opacity: 1 });
      return;
    }

    gsap.set(body, { y: HERO_ROTATE_COPY.enter.y, opacity: HERO_ROTATE_COPY.enter.opacity });

    gsap.to(body, {
      y: 0,
      opacity: 1,
      duration: HERO_ROTATE_COPY.enter.duration,
      ease: HERO_ROTATE_COPY.enter.ease,
      onComplete: () => {
        gsap.set(body, { clearProps: "transform" });
      },
    });

    if (keyword) {
      gsap.fromTo(
        keyword,
        { opacity: HERO_ROTATE_COPY.keyword.fromOpacity },
        {
          opacity: HERO_ROTATE_COPY.keyword.toOpacity,
          duration: HERO_ROTATE_COPY.keyword.duration,
          ease: HERO_ROTATE_COPY.keyword.ease,
        }
      );
    }
  }, [activeIndex, reduceMotion]);

  useEffect(() => {
    if (headlines.length <= 1) return;

    const scheduleNext = () => {
      cycleTimeoutRef.current = setTimeout(
        () => {
          const body = bodyRef.current;
          if (!body || isAnimatingRef.current) {
            scheduleNext();
            return;
          }

          if (reduceMotion) {
            setActiveIndex((current) => (current + 1) % headlines.length);
            scheduleNext();
            return;
          }

          isAnimatingRef.current = true;

          gsap.to(body, {
            y: HERO_ROTATE_COPY.exit.y,
            opacity: HERO_ROTATE_COPY.exit.opacity,
            duration: HERO_ROTATE_COPY.exit.duration,
            ease: HERO_ROTATE_COPY.exit.ease,
            onComplete: () => {
              setActiveIndex((current) => (current + 1) % headlines.length);
              isAnimatingRef.current = false;
              scheduleNext();
            },
          });
        },
        reduceMotion ? HERO_ROTATE_COPY.intervalReducedMs : HERO_ROTATE_COPY.intervalMs
      );
    };

    scheduleNext();

    return () => {
      if (cycleTimeoutRef.current) {
        clearTimeout(cycleTimeoutRef.current);
      }
    };
  }, [reduceMotion]);

  return (
    <h1
      id={id}
      className={`landing-v2-headline landing-v2-hero-display landing-v2-hero__headline landing-v2-hero-rotate ${className}`.trim()}
      data-hero-headline
      data-hero-headline-rotating
      aria-live="polite"
      aria-atomic="true"
    >
      <div ref={bodyRef} className="landing-v2-hero-rotate__body">
        {active.lines.map((line) => (
          <span key={`${active.id}-${line}`} className="landing-v2-hero-rotate__line">
            {renderLine(line, active.highlight)}
          </span>
        ))}
      </div>
    </h1>
  );
}

"use client";

import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import gsap from "gsap";
import { HERO_KEYWORD_ROTATE } from "@/lib/landing-v2-motion";
import { useReducedMotion } from "./useReducedMotion";

type UseHeroKeywordRotateOptions = {
  keywordRef: RefObject<HTMLElement | null>;
  keywords: readonly string[];
  setActiveIndex: Dispatch<SetStateAction<number>>;
  enabled?: boolean;
};

function nextIntervalMs(reduceMotion: boolean) {
  const preset = HERO_KEYWORD_ROTATE;
  if (reduceMotion) return preset.intervalReducedMs;
  return (
    preset.intervalMinMs +
    Math.floor(Math.random() * (preset.intervalMaxMs - preset.intervalMinMs))
  );
}

/** Rotate a single lime keyword inside the preview hero headline */
export function useHeroKeywordRotate({
  keywordRef,
  keywords,
  setActiveIndex,
  enabled = true,
}: UseHeroKeywordRotateOptions) {
  const reduceMotion = useReducedMotion();
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    indexRef.current = 0;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (!enabled || keywords.length <= 1) return clearTimer;

    const keyword = keywordRef.current;
    if (!keyword) return clearTimer;

    if (reduceMotion) {
      gsap.set(keyword, { clearProps: "transform,filter,opacity" });
      return clearTimer;
    }

    const runCycle = () => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        void (async () => {
          const el = keywordRef.current;
          if (!el) {
            runCycle();
            return;
          }

          if (isAnimatingRef.current) {
            runCycle();
            return;
          }

          isAnimatingRef.current = true;

          const { exit, enter } = HERO_KEYWORD_ROTATE;
          const nextIndex = (indexRef.current + 1) % keywords.length;

          await gsap.to(el, {
            y: exit.y,
            opacity: exit.opacity,
            duration: exit.duration,
            ease: exit.ease,
          });

          indexRef.current = nextIndex;
          setActiveIndex(nextIndex);

          gsap.set(el, { y: enter.y, opacity: enter.opacity });

          await gsap.to(el, {
            y: 0,
            opacity: 1,
            duration: enter.duration,
            ease: enter.ease,
            onComplete: () => {
              gsap.set(el, { clearProps: "transform" });
            },
          });

          isAnimatingRef.current = false;
          runCycle();
        })();
      }, nextIntervalMs(reduceMotion));
    };

    timerRef.current = setTimeout(runCycle, HERO_KEYWORD_ROTATE.entranceDelayMs);

    return () => {
      clearTimer();
      if (keywordRef.current) gsap.killTweensOf(keywordRef.current);
      isAnimatingRef.current = false;
    };
  }, [enabled, keywordRef, keywords, reduceMotion, setActiveIndex]);
}

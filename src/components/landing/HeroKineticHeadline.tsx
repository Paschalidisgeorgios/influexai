"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LANDING_HERO_2026 } from "@/lib/landing-copy-2026";
import { LANDING_NEON } from "@/lib/landing-neon-theme";

const ROTATING_WORDS = LANDING_HERO_2026.headlineRotating;
const ROTATE_INTERVAL_MS = 3000;
const LONGEST_WORD = "Content-Workflows";

const headlineClass =
  "mb-4 text-balance font-sans text-[clamp(1.65rem,5.5vw,3.75rem)] font-extrabold leading-[1.12] tracking-tight antialiased [text-shadow:0_2px_24px_rgba(0,0,0,0.85),0_1px_3px_rgba(0,0,0,0.9)] md:mb-5";

const wordMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export function HeroKineticHeadline() {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion || ROTATING_WORDS.length <= 1) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, ROTATE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const currentWord = ROTATING_WORDS[index] ?? ROTATING_WORDS[0];

  return (
    <>
      <h1 className={headlineClass}>
        <span className="inline-flex flex-col items-center md:flex-row md:items-baseline md:gap-x-[0.28em]">
          <span className="whitespace-nowrap text-white">
            {LANDING_HERO_2026.headlineStatic}
          </span>
          <span
            className="relative mt-0.5 inline-block h-[1.15em] md:mt-0"
            aria-live="polite"
            aria-atomic="true"
          >
            <span
              aria-hidden
              className="invisible block whitespace-nowrap select-none"
              style={{ color: "transparent" }}
            >
              {LONGEST_WORD}
            </span>
            {reducedMotion ? (
              <span
                className="absolute left-0 top-0 whitespace-nowrap"
                style={{ color: LANDING_NEON.green }}
              >
                {currentWord}
              </span>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={currentWord}
                  className="absolute left-0 top-0 whitespace-nowrap"
                  style={{ color: LANDING_NEON.green }}
                  initial={wordMotion.initial}
                  animate={wordMotion.animate}
                  exit={wordMotion.exit}
                  transition={wordMotion.transition}
                >
                  {currentWord}
                </motion.span>
              </AnimatePresence>
            )}
          </span>
        </span>
      </h1>
      <p
        className="mx-auto mb-6 max-w-xl text-balance text-base leading-relaxed text-white/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] md:mx-0 md:text-lg"
        style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
      >
        {LANDING_HERO_2026.subheadline}
      </p>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HERO_KINETIC_WORDS,
  LANDING_HERO_2026,
} from "@/lib/landing-copy-2026";

const ROTATE_MS = 2500;

/** Longest rotating phrase — reserves space to prevent CLS during word swaps. */
const KINETIC_SPACER = "FOTOREALISTISCHE VISUALS.";

export function HeroKineticHeadline() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setWordIndex((i) => (i + 1) % HERO_KINETIC_WORDS.length);
    }, ROTATE_MS);

    return () => window.clearInterval(id);
  }, []);

  const activeWord = HERO_KINETIC_WORDS[wordIndex];

  return (
    <h1 className="mb-6 font-sans text-3xl font-extrabold uppercase tracking-tight text-white antialiased sm:text-4xl md:mb-8 md:text-5xl lg:text-6xl">
      <span className="block text-white">{LANDING_HERO_2026.headline.staticPrefix}</span>
      <span className="relative mt-1 block min-h-[1.2em] w-full max-w-full">
        <span className="invisible block whitespace-nowrap" aria-hidden>
          {KINETIC_SPACER}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={activeWord}
            className="absolute inset-x-0 top-0 block whitespace-nowrap text-[#ccff00] drop-shadow-[0_0_12px_rgba(204,255,0,0.35)]"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {activeWord}
          </motion.span>
        </AnimatePresence>
      </span>
    </h1>
  );
}

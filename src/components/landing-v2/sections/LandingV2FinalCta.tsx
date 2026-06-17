"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingV2Links } from "../LandingV2ModeContext";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";

const copy = LANDING_V2_COPY.finalCta;

export function LandingV2FinalCta() {
  const sectionRef = useRef<HTMLElement>(null);
  const links = useLandingV2Links();
  useSectionDramaturgy(sectionRef);

  return (
    <section
      id="final-cta"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--final-cta pb-24 pt-8"
    >
      <div className="landing-v2-final-cta mx-auto max-w-4xl px-6 py-12 text-center md:px-12 md:py-14">
        <p className="landing-v2-kicker mb-4 justify-center" data-lv2-eyebrow>
          <span className="landing-v2-kicker__dot" aria-hidden />
          Creator Operating System
        </p>
        <h2
          className="landing-v2-headline landing-v2-final-cta__title text-[var(--lv2-text-light)]"
          data-lv2-headline-line
        >
          {copy.headline}
        </h2>
        <p className="landing-v2-final-cta__subline mx-auto mt-4 max-w-lg" data-lv2-subline>
          {copy.subline}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={links.signup} className="landing-v2-btn-primary" data-lv2-stagger>
            {copy.ctaPrimary}
            <ArrowRight size={18} aria-hidden />
          </Link>
          <Link href={links.pricing} className="landing-v2-btn-secondary" data-lv2-stagger>
            {copy.ctaSecondary}
          </Link>
        </div>
      </div>
    </section>
  );
}

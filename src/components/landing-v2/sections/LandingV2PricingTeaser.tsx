"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingReveal } from "../hooks/useLandingReveal";

const copy = LANDING_V2_COPY.pricing;

export function LandingV2PricingTeaser() {
  const sectionRef = useRef<HTMLElement>(null);
  useLandingReveal(sectionRef);

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="landing-v2-section"
      aria-labelledby="lv2-pricing-heading"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="landing-v2-kicker mb-3 justify-center" data-lv2-reveal>
          <span className="landing-v2-kicker__dot" aria-hidden />
          {copy.eyebrow}
        </p>
        <h2
          id="lv2-pricing-heading"
          className="landing-v2-headline text-[clamp(2rem,4.5vw,3rem)] text-[var(--lv2-text-light)]"
          data-lv2-reveal
        >
          {copy.headline}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/58" data-lv2-reveal>
          {copy.subline}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3" data-lv2-reveal>
          <Link href="/pricing" className="landing-v2-btn-primary">
            {copy.cta}
            <ArrowRight size={18} aria-hidden />
          </Link>
          <Link href="/auth/sign-up" className="landing-v2-btn-secondary">
            {copy.ctaSecondary}
          </Link>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { useLandingReveal } from "../hooks/useLandingReveal";

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
          Preise & Credits
        </p>
        <h2
          id="lv2-pricing-heading"
          className="landing-v2-headline text-[clamp(2rem,4.5vw,3rem)] text-[var(--lv2-text-light)]"
          data-lv2-reveal
        >
          Pläne für regelmäßige Produktion
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/58" data-lv2-reveal>
          Wähle den Plan, der zu deinem Produktionsvolumen passt.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3" data-lv2-reveal>
          <Link href="/pricing" className="landing-v2-btn-primary">
            Preise ansehen
            <ArrowRight size={18} aria-hidden />
          </Link>
          <Link href="/auth/sign-up" className="landing-v2-btn-secondary">
            Studio starten
          </Link>
        </div>
      </div>
    </section>
  );
}

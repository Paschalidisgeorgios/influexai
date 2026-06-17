"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LANDING_V2_PRICING_PREVIEW_HREF } from "@/lib/landing-v2-pricing-copy";
import { useSectionDramaturgy } from "../hooks/useSectionDramaturgy";

const copy = LANDING_V2_COPY.pricing;

export function LandingV2PricingTeaser() {
  const sectionRef = useRef<HTMLElement>(null);
  useSectionDramaturgy(sectionRef);

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="landing-v2-section landing-v2-section--editorial landing-v2-section--pricing"
      aria-labelledby="lv2-pricing-heading"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="landing-v2-kicker mb-4 justify-center" data-lv2-eyebrow>
          <span className="landing-v2-kicker__dot" aria-hidden />
          {copy.eyebrow}
        </p>
        <h2
          id="lv2-pricing-heading"
          className="landing-v2-headline text-[clamp(1.75rem,4vw,2.75rem)] text-[var(--lv2-text-light)]"
          data-lv2-headline-line
        >
          {copy.headline}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-white/55" data-lv2-subline>
          {copy.subline}
        </p>
        <div className="mt-8">
          <Link href={LANDING_V2_PRICING_PREVIEW_HREF} className="landing-v2-btn-primary">
            {copy.cta}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

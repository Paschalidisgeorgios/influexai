"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { useLandingReveal } from "../hooks/useLandingReveal";

const copy = LANDING_V2_COPY.finalCta;

export function LandingV2FinalCta() {
  const sectionRef = useRef<HTMLElement>(null);
  useLandingReveal(sectionRef);

  return (
    <section ref={sectionRef} className="landing-v2-section pb-24 pt-8">
      <div
        className="landing-v2-ivory-stage mx-auto max-w-4xl px-8 py-14 text-center md:px-14 md:py-16"
        data-lv2-reveal
      >
        <h2 className="landing-v2-headline text-[clamp(2rem,4vw,3rem)]">
          {copy.headline}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-[var(--lv2-text-muted)]">
          {copy.subline}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/auth/sign-up" className="landing-v2-btn-primary">
            {copy.ctaPrimary}
            <ArrowRight size={18} aria-hidden />
          </Link>
          <Link
            href="/pricing"
            className="landing-v2-btn-secondary !border-[rgba(8,8,8,0.14)] !bg-transparent !text-[var(--lv2-text-dark)] hover:!bg-[rgba(8,8,8,0.04)]"
          >
            {copy.ctaSecondary}
          </Link>
        </div>
      </div>
    </section>
  );
}

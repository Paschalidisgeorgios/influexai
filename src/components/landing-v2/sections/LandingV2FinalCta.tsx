"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { useLandingReveal } from "../hooks/useLandingReveal";

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
          Starte dein Creator Studio.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-[var(--lv2-text-muted)]">
          Produziere schneller, klarer und kontrollierter — ohne Tool-Chaos.
        </p>
        <Link href="/auth/sign-up" className="landing-v2-btn-primary mt-8">
          Studio starten
          <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  );
}

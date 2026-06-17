"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LANDING_V2_COPY } from "@/lib/landing-v2-copy";
import { LANDING_V2_PRICING_PREVIEW_HREF } from "@/lib/landing-v2-pricing-copy";

const copy = LANDING_V2_COPY.nav;

export function LandingV2Nav() {
  return (
    <header className="landing-v2-nav">
      <div className="landing-v2-nav__inner">
        <Link href="/" className="text-sm font-semibold tracking-tight text-[var(--lv2-text-light)]">
          InfluexAI
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
          <a href="#story" className="transition-colors hover:text-white">
            {copy.workflow}
          </a>
          <a href="#paths" className="transition-colors hover:text-white">
            {copy.paths}
          </a>
          <a href="#studio" className="transition-colors hover:text-white">
            {copy.studio}
          </a>
          <Link href={LANDING_V2_PRICING_PREVIEW_HREF} className="transition-colors hover:text-white">
            {copy.pricing}
          </Link>
        </nav>
        <Link href="/auth/sign-up" className="landing-v2-btn-primary !px-4 !py-2 text-sm">
          {copy.cta}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </header>
  );
}

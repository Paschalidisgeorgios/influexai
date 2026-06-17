"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingV2Nav() {
  return (
    <header className="landing-v2-nav">
      <div className="landing-v2-nav__inner">
        <Link href="/" className="text-sm font-semibold tracking-tight text-[var(--lv2-text-light)]">
          InfluexAI
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
          <a href="#story" className="transition-colors hover:text-white">
            Workflow
          </a>
          <a href="#paths" className="transition-colors hover:text-white">
            Produktionspfade
          </a>
          <a href="#studio" className="transition-colors hover:text-white">
            Studio
          </a>
          <a href="#pricing" className="transition-colors hover:text-white">
            Preise
          </a>
        </nav>
        <Link href="/auth/sign-up" className="landing-v2-btn-primary !px-4 !py-2 text-sm">
          Studio starten
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </header>
  );
}

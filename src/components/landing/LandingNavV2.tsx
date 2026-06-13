"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IntentLink } from "@/hooks/useIntentTracking";

const NAV_LINKS = [
  { label: "Features", href: "#bento-features" },
  { label: "Workflows", href: "#landing-media" },
  { label: "Für Brands", href: "/business" },
  { label: "Preise", href: "#pricing" },
] as const;

export function LandingNavV2() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`landing-glass-header fixed inset-x-0 top-0 z-40 flex h-14 w-full items-center px-4 transition-[background,border-color] duration-300 sm:px-6 lg:px-10 ${
        scrolled ? "landing-glass-header--scrolled" : ""
      }`}
    >
      <Link
        href="/"
        className="shrink-0 font-[family-name:var(--font-bebas)] text-lg tracking-wide text-white no-underline"
      >
        INFLUEX
        <span className="text-[#ccff00]">AI</span>
      </Link>

      <nav className="mx-auto hidden items-center gap-7 md:flex" aria-label="Hauptnavigation">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="landing-glass-nav-link">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Link href="/auth/sign-in" className="landing-glass-nav-link px-2 py-2">
          Login
        </Link>
        <IntentLink href="/signup" className="landing-glass-btn-cta !px-4 !py-2 text-[13px]">
          Studio starten
        </IntentLink>
      </div>
    </header>
  );
}

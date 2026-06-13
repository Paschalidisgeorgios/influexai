"use client";

import Link from "next/link";
import { IntentLink } from "@/hooks/useIntentTracking";

const NAV_LINKS = [
  { label: "Features", href: "#studio-showcase" },
  { label: "KI-Influencer", href: "/dashboard/ki-influencer" },
  { label: "Für Brands", href: "/business" },
  { label: "Preise", href: "#pricing" },
] as const;

export function LandingNavV2() {
  return (
    <header
      className="sticky top-0 z-40 flex h-14 w-full items-center border-b px-4 backdrop-blur-xl sm:px-6 lg:px-10"
      style={{
        background: "rgba(8,8,10,0.85)",
        borderColor: "rgba(255,255,255,0.06)",
        borderBottomWidth: "0.5px",
      }}
    >
      <Link
        href="/"
        className="shrink-0 font-display text-lg font-semibold tracking-tight text-white no-underline"
      >
        INFLUEX
        <span style={{ color: "#B4FF00" }}>AI</span>
      </Link>

      <nav className="mx-auto hidden items-center gap-6 md:flex" aria-label="Hauptnavigation">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[13px] text-white/40 no-underline transition-colors duration-300 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Link
          href="/login"
          className="rounded-lg px-3 py-2 text-[13px] font-medium text-white/60 no-underline transition-colors hover:text-white"
        >
          Login
        </Link>
        <IntentLink
          href="/signup"
          className="rounded-lg px-4 py-2 text-[13px] font-semibold no-underline transition-all duration-300"
          style={{ background: "#B4FF00", color: "#08080a" }}
        >
          Studio starten
        </IntentLink>
      </div>
    </header>
  );
}

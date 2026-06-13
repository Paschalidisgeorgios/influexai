"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IntentLink } from "@/hooks/useIntentTracking";

const NAV_LINKS = [
  { label: "Features", href: "#studio-showcase" },
  { label: "KI-Influencer", href: "/dashboard/ki-influencer" },
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
      className="fixed inset-x-0 top-0 z-40 flex h-14 w-full items-center px-4 transition-[background,border-color,backdrop-filter] duration-300 sm:px-6 lg:px-10"
      style={{
        background: scrolled ? "rgba(8,8,10,0.5)" : "rgba(8,8,10,0.06)",
        backdropFilter: scrolled ? "blur(14px)" : "blur(6px)",
        WebkitBackdropFilter: scrolled ? "blur(14px)" : "blur(6px)",
        borderBottom: scrolled
          ? "0.5px solid rgba(255,255,255,0.07)"
          : "0.5px solid rgba(255,255,255,0.04)",
      }}
    >
      <Link
        href="/"
        className="shrink-0 font-display text-lg font-semibold tracking-tight text-white no-underline drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]"
      >
        INFLUEX
        <span style={{ color: "#B4FF00" }}>AI</span>
      </Link>

      <nav className="mx-auto hidden items-center gap-6 md:flex" aria-label="Hauptnavigation">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[13px] text-white/55 no-underline drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)] transition-colors duration-300 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Link
          href="/login"
          className="rounded-lg px-3 py-2 text-[13px] font-medium text-white/70 no-underline drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)] transition-colors hover:text-white"
        >
          Login
        </Link>
        <IntentLink
          href="/signup"
          className="rounded-lg px-4 py-2 text-[13px] font-semibold no-underline transition-all duration-300"
          style={{
            background: "#B4FF00",
            color: "#08080a",
            boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
          }}
        >
          Studio starten
        </IntentLink>
      </div>
    </header>
  );
}

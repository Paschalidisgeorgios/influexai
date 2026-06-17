"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const NAV_LINKS = [
  { label: "Studio", href: "#product-story" },
  { label: "Workflows", href: "#product-story" },
  { label: "Preise", href: "#pricing" },
  { label: "Für Brands", href: "/business" },
] as const;

/** Terminal-style fixed nav — homepage only (agency/business use LandingNav.tsx). */
export default function HomeLandingNav() {
  const navRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const nav = navRef.current;
      if (!nav) return;

      ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          const scrolled = self.scroll() > 48;
          gsap.to(nav, {
            paddingTop: scrolled ? 10 : 16,
            paddingBottom: scrolled ? 10 : 16,
            backgroundColor: scrolled
              ? "rgba(9, 9, 11, 0.95)"
              : "rgba(9, 9, 11, 0.8)",
            duration: 0.25,
            ease: "power2.out",
            overwrite: true,
          });
        },
      });
    },
    { scope: navRef }
  );

  return (
    <header
      ref={navRef}
      className="fixed top-0 z-50 w-full border-b border-white/[0.05] px-6 backdrop-blur-xl md:px-12"
      style={{
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: "rgba(9, 9, 11, 0.8)",
      }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between">
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-tight text-white md:text-base"
        >
          INFLUEX<span className="text-[#b4ff00]">AI</span>
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Hauptnavigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[13px] text-white/40 transition-colors hover:text-white/80"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/auth/sign-up"
          className="rounded-md bg-[#b4ff00] px-5 py-2 text-[13px] font-semibold text-[#09090b] transition-transform hover:-translate-y-px"
        >
          Starten →
        </Link>
      </div>
    </header>
  );
}

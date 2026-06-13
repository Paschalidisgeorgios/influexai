"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { IntentLink } from "@/hooks/useIntentTracking";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NAV_LABELS_DE } from "@/lib/features-menu-i18n";
import {
  FeaturesMegaMenuDesktop,
  FeaturesMegaMenuMobile,
} from "@/components/landing/features/FeaturesMegaMenu";

const NAV_LINKS = [
  { label: NAV_LABELS_DE.workflows, href: "#landing-media" },
  { label: NAV_LABELS_DE.brands, href: "/business" },
  { label: NAV_LABELS_DE.agency, href: "/agency" },
  { label: NAV_LABELS_DE.pricing, href: "#pricing" },
] as const;

export function LandingNavV2() {
  const [scrolled, setScrolled] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeFeatures = useCallback(() => setFeaturesOpen(false), []);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setFeaturesOpen(false);
  }, []);

  const toggleFeatures = useCallback(() => {
    setFeaturesOpen((v) => !v);
    setMenuOpen(false);
  }, []);

  return (
    <>
      <header
        className={`landing-glass-header relative overflow-visible fixed inset-x-0 top-0 z-50 flex h-14 w-full items-center px-4 transition-[background,border-color] duration-300 sm:px-6 lg:px-10 ${
          scrolled || featuresOpen ? "landing-glass-header--scrolled" : ""
        }`}
        style={{ ["--landing-nav-height" as string]: "3.5rem" }}
      >
        <Link
          href="/"
          className="shrink-0 font-[family-name:var(--font-bebas)] text-lg tracking-wide text-white no-underline"
          onClick={closeMenu}
        >
          INFLUEX
          <span className="text-[#ccff00]">AI</span>
        </Link>

        <nav
          className="mx-auto hidden items-center gap-6 md:flex"
          aria-label="Hauptnavigation"
        >
          <button
            type="button"
            className={`landing-glass-nav-link inline-flex items-center gap-1 bg-transparent border-none cursor-pointer ${
              featuresOpen ? "text-[#ccff00]" : ""
            }`}
            aria-expanded={featuresOpen}
            aria-haspopup="dialog"
            onClick={toggleFeatures}
          >
            {NAV_LABELS_DE.features}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${featuresOpen ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </button>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="landing-glass-nav-link"
              onClick={closeFeatures}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <LanguageSwitcher compact glassAuth />
          </div>
          <Link
            href="/auth/sign-in"
            className="landing-glass-nav-link hidden px-2 py-2 sm:inline-flex"
          >
            {NAV_LABELS_DE.login}
          </Link>
          <IntentLink
            href="/signup"
            className="landing-glass-btn-cta !px-4 !py-2 text-[13px]"
          >
            {NAV_LABELS_DE.signup}
          </IntentLink>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800/60 text-white md:hidden"
            aria-label={menuOpen ? NAV_LABELS_DE.menuClose : NAV_LABELS_DE.menuOpen}
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((v) => !v);
              setFeaturesOpen(false);
            }}
          >
            {menuOpen ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="4" x2="14" y2="14" />
                <line x1="14" y1="4" x2="4" y2="14" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </svg>
            )}
          </button>
        </div>

        <FeaturesMegaMenuDesktop open={featuresOpen} onClose={closeFeatures} />
      </header>

      {menuOpen ? (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm border-none cursor-default"
            aria-label={NAV_LABELS_DE.menuClose}
            onClick={closeMenu}
          />
          <div
            className="absolute right-0 top-14 bottom-0 w-[min(100%,320px)] overflow-y-auto border-l border-zinc-800/60 bg-zinc-950/95 p-5 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4">
              <LanguageSwitcher compact glassAuth />
            </div>
            <FeaturesMegaMenuMobile onNavigate={closeMenu} />
            <div className="mt-6 space-y-1 border-t border-zinc-800/60 pt-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/5"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/auth/sign-in"
                className="block rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/5"
                onClick={closeMenu}
              >
                {NAV_LABELS_DE.login}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

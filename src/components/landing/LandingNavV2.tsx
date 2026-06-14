"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { NAV_LABELS_DE } from "@/lib/features-menu-i18n";
import { FeaturesMobileMenuOverlay } from "@/components/landing/features/FeaturesMobileMenuOverlay";

const NAV_LINKS = [
  { label: NAV_LABELS_DE.workflows, href: "#landing-media" },
  { label: NAV_LABELS_DE.brands, href: "/business" },
  { label: NAV_LABELS_DE.agency, href: "/agency" },
  { label: NAV_LABELS_DE.pricing, href: "#pricing" },
] as const;

export function LandingNavV2() {
  const tNav = useTranslations("landingPage.nav");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  return (
    <>
      <header
        className={`landing-glass-header sticky top-0 z-50 flex h-14 w-full items-center overflow-visible px-4 transition-[background,border-color] duration-300 sm:px-6 lg:px-10 ${
          scrolled ? "landing-glass-header--scrolled" : ""
        }`}
        style={{ ["--landing-nav-height" as string]: "3.5rem" }}
      >
        <BrandWordmark href="/" onClick={closeMenu} />

        <nav
          className="relative mx-auto hidden items-center justify-center gap-6 md:flex"
          aria-label="Hauptnavigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="landing-glass-nav-link"
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
            className="landing-glass-btn-cta !px-4 !py-2 text-[13px]"
          >
            {tNav("ctaAuth")}
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800/60 text-white md:hidden"
            aria-label={menuOpen ? NAV_LABELS_DE.menuClose : NAV_LABELS_DE.menuOpen}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
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
      </header>

      <FeaturesMobileMenuOverlay
        open={menuOpen}
        onClose={closeMenu}
        navLinks={NAV_LINKS}
      />
    </>
  );
}

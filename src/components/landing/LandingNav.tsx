"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";

const NAV_LINKS = [
  { key: "nav_brands" as const, href: "#brands" },
  { key: "nav_features" as const, href: "#features" },
  { key: "nav_blog" as const, href: "/blog", external: true },
  { key: "nav_guides" as const, href: "/guides", external: true },
  { key: "nav_community" as const, href: "/community", external: true },
  { key: "nav_pricing" as const, href: "#pricing" },
  { key: "nav_agency" as const, href: "/agency", external: true },
];

const LANDING_NAV_LINK =
  "nav-item relative inline-flex text-sm font-medium text-[#1a1a1a] px-3.5 py-1.5 rounded-lg transition-colors duration-150 hover:text-[#060608]";

export function LandingNav({ agencyMode = false }: { agencyMode?: boolean }) {
  const t = useTranslations("landing");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full max-w-[100vw] landing-nav-shell${scrolled ? " landing-nav-shell--scrolled" : ""}`}
      >
        <nav
          className={`landing-nav-bar${scrolled ? " landing-nav-bar--scrolled" : ""}`}
          aria-label="Hauptnavigation"
        >
          <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#B4FF00] flex items-center justify-center font-[family-name:var(--font-bebas)] text-lg text-[#060608] leading-none shrink-0">
              I
            </div>
            <span className="font-[family-name:var(--font-bebas)] text-xl tracking-[0.04em] text-[#060608] truncate">
              Influex<span className="text-[#5a7300]">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-0 min-w-0 flex-1 justify-center">
            {agencyMode ? (
              <>
                <Link href="/" className={LANDING_NAV_LINK}>
                  {t("nav_home")}
                </Link>
                <a href="#agency-pricing" className={LANDING_NAV_LINK}>
                  {t("nav_pricing")}
                </a>
              </>
            ) : (
              NAV_LINKS.map((l) =>
                l.external ? (
                  <Link key={l.href} href={l.href} className={LANDING_NAV_LINK}>
                    {t(l.key)}
                  </Link>
                ) : (
                  <a key={l.href} href={l.href} className={LANDING_NAV_LINK}>
                    {t(l.key)}
                  </a>
                )
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <LanguageSwitcher compact lightToolbar buttonClassName="landing-nav-lang-btn" />
            <a
              href="/auth/sign-in"
              className="landing-nav-auth-link text-sm font-medium px-3 py-2 transition-colors duration-150"
            >
              {t("auth_login")}
            </a>
            <AcidMotionButton
              href="/auth/sign-up"
              className="btn-acid"
              style={{ padding: "9px 18px", fontSize: "0.85rem" }}
            >
              {t("auth_signup")}
            </AcidMotionButton>
          </div>

          <div className="flex md:hidden items-center gap-2 shrink-0">
            <AcidMotionButton
              href="/auth/sign-up"
              className="btn-acid !px-3 !py-2 text-[0.75rem] whitespace-nowrap"
            >
              {t("auth_signup")}
            </AcidMotionButton>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="landing-nav-menu-btn w-9 h-9 flex items-center justify-center rounded-lg transition-all shrink-0"
              aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </svg>
              ) : (
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <line x1="3" y1="6" x2="19" y2="6" />
                  <line x1="3" y1="12" x2="19" y2="12" />
                  <line x1="3" y1="18" x2="19" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </header>

      <div
        className={`mobile-nav-overlay ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Menü schließen"
          onClick={closeMenu}
          tabIndex={menuOpen ? 0 : -1}
        />
        <div className="mobile-nav-drawer" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between mb-6">
            <span className="font-[family-name:var(--font-bebas)] text-xl tracking-[0.04em] text-[#F0EFE8]">
              Menü
            </span>
            <button
              type="button"
              onClick={closeMenu}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-[#F0EFE8] border border-white/10"
              aria-label="Schließen"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="4" x2="14" y2="14" />
                <line x1="14" y1="4" x2="4" y2="14" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-0 mb-6 px-0">
            {agencyMode ? (
              <>
                <Link href="/" onClick={closeMenu} className="mobile-nav-link">
                  {t("nav_home")}
                  <span className="text-xl">↗</span>
                </Link>
                <a href="#agency-pricing" onClick={closeMenu} className="mobile-nav-link">
                  {t("nav_pricing")}
                  <span className="text-xl">↗</span>
                </a>
              </>
            ) : (
              NAV_LINKS.map((l) =>
                l.external ? (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={closeMenu}
                    className="mobile-nav-link"
                  >
                    {t(l.key)}
                    <span className="text-xl">↗</span>
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={closeMenu}
                    className="mobile-nav-link"
                  >
                    {t(l.key)}
                    <span className="text-xl">↗</span>
                  </a>
                )
              )
            )}
          </div>

          <div className="mb-6 pt-4 border-t border-white/10">
            <LanguageSwitcher />
          </div>

          <div className="flex flex-col gap-3">
            <a
              href="/auth/sign-in"
              onClick={closeMenu}
              className="btn-ghost justify-center"
            >
              {t("auth_login")}
            </a>
            <AcidMotionButton
              href="/auth/sign-up"
              onClick={closeMenu}
              className="btn-acid justify-center"
            >
              {t("auth_signup")} →
            </AcidMotionButton>
          </div>
        </div>
      </div>
    </>
  );
}

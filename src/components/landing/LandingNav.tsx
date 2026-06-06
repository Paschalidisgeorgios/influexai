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

export function LandingNav({ agencyMode = false }: { agencyMode?: boolean }) {
  const t = useTranslations("landing");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
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
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? "bg-[#060608]/90 backdrop-blur-xl border-b border-white/[0.07] py-3 px-[clamp(16px,5vw,40px)]"
            : "py-[18px] px-[clamp(16px,5vw,40px)]"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-[#B4FF00] flex items-center justify-center font-[family-name:var(--font-bebas)] text-lg text-[#060608] leading-none">
            I
          </div>
          <span className="font-[family-name:var(--font-bebas)] text-xl tracking-[0.04em] text-white">
            Influex<span className="text-[#B4FF00]">AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0">
          {agencyMode ? (
            <>
              <Link href="/" className="nav-item">
                {t("nav_home")}
              </Link>
              <a href="#agency-pricing" className="nav-item">
                {t("nav_pricing")}
              </a>
            </>
          ) : (
            NAV_LINKS.map((l) =>
              l.external ? (
                <Link key={l.href} href={l.href} className="nav-item">
                  {t(l.key)}
                </Link>
              ) : (
                <a key={l.href} href={l.href} className="nav-item">
                  {t(l.key)}
                </a>
              )
            )
          )}
        </div>

        <div className="hidden md:flex items-center gap-2.5">
          <LanguageSwitcher compact />
          <a
            href="/auth/sign-in"
            className="text-sm font-medium px-3 py-2 transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.85)" }}
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

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.05] transition-all"
          style={{ color: "rgba(255,255,255,0.85)" }}
          aria-label="Menü öffnen"
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
      </nav>

      <div className={`mobile-nav-overlay ${menuOpen ? "open" : ""}`}>
        <div className="flex flex-col gap-0 mb-8">
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
        <div className="mb-4">
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
    </>
  );
}

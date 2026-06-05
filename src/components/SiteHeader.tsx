"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";

const NAV_LINKS = [
  { key: "nav_brands" as const, href: "#brands" },
  { key: "nav_features" as const, href: "#features" },
  { key: "nav_pricing" as const, href: "#pricing" },
  { key: "nav_agency" as const, href: "/agency", external: true },
] as const;

export function SiteHeader() {
  const t = useTranslations("landing");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setScrolled(y > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={["site-header", scrolled ? "site-header--scrolled" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="site-header__inner">
        <Link href="/" className="site-header__logo no-underline">
          INFLUEX<span className="text-[var(--accent,#B4FF00)]">AI</span>
        </Link>

        <nav className="site-nav" aria-label="Main">
          {NAV_LINKS.map((link) =>
            link.external ? (
              <Link key={link.href} href={link.href} className="site-nav__link">
                {t(link.key)}
              </Link>
            ) : (
              <a key={link.href} href={link.href} className="site-nav__link">
                {t(link.key)}
              </a>
            )
          )}
        </nav>

        <div className="site-header__actions">
          <Link href="/auth/sign-in" className="site-header__login">
            {t("auth_login")}
          </Link>
          <AcidMotionButton href="/auth/sign-up" className="btn-acid site-header__cta">
            {t("auth_signup")}
          </AcidMotionButton>
        </div>
      </div>
    </header>
  );
}

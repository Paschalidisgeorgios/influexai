"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { createClient } from "@/lib/supabase/client";
import { hasActivePlan, isPlatformAdmin } from "@/lib/access";

const NAV_LINKS = [
  { key: "nav_features" as const, href: "#value" },
  { key: "nav_for_brands" as const, href: "/business", external: true },
  { key: "nav_pricing" as const, href: "/pricing", external: true },
  { key: "nav_agency" as const, href: "/agency", external: true },
];

const LANDING_NAV_LINK =
  "nav-item relative inline-flex items-center whitespace-nowrap text-[0.875rem] font-medium leading-none text-[#1a1a1a] px-3 py-1.5 rounded-lg transition-colors duration-150 hover:text-[#060608] hover:bg-black/[0.04]";

const HEADER_CLASS =
  "mobile-top-shell sticky top-0 z-50 w-full max-w-[100vw] overflow-x-clip landing-nav-shell bg-[#EFEFEA]/95 backdrop-blur-md";

export function LandingNav({ agencyMode = false }: { agencyMode?: boolean }) {
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navSession, setNavSession] = useState<{
    user: boolean;
    hasPlan: boolean;
    isAdmin: boolean;
  }>({ user: false, hasPlan: false, isAdmin: false });
  const supabase = createClient();

  const loadNavSession = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setNavSession({ user: false, hasPlan: false, isAdmin: false });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, role, is_admin")
      .eq("id", user.id)
      .single();

    const accessUser = {
      email: user.email,
      plan: profile?.plan,
      role: profile?.role,
      is_admin: profile?.is_admin,
    };

    setNavSession({
      user: true,
      hasPlan: hasActivePlan(accessUser),
      isAdmin: isPlatformAdmin(accessUser),
    });
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace("/");
  };

  useEffect(() => {
    setMounted(true);
    void loadNavSession();
  }, [loadNavSession]);

  useEffect(() => {
    if (!mounted) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.body.style.overflowX = "clip";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.overflowX = "";
    };
  }, [menuOpen, mounted]);

  const closeMenu = () => setMenuOpen(false);

  const showGuestAuth = mounted && !navSession.user;
  const showMemberNav = mounted && navSession.user && (navSession.hasPlan || navSession.isAdmin);
  const showNoPlanNav = mounted && navSession.user && !navSession.hasPlan && !navSession.isAdmin;

  const navBarClass = `landing-nav-bar landing-nav-bar--mobile !bg-[#EFEFEA]/95 !backdrop-blur-md${
    mounted && scrolled ? " landing-nav-bar--scrolled" : ""
  }`;

  return (
    <>
      <header className={HEADER_CLASS}>
        <nav className={navBarClass} aria-label="Hauptnavigation">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 no-underline">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#B4FF00] font-[family-name:var(--font-bebas)] text-lg leading-none text-[#060608]">
              I
            </div>
            <span className="landing-nav-logo-text truncate font-[family-name:var(--font-bebas)] text-xl tracking-[0.04em] text-[#060608]">
              Influex<span className="text-[#5a7300]">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 min-w-0 flex-1 justify-center">
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
            {showGuestAuth ? (
              <>
                <Link
                  href="/auth/sign-in"
                  className="landing-nav-auth-link text-sm font-medium px-3 py-2 transition-colors duration-150"
                >
                  {t("auth_login")}
                </Link>
                <AcidMotionButton
                  href="/auth/sign-up"
                  className="btn-acid"
                  style={{ padding: "9px 18px", fontSize: "0.85rem" }}
                >
                  {t("auth_signup")}
                </AcidMotionButton>
              </>
            ) : null}
            {showMemberNav ? (
              <>
                <Link
                  href="/dashboard"
                  className="landing-nav-auth-link text-sm font-medium px-3 py-2 transition-colors duration-150"
                >
                  Dashboard
                </Link>
                {navSession.isAdmin ? (
                  <Link
                    href="/admin"
                    className="landing-nav-auth-link text-sm font-medium px-3 py-2 transition-colors duration-150"
                  >
                    Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="landing-nav-auth-link text-sm font-medium px-3 py-2 transition-colors duration-150"
                >
                  {tNav("logout")}
                </button>
              </>
            ) : null}
            {showNoPlanNav ? (
              <>
                <Link
                  href="/pricing"
                  className="landing-nav-auth-link text-sm font-medium px-3 py-2 transition-colors duration-150"
                >
                  {t("nav_pricing")}
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="landing-nav-auth-link text-sm font-medium px-3 py-2 transition-colors duration-150"
                >
                  {tNav("settings_menu")}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="landing-nav-auth-link text-sm font-medium px-3 py-2 transition-colors duration-150"
                >
                  {tNav("logout")}
                </button>
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="landing-nav-menu-btn flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg transition-all"
              aria-label={menuOpen ? t("menu_close") : t("menu_open")}
              aria-expanded={menuOpen}
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={menuOpen ? "block" : "hidden"}
                aria-hidden={!menuOpen}
              >
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                className={menuOpen ? "hidden" : "block"}
                aria-hidden={menuOpen}
              >
                <line x1="3" y1="6" x2="19" y2="6" />
                <line x1="3" y1="12" x2="19" y2="12" />
                <line x1="3" y1="18" x2="19" y2="18" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {mounted && menuOpen ? (
        <div className="mobile-nav-overlay open" role="presentation">
          <button
            type="button"
            className="mobile-nav-backdrop"
            aria-label={t("menu_close")}
            onClick={closeMenu}
          />
          <div
            className="mobile-nav-drawer border-r border-[#B4FF00]/15 bg-[#0d0f0d]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-[family-name:var(--font-bebas)] text-xl tracking-[0.04em] text-[#F0EFE8]">
                {t("menu_title")}
              </span>
              <button
                type="button"
                onClick={closeMenu}
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#F0EFE8] border border-white/10"
                aria-label={t("menu_close")}
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
                  <Link
                    href="/"
                    onClick={closeMenu}
                    className="mobile-nav-link py-4 text-[20px] text-white/85"
                  >
                    {t("nav_home")}
                    <span className="text-xl">↗</span>
                  </Link>
                  <a
                    href="#agency-pricing"
                    onClick={closeMenu}
                    className="mobile-nav-link py-4 text-[20px] text-white/85"
                  >
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
                      className="mobile-nav-link py-4 text-[20px] text-white/85"
                    >
                      {t(l.key)}
                      <span className="text-xl">↗</span>
                    </Link>
                  ) : (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={closeMenu}
                      className="mobile-nav-link py-4 text-[20px] text-white/85"
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
              {showGuestAuth ? (
                <>
                  <Link
                    href="/auth/sign-in"
                    onClick={closeMenu}
                    className="btn-ghost justify-center"
                  >
                    {t("auth_login")}
                  </Link>
                  <AcidMotionButton
                    href="/auth/sign-up"
                    onClick={closeMenu}
                    className="btn-acid justify-center"
                  >
                    {t("auth_signup")} →
                  </AcidMotionButton>
                </>
              ) : null}
              {showMemberNav ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="btn-ghost justify-center"
                  >
                    Dashboard
                  </Link>
                  {navSession.isAdmin ? (
                    <Link
                      href="/admin"
                      onClick={closeMenu}
                      className="btn-ghost justify-center"
                    >
                      Admin
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      void handleLogout();
                    }}
                    className="btn-ghost justify-center"
                  >
                    {tNav("logout")}
                  </button>
                </>
              ) : null}
              {showNoPlanNav ? (
                <>
                  <Link
                    href="/pricing"
                    onClick={closeMenu}
                    className="btn-ghost justify-center"
                  >
                    {t("nav_pricing")}
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={closeMenu}
                    className="btn-ghost justify-center"
                  >
                    {tNav("settings_menu")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      void handleLogout();
                    }}
                    className="btn-ghost justify-center"
                  >
                    {tNav("logout")}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

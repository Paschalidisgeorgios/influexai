"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getToolByRoute } from "@/lib/dashboard-v2/tool-registry";
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasActivePlan } from "@/lib/access";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AnimatedCredits } from "@/components/ui/AnimatedCredits";
import { useBuyCredits } from "@/components/credits/BuyCreditsProvider";
import {
  creditsBadgeStyle,
  creditsDisplayColor,
} from "@/lib/credits-display-color";

interface Profile {
  full_name: string | null;
  email: string | null;
  plan: string;
  role: string | null;
  is_admin: boolean | null;
}

type DashboardHeaderProps = {
  credits?: number | null;
  onMobileMenuToggle?: () => void;
};

const menuItemClass =
  "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[0.875rem] text-white/80 no-underline transition-colors hover:bg-white/[0.04] hover:text-[#F0EFE8]";

export function DashboardHeader({
  credits: creditsProp,
  onMobileMenuToggle,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const activeTool = getToolByRoute(pathname);
  const t = useTranslations("buyCredits");
  const tNav = useTranslations("nav");
  const { open: openBuyCredits, credits: globalCredits } = useBuyCredits();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const supabase = createClient();

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, plan, role, is_admin")
      .eq("id", user.id)
      .single();

    if (data) setProfile(data);
  }, [supabase]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleLogout = async () => {
    setShowMenu(false);
    await supabase.auth.signOut();
    window.location.replace("/");
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (profile?.email?.[0]?.toUpperCase() ?? "?");

  const planLabel: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    creator: "Creator",
    pro: "Pro",
    business: "Business",
  };

  const displayCredits = creditsProp ?? globalCredits ?? null;
  const hasPlatformPlan = profile
    ? hasActivePlan({
        plan: profile.plan,
        role: profile.role,
        is_admin: profile.is_admin,
        email: profile.email,
      })
    : false;
  const creditColor =
    displayCredits !== null ? creditsDisplayColor(displayCredits) : "#B4FF00";
  const badgeStyle =
    displayCredits !== null
      ? creditsBadgeStyle(displayCredits)
      : creditsBadgeStyle(100);

  return (
    <header className="dashboard-mobile-top-shell shrink-0 border-b border-white/[0.06] bg-[#08080a]/90 backdrop-blur-md md:sticky md:top-0 md:z-30 min-w-0">
      <div className="flex h-14 items-center justify-between gap-2 px-4 sm:h-16 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-white/70 md:hidden"
          aria-label="Menü öffnen"
        >
          <Menu size={18} aria-hidden />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {activeTool?.label ?? "Dashboard"}
          </p>
          <p className="truncate text-[10px] text-white/30">
            {activeTool?.provider ?? "InfluexAI Studio"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
        <LanguageSwitcher compact buttonClassName="max-md:min-h-9 max-md:px-1.5 max-md:py-1" />
        {hasPlatformPlan ? (
          <button
            type="button"
            onClick={() => openBuyCredits()}
            className="flex max-h-11 min-h-9 cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 sm:min-h-[40px] sm:px-3 font-[family-name:var(--font-dm)] transition-opacity hover:opacity-90"
            style={{
              background: badgeStyle.background,
              border: badgeStyle.border,
            }}
          >
            <span
              data-testid="credits-display"
              className="text-[0.78rem] sm:text-[0.95rem] font-extrabold whitespace-nowrap"
              style={{ color: creditColor }}
            >
              ⚡{" "}
              <AnimatedCredits
                value={displayCredits}
                style={{ color: creditColor }}
              />
              <span className="hidden min-[380px]:inline"> {t("credits_label")}</span>
            </span>
          </button>
        ) : profile ? (
          <Link
            href="/pricing"
            data-testid="choose-plan-cta"
            className="flex max-h-11 min-h-9 items-center rounded-full border border-[#00FF66]/25 bg-[#00FF66]/10 px-2.5 py-1 text-[0.72rem] font-bold text-[#00FF66] no-underline transition-colors hover:bg-[#00FF66]/15 sm:min-h-[40px] sm:px-3.5 sm:text-[0.78rem]"
          >
            {tNav("choose_plan")}
          </Link>
        ) : null}

        {profile?.plan && profile.plan !== "free" && (
          <div className="hidden sm:block rounded-md border border-white/[0.09] bg-white/[0.05] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-white/65">
            {planLabel[profile.plan] ?? profile.plan}
          </div>
        )}

        <div className="relative">
          <button
            type="button"
            data-testid="user-menu-trigger"
            aria-expanded={showMenu}
            aria-haspopup="menu"
            onClick={() => setShowMenu((open) => !open)}
            className="flex min-h-9 min-w-9 cursor-pointer items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] py-0.5 pl-0.5 pr-0.5 sm:min-h-[40px] sm:min-w-[40px] sm:py-1 sm:pl-1 sm:pr-2 transition-colors hover:bg-white/[0.06]"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00FF66]/15 font-[family-name:var(--font-bebas)] text-sm tracking-wide text-[#00FF66] sm:h-8 sm:w-8 sm:text-base"
              aria-hidden
            >
              {initials}
            </span>
            {profile?.full_name && (
              <span className="hidden max-w-[7.5rem] truncate text-sm font-medium text-white/85 md:block">
                {profile.full_name}
              </span>
            )}
            <ChevronDown
              size={14}
              className={`hidden shrink-0 text-white/40 transition-transform md:block ${
                showMenu ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>

          {showMenu && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setShowMenu(false)}
              />
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-xl border border-white/[0.09] bg-[#0f0f12] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
              >
                <div className="border-b border-white/[0.07] px-4 py-3.5">
                  <p className="truncate text-sm font-semibold text-[#F0EFE8]">
                    {profile?.full_name ?? tNav("profile")}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-white/50">
                    {profile?.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard/settings"
                    role="menuitem"
                    onClick={() => setShowMenu(false)}
                    className={menuItemClass}
                  >
                    <Settings
                      size={16}
                      strokeWidth={2}
                      className="shrink-0 text-white/50"
                    />
                    {tNav("settings_menu")}
                  </Link>
                  <Link
                    href="/"
                    role="menuitem"
                    onClick={() => setShowMenu(false)}
                    className={menuItemClass}
                  >
                    <ExternalLink
                      size={16}
                      strokeWidth={2}
                      className="shrink-0 text-white/50"
                    />
                    {tNav("view_website")}
                  </Link>
                </div>

                <div className="border-t border-white/[0.07] py-1">
                  <button
                    type="button"
                    role="menuitem"
                    data-testid="auth-logout"
                    onClick={handleLogout}
                    className={`${menuItemClass} cursor-pointer border-0 bg-transparent text-[#ff6b7a]/90 hover:bg-[#ff6b7a]/8 hover:text-[#ff6b7a]`}
                  >
                    <LogOut
                      size={16}
                      strokeWidth={2}
                      className="shrink-0 text-[#ff6b7a]/70"
                    />
                    {tNav("logout")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}

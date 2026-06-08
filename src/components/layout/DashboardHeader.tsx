"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ExternalLink,
  LogOut,
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
  credits: number;
  plan: string;
  role: string | null;
  is_admin: boolean | null;
}

type DashboardHeaderProps = {
  credits?: number | null;
};

const menuItemClass =
  "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[0.875rem] text-white/80 no-underline transition-colors hover:bg-white/[0.04] hover:text-[#F0EFE8]";

export function DashboardHeader({ credits: creditsProp }: DashboardHeaderProps) {
  const t = useTranslations("buyCredits");
  const tNav = useTranslations("nav");
  const { open: openBuyCredits } = useBuyCredits();
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
      .select("full_name, email, credits, plan, role, is_admin")
      .eq("id", user.id)
      .single();

    if (data) setProfile(data);
  }, [supabase]);

  useEffect(() => {
    loadProfile();
    const onCreditsUpdated = () => loadProfile();
    window.addEventListener("credits-updated", onCreditsUpdated);
    const onOptimistic = (e: Event) => {
      const v = (e as CustomEvent<number | null>).detail;
      if (typeof v === "number") {
        setProfile((p) => (p ? { ...p, credits: v } : p));
      } else {
        loadProfile();
      }
    };
    window.addEventListener("optimistic-credits", onOptimistic);
    return () => {
      window.removeEventListener("credits-updated", onCreditsUpdated);
      window.removeEventListener("optimistic-credits", onOptimistic);
    };
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

  const displayCredits = creditsProp ?? profile?.credits ?? null;
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
    <header className="dashboard-mobile-top-shell md:sticky md:top-0 md:z-30 md:shrink-0 md:border-b md:border-white/[0.07] md:bg-[rgba(6,6,8,0.92)] md:pt-0 md:backdrop-blur-md min-w-0">
      <div className="flex h-16 max-h-[64px] items-center justify-between gap-2 px-4 sm:h-[72px] sm:max-h-[72px] sm:px-5">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="hidden sm:inline text-sm font-medium text-white/65">Studio</span>
        <span className="hidden sm:inline text-[#2a2a2a]">›</span>
        <span className="truncate text-[1.25rem] font-semibold leading-none text-[#F0EFE8] sm:text-sm sm:font-semibold">
          Dashboard
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
        <LanguageSwitcher compact buttonClassName="max-md:min-h-9 max-md:px-1.5 max-md:py-1" />
        {hasPlatformPlan ? (
          <button
            type="button"
            onClick={() => openBuyCredits()}
            className="flex max-h-11 min-h-9 cursor-pointer items-center gap-1 rounded-[9px] px-2 py-1 sm:min-h-[44px] sm:px-3.5 font-[family-name:var(--font-dm)] transition-opacity hover:opacity-90"
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
            className="flex max-h-11 min-h-9 items-center rounded-[9px] border border-[#B4FF00]/25 bg-[#B4FF00]/10 px-2.5 py-1 text-[0.72rem] font-bold text-[#B4FF00] no-underline transition-colors hover:bg-[#B4FF00]/15 sm:min-h-[44px] sm:px-3.5 sm:text-[0.78rem]"
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
            className="flex min-h-9 min-w-9 cursor-pointer items-center gap-2 rounded-[10px] border border-[#B4FF00]/20 bg-[#B4FF00]/10 py-0.5 pl-0.5 pr-0.5 sm:min-h-[44px] sm:min-w-[44px] sm:py-1 sm:pl-1 sm:pr-2 transition-colors hover:bg-[#B4FF00]/14"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#B4FF00]/15 font-[family-name:var(--font-bebas)] text-sm tracking-wide text-[#B4FF00] sm:h-8 sm:w-8 sm:text-base"
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

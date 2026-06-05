"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
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
}

type DashboardHeaderProps = {
  credits?: number | null;
};

export function DashboardHeader({ credits: creditsProp }: DashboardHeaderProps) {
  const t = useTranslations("buyCredits");
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
      .select("full_name, email, credits, plan")
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
    await supabase.auth.signOut();
    window.location.assign("/login");
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

  const displayCredits =
    creditsProp ?? profile?.credits ?? null;
  const creditColor =
    displayCredits !== null
      ? creditsDisplayColor(displayCredits)
      : "#B4FF00";
  const badgeStyle =
    displayCredits !== null
      ? creditsBadgeStyle(displayCredits)
      : creditsBadgeStyle(100);

  return (
    <header
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(6,6,8,0.85)",
        backdropFilter: "blur(12px)",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "0.875rem",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>Studio</span>
        <span style={{ color: "#2a2a2a" }}>›</span>
        <span style={{ color: "#F0EFE8", fontWeight: 600 }}>Dashboard</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LanguageSwitcher compact />
        <button
          type="button"
          onClick={openBuyCredits}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 9,
            background: badgeStyle.background,
            border: badgeStyle.border,
            cursor: "pointer",
            fontFamily: "var(--font-dm), sans-serif",
          }}
        >
          <span
            data-testid="credits-display"
            style={{ fontSize: "0.95rem", fontWeight: 800, color: creditColor }}
          >
            ⚡{" "}
            <AnimatedCredits
              value={displayCredits}
              style={{ color: creditColor }}
            />{" "}
            {t("credits_label")}
          </span>
        </button>

        {profile?.plan && profile.plan !== "free" && (
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "rgba(255,255,255,0.65)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {planLabel[profile.plan] ?? profile.plan}
          </div>
        )}

        <div style={{ position: "relative" }}>
          <div
            data-testid="user-menu-trigger"
            onClick={() => setShowMenu(!showMenu)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "rgba(180,255,0,0.12)",
              border: "1px solid rgba(180,255,0,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1rem",
              cursor: "pointer",
              color: "#B4FF00",
              letterSpacing: "0.04em",
              userSelect: "none",
            }}
          >
            {initials}
          </div>

          {showMenu && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
                onClick={() => setShowMenu(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 220,
                  borderRadius: 14,
                  background: "#0f0f12",
                  border: "1px solid rgba(255,255,255,0.09)",
                  zIndex: 50,
                  overflow: "hidden",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "#F0EFE8",
                      marginBottom: 2,
                    }}
                  >
                    {profile?.full_name ?? "Nutzer"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)" }}>
                    {profile?.email}
                  </div>
                </div>

                {[
                  {
                    icon: "⚡",
                    label: t("menu_top_up"),
                    href: "/dashboard/credits",
                  },
                  {
                    icon: "⚙️",
                    label: "Einstellungen",
                    href: "/dashboard/settings",
                  },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setShowMenu(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 16px",
                      color: "rgba(255,255,255,0.85)",
                      fontSize: "0.875rem",
                      textDecoration: "none",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        "#F0EFE8";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "transparent";
                      (e.currentTarget as HTMLAnchorElement).style.color =
                        "rgba(255,255,255,0.85)";
                    }}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </a>
                ))}

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <button
                    type="button"
                    data-testid="auth-logout"
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 16px",
                      color: "#ff6b7a",
                      fontSize: "0.875rem",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-dm), sans-serif",
                      textAlign: "left",
                    }}
                  >
                    <span>🚪</span>
                    Ausloggen
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

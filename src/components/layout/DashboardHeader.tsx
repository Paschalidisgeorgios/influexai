"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher } from "@/components/language-switcher";

interface Profile {
  full_name: string | null;
  email: string | null;
  credits: number;
  plan: string;
}

interface CreditTx {
  id: string;
  amount: number;
  description: string;
  created_at: string;
}

export function DashboardHeader() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [creditHistory, setCreditHistory] = useState<CreditTx[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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
    return () =>
      window.removeEventListener("credits-updated", onCreditsUpdated);
  }, [loadProfile]);

  const loadCreditHistory = async () => {
    setHistoryLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("credit_transactions")
        .select("id, amount, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);
      setCreditHistory(data ?? []);
    }
    setHistoryLoading(false);
  };

  const openCreditsMenu = () => {
    const next = !showCredits;
    setShowCredits(next);
    setShowMenu(false);
    if (next) loadCreditHistory();
  };

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
    creator: "Creator",
    business: "Business",
  };

  const formatTxDate = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `vor ${Math.max(1, mins)} Min.`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `vor ${hrs} Std.`;
    return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  };

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
        <span style={{ color: "#505055", fontWeight: 500 }}>Studio</span>
        <span style={{ color: "#2a2a2a" }}>›</span>
        <span style={{ color: "#F0EFE8", fontWeight: 600 }}>Dashboard</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LanguageSwitcher compact />
        {/* Credits */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={openCreditsMenu}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 9,
              background: "rgba(180,255,0,0.1)",
              border: "1px solid rgba(180,255,0,0.28)",
              cursor: "pointer",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            <span
              data-testid="credits-display"
              style={{ fontSize: "0.95rem", fontWeight: 800, color: "#B4FF00" }}
            >
              ⚡ {profile?.credits ?? "..."} Credits
            </span>
          </button>

          {showCredits && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
                onClick={() => setShowCredits(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 280,
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
                      fontSize: "0.72rem",
                      color: "#505055",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}
                  >
                    Guthaben
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "#B4FF00",
                      fontFamily: "var(--font-bebas), sans-serif",
                    }}
                  >
                    ⚡ {profile?.credits ?? 0} Credits
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 16px",
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "#505055",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 8,
                    }}
                  >
                    Verlauf
                  </div>
                  {historyLoading ? (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#505055",
                        margin: 0,
                      }}
                    >
                      Lädt...
                    </p>
                  ) : creditHistory.length === 0 ? (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#505055",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      Noch keine Transaktionen.
                    </p>
                  ) : (
                    creditHistory.map((tx) => (
                      <div
                        key={tx.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 8,
                          padding: "8px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "#F0EFE8",
                              fontWeight: 500,
                            }}
                          >
                            {tx.description}
                          </div>
                          <div
                            style={{
                              fontSize: "0.68rem",
                              color: "#505055",
                              marginTop: 2,
                            }}
                          >
                            {formatTxDate(tx.created_at)}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: tx.amount > 0 ? "#B4FF00" : "#ff6b7a",
                            flexShrink: 0,
                          }}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div
                  style={{
                    padding: "12px 16px",
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <Link
                    href="/dashboard/credits"
                    onClick={() => setShowCredits(false)}
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "10px",
                      borderRadius: 9,
                      background: "#B4FF00",
                      color: "#060608",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      textDecoration: "none",
                      fontFamily: "var(--font-dm), sans-serif",
                    }}
                  >
                    Credits kaufen
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {profile?.plan && profile.plan !== "free" && (
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#505055",
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
            onClick={() => {
              setShowMenu(!showMenu);
              setShowCredits(false);
            }}
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
                  <div style={{ fontSize: "0.75rem", color: "#505055" }}>
                    {profile?.email}
                  </div>
                </div>

                {[
                  {
                    icon: "⚡",
                    label: "Credits aufladen",
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
                      color: "rgba(240,239,232,0.6)",
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
                        "rgba(240,239,232,0.6)";
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

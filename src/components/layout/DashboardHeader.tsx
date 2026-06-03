"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Profile {
  full_name: string | null;
  email: string | null;
  credits: number;
  plan: string;
}

export function DashboardHeader() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, credits, plan")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? "?";

  const planLabel: Record<string, string> = {
    free: "Free",
    creator: "Creator",
    business: "Business",
  };

  return (
    <header style={{
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
    }}>
      {/* Left: Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem" }}>
        <span style={{ color: "#505055", fontWeight: 500 }}>Studio</span>
        <span style={{ color: "#2a2a2a" }}>›</span>
        <span style={{ color: "#F0EFE8", fontWeight: 600 }}>Dashboard</span>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Credits badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          borderRadius: 8,
          background: "rgba(180,255,0,0.07)",
          border: "1px solid rgba(180,255,0,0.18)",
        }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#B4FF00" }}>
            ⚡ {profile?.credits ?? "..."} Credits
          </span>
        </div>

        {/* Plan badge */}
        {profile?.plan && profile.plan !== "free" && (
          <div style={{
            padding: "4px 10px",
            borderRadius: 6,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            fontSize: "0.68rem",
            fontWeight: 700,
            color: "#505055",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            {planLabel[profile.plan] ?? profile.plan}
          </div>
        )}

        {/* Avatar + Dropdown */}
        <div style={{ position: "relative" }}>
          <div
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

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
                onClick={() => setShowMenu(false)}
              />
              <div style={{
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
              }}>
                {/* User info */}
                <div style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <div style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#F0EFE8",
                    marginBottom: 2,
                  }}>
                    {profile?.full_name ?? "Nutzer"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#505055" }}>
                    {profile?.email}
                  </div>
                </div>

                {/* Menu items */}
                {[
                  { icon: "⚡", label: "Credits aufladen", href: "/dashboard/credits" },
                  { icon: "⚙️", label: "Einstellungen", href: "/dashboard/settings" },
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
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "#F0EFE8";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                      (e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,239,232,0.6)";
                    }}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </a>
                ))}

                {/* Logout */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <button
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
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,71,87,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
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

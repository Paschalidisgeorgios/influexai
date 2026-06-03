"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { id: "live",    icon: "🎭", label: "Live Creator",    href: "/dashboard/live" },
  { id: "ki-ich",  icon: "📸", label: "Mein KI-Ich",     href: "/dashboard/ki-ich" },
  { id: "produkt", icon: "🛍️", label: "Produkt-Werbung", href: "/dashboard/produkt" },
  { id: "stimme",  icon: "🎵", label: "Stimme & Musik",  href: "/dashboard/stimme" },
];

const BOTTOM_NAV = [
  { icon: "⚙️", label: "Einstellungen", href: "/dashboard/settings" },
  { icon: "💳", label: "Credits & Plan", href: "/dashboard/credits" },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [maxCredits, setMaxCredits] = useState(500);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const loadCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("credits, plan")
        .eq("id", user.id)
        .single();
      if (data) {
        setCredits(data.credits);
        setMaxCredits(data.plan === "business" ? 2500 : data.plan === "creator" ? 500 : 50);
      }
    };
    loadCredits();
  }, []);

  const creditPercent = credits !== null ? Math.min((credits / maxCredits) * 100, 100) : 74;
  const creditColor = creditPercent > 50 ? "#B4FF00" : creditPercent > 20 ? "#f59e0b" : "#ff6b7a";

  return (
    <aside style={{
      width: collapsed ? 64 : 220,
      minHeight: "100vh",
      background: "#0f0f12",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.3s ease",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: collapsed ? "0 17px" : "0 20px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30,
          borderRadius: 8,
          background: "#B4FF00",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "1rem",
          color: "#060608",
          flexShrink: 0,
        }}>I</div>
        {!collapsed && (
          <span style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "1.1rem",
            letterSpacing: "0.04em",
            color: "#F0EFE8",
            whiteSpace: "nowrap",
          }}>
            Influex<span style={{ color: "#B4FF00" }}>AI</span>
          </span>
        )}
      </div>

      {/* Main Nav */}
      <nav style={{
        flex: 1,
        padding: "10px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflowY: "auto",
      }}>
        {!collapsed && (
          <p style={{
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#505055",
            padding: "8px 10px 6px",
          }}>
            Module
          </p>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 17px" : "10px 12px",
                borderRadius: 10,
                textDecoration: "none",
                color: isActive ? "#B4FF00" : "rgba(240,239,232,0.45)",
                fontSize: "0.875rem",
                fontWeight: isActive ? 700 : 500,
                background: isActive ? "rgba(180,255,0,0.08)" : "transparent",
                transition: "all 0.15s",
                justifyContent: collapsed ? "center" : "flex-start",
                borderLeft: isActive ? "2px solid #B4FF00" : "2px solid transparent",
              }}
            >
              <span style={{ fontSize: "1.05rem", flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          );
        })}

        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 4px" }} />

        {BOTTOM_NAV.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            title={collapsed ? item.label : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "9px 17px" : "9px 12px",
              borderRadius: 10,
              textDecoration: "none",
              color: "rgba(240,239,232,0.3)",
              fontSize: "0.82rem",
              fontWeight: 500,
              transition: "all 0.15s",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <span style={{ fontSize: "0.95rem", flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>

      {/* Credits Panel */}
      {!collapsed && (
        <div style={{
          margin: "8px",
          padding: "14px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}>
            <span style={{ fontSize: "0.72rem", color: "#505055", fontWeight: 500 }}>Credits</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: creditColor }}>
              {credits ?? "..."}
            </span>
          </div>
          <div style={{
            height: 4,
            background: "#222228",
            borderRadius: 99,
            overflow: "hidden",
            marginBottom: 4,
          }}>
            <div style={{
              width: `${creditPercent}%`,
              height: "100%",
              background: creditColor,
              borderRadius: 99,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ fontSize: "0.65rem", color: "#505055", marginBottom: 10 }}>
            von {maxCredits} Credits
          </div>
          <a href="/dashboard/credits" style={{
            display: "block",
            textAlign: "center",
            padding: "7px",
            borderRadius: 8,
            background: "rgba(180,255,0,0.08)",
            border: "1px solid rgba(180,255,0,0.18)",
            color: "#B4FF00",
            fontSize: "0.72rem",
            fontWeight: 700,
            textDecoration: "none",
          }}>
            ⚡ Aufladen
          </a>
        </div>
      )}

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          margin: "0 8px 8px",
          padding: "9px",
          borderRadius: 10,
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.06)",
          color: "#505055",
          cursor: "pointer",
          fontSize: "0.75rem",
          fontFamily: "var(--font-dm), sans-serif",
        }}
      >
        {collapsed ? "→" : "← Einklappen"}
      </button>
    </aside>
  );
}

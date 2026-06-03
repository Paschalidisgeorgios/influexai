"use client";

import { useState } from "react";
import Link from "next/link";

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
      position: "relative",
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

        {NAV_ITEMS.map((item) => (
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
              color: "rgba(240,239,232,0.45)",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "all 0.15s",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(180,255,0,0.08)";
              (e.currentTarget as HTMLAnchorElement).style.color = "#B4FF00";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              (e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,239,232,0.45)";
            }}
          >
            <span style={{ fontSize: "1.05rem", flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && item.label}
          </Link>
        ))}

        {/* Divider */}
        <div style={{
          height: 1,
          background: "rgba(255,255,255,0.05)",
          margin: "8px 4px",
        }} />

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
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,239,232,0.7)";
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,239,232,0.3)";
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
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
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#B4FF00" }}>373</span>
          </div>
          <div style={{
            height: 4,
            background: "#222228",
            borderRadius: 99,
            overflow: "hidden",
            marginBottom: 4,
          }}>
            <div style={{
              width: "74%",
              height: "100%",
              background: "linear-gradient(90deg, #B4FF00, #caffb0)",
              borderRadius: 99,
            }} />
          </div>
          <div style={{ fontSize: "0.65rem", color: "#505055", marginBottom: 10 }}>
            von 500 · Creator Plan
          </div>
          <a href="/pricing" style={{
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
          transition: "all 0.2s",
          fontFamily: "var(--font-dm), sans-serif",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#F0EFE8";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#505055";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
        }}
      >
        {collapsed ? "→" : "← Einklappen"}
      </button>
    </aside>
  );
}

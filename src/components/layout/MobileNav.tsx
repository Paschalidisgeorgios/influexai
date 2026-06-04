"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
const NAV_ITEMS = [
  { icon: "🏠", label: "Home", href: "/dashboard" },
  { icon: "🎭", label: "Avatar", href: "/dashboard/live-creator" },
  { icon: "📸", label: "KI-Ich", href: "/dashboard/ki-ich" },
  { icon: "🛍️", label: "Werbung", href: "/dashboard/produkt" },
  { icon: "🎵", label: "Stimme", href: "/dashboard/voice" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(15,15,18,0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "8px 0 env(safe-area-inset-bottom, 8px)",
        zIndex: 50,
        display: "flex",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "6px 4px",
              textDecoration: "none",
              transition: "all 0.15s",
            }}
          >
            <span
              style={{
                fontSize: "1.3rem",
                lineHeight: 1,
                filter: isActive ? "none" : "grayscale(100%) opacity(0.5)",
              }}
            >
              {item.icon}
            </span>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#B4FF00" : "#505055",
                fontFamily: "var(--font-dm), sans-serif",
                letterSpacing: "0.02em",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

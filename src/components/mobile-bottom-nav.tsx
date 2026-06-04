"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  Video,
  Sparkles,
  Zap,
  Settings,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: (pathname: string) => boolean;
};

export function MobileBottomNav() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");
  const pathname = usePathname();

  const NAV_ITEMS: NavItem[] = [
    {
      href: "/dashboard",
      icon: Home,
      label: t("nav_home"),
      isActive: (p) => p === "/dashboard",
    },
    {
      href: "/dashboard/produkt",
      icon: Video,
      label: t("nav_videos"),
      isActive: (p) =>
        p.startsWith("/dashboard/produkt") ||
        p.startsWith("/dashboard/video-ad"),
    },
    {
      href: "/dashboard/ki-ich",
      icon: Sparkles,
      label: t("nav_ki_ich"),
      isActive: (p) => p.startsWith("/dashboard/ki-ich"),
    },
    {
      href: "/dashboard/credits",
      icon: Zap,
      label: tNav("credits"),
      isActive: (p) => p.startsWith("/dashboard/credits"),
    },
    {
      href: "/dashboard/settings",
      icon: Settings,
      label: t("nav_settings"),
      isActive: (p) => p.startsWith("/dashboard/settings"),
    },
  ];

  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        background: "rgba(6, 6, 8, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(180, 255, 0, 0.12)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        minHeight: "calc(64px + env(safe-area-inset-bottom, 0px))",
      }}
      aria-label="Dashboard navigation"
    >
      {NAV_ITEMS.map((item) => {
        const active = item.isActive(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors duration-150"
            style={{ textDecoration: "none" }}
          >
            <span
              className="flex flex-col items-center gap-1 transition-all duration-150"
              style={{
                color: active ? "#B4FF00" : "rgba(255,255,255,0.4)",
              }}
            >
              <span
                className="h-1 w-1 rounded-full transition-all duration-150"
                style={{
                  background: active ? "#B4FF00" : "transparent",
                  opacity: active ? 1 : 0,
                  transform: active ? "scale(1)" : "scale(0)",
                }}
                aria-hidden
              />
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

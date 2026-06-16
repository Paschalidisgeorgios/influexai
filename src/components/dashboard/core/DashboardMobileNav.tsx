"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Sparkles,
  Images,
  Settings,
} from "lucide-react";

export const DASHBOARD_MOBILE_NAV = [
  { id: "studio", label: "Studio", href: "/dashboard", icon: LayoutDashboard },
  { id: "agent", label: "Agent", href: "/dashboard/ki-agent", icon: Bot },
  { id: "tools", label: "Tools", href: "/dashboard?tool=viral-hook", icon: Sparkles },
  { id: "gallery", label: "Galerie", href: "/dashboard/gallery", icon: Images },
  {
    id: "settings",
    label: "Mehr",
    href: "/dashboard/settings",
    icon: Settings,
  },
] as const;

function isMobileNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/dashboard/";
  }
  if (href.startsWith("/dashboard?")) {
    return pathname === "/dashboard" || pathname === "/dashboard/";
  }
  return pathname.startsWith(href);
}

export function DashboardMobileNav() {
  const pathname = usePathname() ?? "";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t md:hidden"
      style={{
        background: "#050506",
        borderColor: "rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {DASHBOARD_MOBILE_NAV.map((item) => {
        const active = isMobileNavActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2.5 transition-colors active:bg-white/[0.04]"
            aria-label={item.label}
          >
            <Icon
              size={17}
              style={{ color: active ? "#b4ff00" : "rgba(255,255,255,0.28)" }}
            />
            <span
              className="max-w-full truncate text-[9px] font-medium leading-tight"
              style={{ color: active ? "#b4ff00" : "rgba(255,255,255,0.28)" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

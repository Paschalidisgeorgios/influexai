"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  UserRound,
  Images,
  Megaphone,
  Palette,
  Settings,
  Coins,
} from "lucide-react";
import {
  DASHBOARD_PRIMARY_NAV,
  isStudioAreaActive,
  type DashboardNavId,
} from "./DashboardPrimaryNav";

export const DASHBOARD_MOBILE_NAV: {
  id: DashboardNavId;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "studio", label: "Studio", href: "/dashboard", icon: LayoutDashboard },
  { id: "ai-creator", label: "AI Creator", href: "/dashboard/ai-creator", icon: UserRound },
  { id: "gallery", label: "Galerie", href: "/dashboard/gallery", icon: Images },
  { id: "campaigns", label: "Kampagnen", href: "/dashboard/campaigns", icon: Megaphone },
  { id: "brand-kit", label: "Brand Kit", href: "/dashboard/brand-kit", icon: Palette },
  { id: "settings", label: "Einstellungen", href: "/dashboard/settings", icon: Settings },
  { id: "credits", label: "Credits", href: "/dashboard/credits", icon: Coins },
];

function isMobileNavActive(
  item: (typeof DASHBOARD_MOBILE_NAV)[number],
  pathname: string,
  searchParams: URLSearchParams
): boolean {
  const config = DASHBOARD_PRIMARY_NAV.find((entry) => entry.id === item.id);
  if (!config) return false;

  if (item.id === "studio") {
    return isStudioAreaActive(pathname, searchParams);
  }

  return config.match(pathname);
}

export function DashboardMobileNav() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 border-t md:hidden"
      style={{
        background: "#050506",
        borderColor: "rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        className="flex items-stretch overflow-x-auto"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {DASHBOARD_MOBILE_NAV.map((item) => {
          const active = isMobileNavActive(item, pathname, searchParams);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex min-w-[4.5rem] shrink-0 flex-col items-center justify-center gap-0.5 px-2 py-2.5 transition-colors active:bg-white/[0.04]"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={17}
                strokeWidth={1.75}
                style={{ color: active ? "#b4ff00" : "rgba(255,255,255,0.32)" }}
              />
              <span
                className="max-w-[4.25rem] truncate text-[9px] font-medium leading-tight"
                style={{ color: active ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.32)" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { MOBILE_QUICK_NAV } from "@/lib/dashboard-flows";

export function MobileBottomNav() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 items-stretch overflow-x-hidden bg-[rgba(6,6,8,0.92)] border-t border-[#B4FF00]/12 backdrop-blur-md"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        minHeight: "calc(72px + env(safe-area-inset-bottom, 0px))",
      }}
      aria-label="Dashboard navigation"
    >
      {MOBILE_QUICK_NAV.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        const label =
          item.labelKey === "quick_agent"
            ? tNav("agent")
            : item.labelKey === "nav_settings"
              ? tNav("settings_menu")
              : item.labelKey === "nav_home"
                ? t(item.labelKey)
                : t(item.labelKey);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 min-h-[56px] no-underline transition-colors"
          >
            <span
              className={`h-0.5 w-5 rounded-full mb-0.5 transition-all ${
                active ? "bg-[#B4FF00] opacity-100" : "bg-transparent opacity-0"
              }`}
              aria-hidden
            />
            <Icon
              size={20}
              strokeWidth={active ? 2.25 : 1.75}
              className={active ? "text-[#B4FF00]" : "text-white/70"}
              aria-hidden
            />
            <span
              className={`text-[10px] font-semibold leading-none ${
                active ? "text-[#B4FF00]" : "text-white/70"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

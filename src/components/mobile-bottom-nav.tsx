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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch bg-[#060608]/92 backdrop-blur-xl border-t border-[#B4FF00]/12"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        minHeight: "calc(64px + env(safe-area-inset-bottom, 0px))",
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
            : t(item.labelKey);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[44px] no-underline transition-colors"
          >
            <span
              className={`h-0.5 w-6 rounded-full mb-0.5 transition-all ${
                active ? "bg-[#B4FF00] opacity-100" : "bg-transparent opacity-0"
              }`}
              aria-hidden
            />
            <Icon
              size={22}
              strokeWidth={active ? 2.25 : 1.75}
              className={active ? "text-[#B4FF00]" : "text-white/40"}
              aria-hidden
            />
            <span
              className={`text-[0.62rem] font-semibold ${
                active ? "text-[#B4FF00]" : "text-white/40"
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

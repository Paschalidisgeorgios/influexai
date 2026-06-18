"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Bot, Wrench } from "lucide-react";
import { DASHBOARD_SECONDARY_LINKS } from "./DashboardPrimaryNav";

const SECONDARY_ICONS: Record<string, React.ReactNode> = {
  Agent: <Bot size={14} strokeWidth={1.75} />,
  Tools: <Wrench size={14} strokeWidth={1.75} />,
};

function isSecondaryActive(
  href: string,
  pathname: string,
  searchParams: URLSearchParams
): boolean {
  if (href.startsWith("/dashboard/ki-agent")) {
    return pathname.startsWith("/dashboard/ki-agent");
  }
  if (href.includes("tool=tools")) {
    const onDashboard = pathname === "/dashboard" || pathname === "/dashboard/";
    return onDashboard && searchParams.get("tool") === "tools";
  }
  return pathname.startsWith(href);
}

/** Desktop-only secondary workflow access — Agent & Tools below primary nav. */
export function DashboardSecondaryNav() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  return (
    <div
      className="mx-2 mt-3 border-t pt-3"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <p
        className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "rgba(255,255,255,0.28)" }}
      >
        Arbeitszugänge
      </p>
      <nav className="space-y-0.5" aria-label="Sekundäre Arbeitszugänge">
        {DASHBOARD_SECONDARY_LINKS.map((item) => {
          const active = isSecondaryActive(item.href, pathname, searchParams);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex w-full items-center gap-2.5 rounded-lg py-2 pl-3 pr-2 text-left transition-all hover:bg-white/[0.03]"
              style={{
                background: active ? "rgba(255,255,255,0.04)" : "transparent",
              }}
              aria-current={active ? "page" : undefined}
            >
              <span
                className="flex shrink-0 items-center justify-center"
                style={{ color: active ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.28)" }}
              >
                {SECONDARY_ICONS[item.label]}
              </span>
              <span
                className="text-[12px] font-medium"
                style={{ color: active ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.38)" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

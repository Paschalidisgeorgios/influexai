"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Images,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import { isDedicatedToolPath } from "./production-tool-routes";

export type DashboardNavId =
  | "studio"
  | "ai-creator"
  | "agent"
  | "tools"
  | "gallery"
  | "settings";

export const DASHBOARD_PRIMARY_NAV: {
  id: DashboardNavId;
  label: string;
  href: string;
  icon: React.ReactNode;
  match: (path: string) => boolean;
}[] = [
  {
    id: "studio",
    label: "Studio",
    href: "/dashboard",
    icon: <LayoutDashboard size={15} strokeWidth={1.75} />,
    match: (p) => p === "/dashboard" || p === "/dashboard/",
  },
  {
    id: "ai-creator",
    label: "AI Creator",
    href: "/dashboard/ai-creator",
    icon: <UserRound size={15} strokeWidth={1.75} />,
    match: (p) => p.startsWith("/dashboard/ai-creator"),
  },
  {
    id: "agent",
    label: "Agent",
    href: "/dashboard/ki-agent",
    icon: <Bot size={15} strokeWidth={1.75} />,
    match: (p) => p.startsWith("/dashboard/ki-agent"),
  },
  {
    id: "tools",
    label: "Tools",
    href: "/dashboard?tool=tools",
    icon: <Sparkles size={15} strokeWidth={1.75} />,
    match: (p) => isDedicatedToolPath(p),
  },
  {
    id: "gallery",
    label: "Galerie",
    href: "/dashboard/gallery",
    icon: <Images size={15} strokeWidth={1.75} />,
    match: (p) => p.startsWith("/dashboard/gallery"),
  },
  {
    id: "settings",
    label: "Einstellungen",
    href: "/dashboard/settings",
    icon: <Settings size={15} strokeWidth={1.75} />,
    match: (p) => p.startsWith("/dashboard/settings"),
  },
];

function isDashboardToolView(searchParams: URLSearchParams): boolean {
  const tool = searchParams.get("tool");
  return Boolean(
    tool && tool !== "studio" && tool !== "gallery" && tool !== "settings"
  );
}

function isActive(
  pathname: string,
  item: (typeof DASHBOARD_PRIMARY_NAV)[number],
  searchParams: URLSearchParams
) {
  if (item.id === "studio") {
    const onDashboard = pathname === "/dashboard" || pathname === "/dashboard/";
    return onDashboard && !isDashboardToolView(searchParams);
  }
  if (item.id === "tools") {
    if (isDashboardToolView(searchParams)) return true;
    return item.match(pathname);
  }
  return item.match(pathname);
}

export function DashboardPrimaryNav({ compact }: { compact?: boolean }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  return (
    <nav className={compact ? "space-y-0.5" : "space-y-0.5 px-2"}>
      {DASHBOARD_PRIMARY_NAV.map((item) => {
        const active = isActive(pathname, item, searchParams);
        return (
          <Link
            key={item.id}
            href={item.href}
            className="group flex w-full items-center gap-3 rounded-xl py-2.5 pl-3 pr-3 text-left transition-all"
            style={{
              background: active ? "rgba(255,255,255,0.045)" : "transparent",
            }}
          >
            <span
              className="relative flex shrink-0 items-center justify-center"
              style={{ color: active ? "#ffffff" : "rgba(255,255,255,0.32)" }}
            >
              {active ? (
                <span
                  className="absolute -left-2.5 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full"
                  style={{ background: "#b4ff00", opacity: 0.85 }}
                  aria-hidden
                />
              ) : null}
              {item.icon}
            </span>
            <span
              className="text-[13px] font-medium"
              style={{ color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.42)" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Images,
  Settings,
  Sparkles,
} from "lucide-react";

export type DashboardNavId =
  | "studio"
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
    icon: <LayoutDashboard size={15} />,
    match: (p) => p === "/dashboard" || p === "/dashboard/",
  },
  {
    id: "agent",
    label: "Agent",
    href: "/dashboard/ki-agent",
    icon: <Bot size={15} />,
    match: (p) => p.startsWith("/dashboard/ki-agent"),
  },
  {
    id: "tools",
    label: "Tools",
    href: "/dashboard?tool=viral-hook",
    icon: <Sparkles size={15} />,
    match: (p) =>
      p.startsWith("/dashboard/viral-hook") ||
      p.startsWith("/dashboard/szenen-generator") ||
      p.startsWith("/dashboard/image-generator"),
  },
  {
    id: "gallery",
    label: "Galerie",
    href: "/dashboard/gallery",
    icon: <Images size={15} />,
    match: (p) => p.startsWith("/dashboard/gallery"),
  },
  {
    id: "settings",
    label: "Einstellungen",
    href: "/dashboard/settings",
    icon: <Settings size={15} />,
    match: (p) => p.startsWith("/dashboard/settings"),
  },
];

function isDashboardToolView(searchParams: URLSearchParams): boolean {
  const tool = searchParams.get("tool");
  return Boolean(tool && tool !== "studio" && tool !== "gallery" && tool !== "settings");
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
    <nav className={compact ? "space-y-0.5" : "space-y-0.5 px-3"}>
      {DASHBOARD_PRIMARY_NAV.map((item) => {
        const active = isActive(pathname, item, searchParams);
        return (
          <Link
            key={item.id}
            href={item.href}
            className="flex w-full items-center gap-3 rounded-lg py-2 pl-3 pr-3 text-left transition-all"
            style={{
              background: active ? "rgba(255,255,255,0.04)" : "transparent",
              borderLeft: active ? "2px solid #b4ff00" : "2px solid transparent",
              paddingLeft: active ? "calc(0.75rem - 2px)" : "0.75rem",
            }}
          >
            <span
              className="shrink-0"
              style={{ color: active ? "#ffffff" : "rgba(255,255,255,0.28)" }}
            >
              {item.icon}
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: active ? "#ffffff" : "rgba(255,255,255,0.38)" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SIDEBAR_TOOL_CATEGORIES, type NavItem } from "@/lib/dashboard-flows";
import { useDashboardV2Optional } from "@/contexts/DashboardV2Context";
import { glassSurfaceStaticClass } from "@/lib/glass-classes";
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { SidebarNavLink } from "@/components/layout/SidebarNavLink";

const DEFAULT_OPEN: Record<string, boolean> = {
  erstellen: false,
  visuals: false,
  "video-film": true,
  "avatar-live": false,
  audio: false,
  "werbung-business": false,
  automation: true,
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/ki-agent") {
    return (
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/ki-agent") ||
      pathname.startsWith("/dashboard/agent")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function linkClass(active: boolean): string {
  return `flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] no-underline transition-colors ${
    active
      ? "bg-white/[0.06] font-medium text-white"
      : "text-white/45 hover:bg-white/[0.03] hover:text-white/70"
  }`;
}

export function GlobalSidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const ctx = useDashboardV2Optional();
  const [open, setOpen] = useState(DEFAULT_OPEN);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      void supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (typeof data?.credits === "number") setCredits(data.credits);
        });
    });
  }, []);

  const rgb = ctx?.themeRgb ?? "0,255,102";

  return (
    <aside
      className={`flex h-full flex-col border-r ${glassSurfaceStaticClass} ${
        mobile ? "w-full" : "w-[240px] shrink-0"
      }`}
      style={{ borderRightWidth: "0.5px" }}
    >
      <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-4">
        <BrandWordmark href="/dashboard" ariaLabel="Zum Dashboard" size="sm" />
      </div>

      <nav className="dashboard-v2-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3">
        <SidebarNavLink href="/dashboard" active={pathname === "/dashboard"} className={linkClass(pathname === "/dashboard")}>
          <Home size={16} />
          <span>Home</span>
        </SidebarNavLink>

        {SIDEBAR_TOOL_CATEGORIES.map((cat) => (
          <div key={cat.key} className="mt-3">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [cat.key]: !o[cat.key] }))}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] tracking-widest text-white/30 uppercase transition-colors hover:text-white/50"
            >
              {cat.label}
              <ChevronDown
                size={12}
                className={`transition-transform ${open[cat.key] ? "rotate-180" : ""}`}
              />
            </button>
            {open[cat.key] && (
              <div className="mt-1 space-y-0.5 pl-1">
                {cat.items.map((item: NavItem) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <SidebarNavLink
                      key={item.id}
                      href={item.href}
                      active={active}
                      className={linkClass(active)}
                    >
                      <item.icon size={15} />
                      <span className="truncate">{item.label ?? item.id}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full border border-[#00FF66]/25 bg-[#00FF66]/10 px-1.5 py-0.5 text-[8px] text-[#00FF66]">
                          {item.badge}
                        </span>
                      )}
                    </SidebarNavLink>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <div
          className="rounded-xl border px-3 py-2 text-center text-[10px]"
          style={{
            borderColor: `rgba(${rgb},0.2)`,
            color: `rgba(${rgb},0.75)`,
            background: `rgba(${rgb},0.06)`,
          }}
        >
          {credits !== null ? `${credits.toLocaleString("de-DE")} Credits` : "Credits…"}
        </div>
        <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
          <Link href="/dashboard/settings" className="text-white/35 hover:text-white/60">
            Einstellungen
          </Link>
          <span className="text-white/15">·</span>
          <Link href="/dashboard/credits" className="text-white/35 hover:text-white/60">
            Plan
          </Link>
        </div>
      </div>
    </aside>
  );
}

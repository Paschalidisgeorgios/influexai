"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TOOL_CATEGORIES, WORKSPACE_TOOLS } from "@/lib/dashboard-v3/registry";
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { useDashboardV3 } from "@/lib/dashboard-v3/context";

export function GlobalSidebar() {
  const pathname = usePathname();
  const {
    activeToolId,
    selectTool,
    credits,
    userName,
    sidebarOpen,
    setSidebarOpen,
  } = useDashboardV3();

  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TOOL_CATEGORIES.map((c) => [c, true]))
  );
  const [displayCredits, setDisplayCredits] = useState(credits);
  const [displayName, setDisplayName] = useState(userName || "Creator");

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const metaName = user.user_metadata?.full_name as string | undefined;
      const first =
        metaName?.trim().split(/\s+/)[0] || user.email?.split("@")[0] || "Creator";
      setDisplayName(first);
      void supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (typeof data?.credits === "number") setDisplayCredits(data.credits);
        });
    });
  }, []);

  useEffect(() => {
    if (userName) setDisplayName(userName);
  }, [userName]);

  useEffect(() => {
    setDisplayCredits(credits);
  }, [credits]);

  const toolsByCategory = useMemo(() => {
    const map = new Map<string, typeof WORKSPACE_TOOLS>();
    for (const cat of TOOL_CATEGORIES) {
      map.set(cat, WORKSPACE_TOOLS.filter((t) => t.category === cat));
    }
    return map;
  }, []);

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Sidebar schließen"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-40 flex h-full w-[240px] shrink-0 flex-col border-r border-zinc-800/50 bg-zinc-950/40 backdrop-blur-md transition-transform duration-300 ease-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderRightWidth: "0.5px" }}
      >
        <div className="flex items-center justify-between border-b border-zinc-800/50 px-4 py-4">
          <BrandWordmark href="/dashboard" ariaLabel="Zum Dashboard" size="sm" />
          <button
            type="button"
            className="text-white/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Schließen"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          <Link
            href="/dashboard"
            className={`mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] no-underline transition-colors ${
              pathname === "/dashboard"
                ? "border-l-2 bg-white/[0.06] font-medium text-white"
                : "text-white/40 hover:bg-white/[0.03]"
            }`}
            style={
              pathname === "/dashboard"
                ? { borderLeftColor: "#B4FF00" }
                : { borderLeft: "2px solid transparent" }
            }
            onClick={() => setSidebarOpen(false)}
          >
            <span>🏠</span>
            <span>Agent Autopilot</span>
          </Link>

          {TOOL_CATEGORIES.map((cat) => {
            const tools = toolsByCategory.get(cat) ?? [];
            if (tools.length === 0) return null;
            const isOpen = openCats[cat];
            return (
              <div key={cat} className="mt-2">
                <button
                  type="button"
                  onClick={() => setOpenCats((o) => ({ ...o, [cat]: !o[cat] }))}
                  className="flex w-full items-center justify-between px-2 py-1.5 text-[9px] tracking-[2px] text-white/45 uppercase"
                >
                  {cat}
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="mt-0.5 space-y-0.5">
                    {tools.map((tool) => {
                      const active =
                        tool.id === activeToolId ||
                        pathname === tool.route ||
                        pathname.startsWith(`${tool.route}/`);
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            selectTool(tool.id);
                            setSidebarOpen(false);
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] transition-colors ${
                            active
                              ? "bg-white/[0.06] font-medium text-white"
                              : "text-white/40 hover:bg-white/[0.03]"
                          }`}
                          style={{
                            borderLeft: active ? "2px solid #B4FF00" : "2px solid transparent",
                          }}
                        >
                          <span className="text-sm">{tool.icon}</span>
                          <span className="truncate">{tool.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div
          className="shrink-0 space-y-3 border-t p-3"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <Link
            href="/pricing"
            className="block w-full rounded-lg bg-gradient-to-r from-[#0066FF] to-[#0044cc] py-2.5 text-center text-[11px] font-semibold text-white no-underline"
          >
            Plan upgraden
          </Link>
          <div className="flex items-center gap-2.5 px-1">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold text-white"
              style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-white">{displayName}</p>
              <p className="text-[10px]" style={{ color: "#B4FF00" }}>
                ⚡ {displayCredits} Credits
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

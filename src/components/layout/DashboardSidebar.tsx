"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BarChart2, Images, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LowCreditsSidebar } from "@/components/low-credits-sidebar";
import { LIVE_CREATOR_COMING_SOON } from "@/lib/feature-flags";
import { NAV_GROUPS } from "@/lib/dashboard-flows";
import { getPlanMonthlyCredits } from "@/lib/subscription-plans";
import { SidebarNavLink } from "@/components/layout/SidebarNavLink";
import { TablerGift } from "@/components/icons/TablerGift";
import { AnimatedCredits } from "@/components/ui/AnimatedCredits";

type ExtraNavItem = {
  id: string;
  href: string;
  icon: typeof BarChart2;
  labelKey: "analytics" | "gallery";
};

const EXTRA_NAV: ExtraNavItem[] = [
  {
    id: "analytics",
    href: "/dashboard/analytics",
    labelKey: "analytics",
    icon: BarChart2,
  },
  {
    id: "gallery",
    href: "/dashboard/gallery",
    labelKey: "gallery",
    icon: Images,
  },
];

const BOTTOM_NAV = [
  { id: "community", emoji: "🌐", labelKey: "community" as const, href: "/community" },
  { id: "api", emoji: "🔌", labelKey: "developer_api" as const, href: "/dashboard/api" },
  {
    id: "referral",
    labelKey: "referral" as const,
    href: "/dashboard/referral",
    useGiftIcon: true,
  },
  { id: "settings", emoji: "⚙️", labelKey: "settings_menu" as const, href: "/dashboard/settings" },
  { id: "credits", emoji: "💳", labelKey: "credits_plan" as const, href: "/dashboard/credits" },
] as const;

const ADMIN_NAV = [
  {
    icon: "📊",
    label: "Business Analytics",
    href: "/dashboard/admin/analytics",
  },
  { icon: "🚀", label: "Product Hunt", href: "/dashboard/admin/producthunt" },
  { icon: "📱", label: "App Store Kit", href: "/dashboard/admin/app-store" },
  { icon: "✍️", label: "SEO Content", href: "/dashboard/admin/content" },
  { icon: "⚙️", label: "Admin Panel", href: "/admin" },
];

const AGENCY_NAV = [
  { icon: "🏢", label: "Agentur", href: "/dashboard/agency" },
];

function navItemLabel(
  item: (typeof NAV_GROUPS)[0]["items"][0],
  tNav: ReturnType<typeof useTranslations<"nav">>,
  tFlows: ReturnType<typeof useTranslations<"flows">>
): string {
  if (item.label) return item.label;
  if (item.labelKey === "live_creator") return tNav("live_creator");
  if (item.labelKey === "script") return tFlows("script.title");
  if (item.labelKey === "thumbnail") return tFlows("thumbnail.title");
  if (item.labelKey === "image_generator") return tFlows("image_generator.title");
  if (item.labelKey === "remix") return tFlows("remix.title");
  if (item.labelKey === "viral_score") return tNav("viral_score");
  if (item.labelKey === "competitor") return tNav("competitor");
  if (item.labelKey === "image_generator") return tNav("image_generator");
  return item.labelKey ?? item.id;
}

export function DashboardSidebar() {
  const tDash = useTranslations("dashboard");
  const tNav = useTranslations("nav");
  const tFlows = useTranslations("flows");
  const [collapsed, setCollapsed] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [maxCredits, setMaxCredits] = useState(500);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAgency, setHasAgency] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const loadCredits = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("credits, plan, is_admin")
        .eq("id", user.id)
        .single();
      if (data) {
        setCredits(data.credits);
        setMaxCredits(getPlanMonthlyCredits(data.plan));
        setIsAdmin(data.is_admin ?? false);
      }
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      setHasAgency(!!tenant);
    };
    loadCredits();
    const onUpdate = () => loadCredits();
    const onOptimistic = (e: Event) => {
      const v = (e as CustomEvent<number | null>).detail;
      if (typeof v === "number") setCredits(v);
      else loadCredits();
    };
    window.addEventListener("credits-updated", onUpdate);
    window.addEventListener("optimistic-credits", onOptimistic);
    return () => {
      window.removeEventListener("credits-updated", onUpdate);
      window.removeEventListener("optimistic-credits", onOptimistic);
    };
  }, [supabase]);

  const creditPercent =
    credits !== null ? Math.min((credits / maxCredits) * 100, 100) : 74;
  const creditColor =
    creditPercent > 50 ? "#B4FF00" : creditPercent > 20 ? "#f59e0b" : "#ff6b7a";

  const linkClass = (active: boolean, disabled?: boolean) =>
    [
      "flex items-center gap-2.5 rounded-lg text-[0.875rem] font-medium transition-all min-h-[44px]",
      collapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5",
      disabled
        ? "opacity-45 cursor-not-allowed text-white/25"
        : active
          ? "text-[#B4FF00] font-bold bg-[#B4FF00]/8 border-b-2 border-[#B4FF00]"
          : "text-white/75 hover:text-white/70 border-b-2 border-transparent",
    ].join(" ");

  return (
    <aside
      className="flex flex-col shrink-0 min-h-screen bg-[#0f0f12] border-r border-white/[0.07] transition-[width] duration-300"
      style={{ width: collapsed ? 64 : 220 }}
    >
      <div
        className="h-14 flex items-center border-b border-white/[0.07] gap-2.5 shrink-0"
        style={{ padding: collapsed ? "0 17px" : "0 20px" }}
      >
        <div className="w-[30px] h-[30px] rounded-lg bg-[#B4FF00] flex items-center justify-center text-[#060608] font-bold shrink-0">
          I
        </div>
        {!collapsed && (
          <span className="text-[1.1rem] tracking-wide text-[#F0EFE8] whitespace-nowrap font-[family-name:var(--font-syne)]">
            Influex<span className="text-[#B4FF00]">AI</span>
          </span>
        )}
      </div>

      <nav className="flex-1 py-2.5 px-2 flex flex-col gap-0.5 overflow-y-auto">
        <SidebarNavLink
          href="/dashboard/agent"
          active={pathname === "/dashboard/agent"}
          collapsed={collapsed}
          title={collapsed ? tNav("agent") : undefined}
          className={linkClass(pathname === "/dashboard/agent")}
        >
          <Star
            size={18}
            strokeWidth={pathname === "/dashboard/agent" ? 2.5 : 2}
            className="shrink-0"
            color={
              pathname === "/dashboard/agent"
                ? "#B4FF00"
                : "rgba(255,255,255,0.75)"
            }
            fill={pathname === "/dashboard/agent" ? "#B4FF00" : "transparent"}
          />
          {!collapsed && (
            <>
              <span className="truncate">{tNav("agent")}</span>
              <span className="ml-auto text-[0.58rem] font-bold text-[#060608] bg-[#B4FF00] px-1.5 py-0.5 rounded-full">
                NEU
              </span>
            </>
          )}
        </SidebarNavLink>

        <div className="h-px bg-white/5 my-2 mx-1" />

        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey} className="mb-2">
            {!collapsed && (
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[rgba(255,255,255,0.65)] px-2.5 py-2">
                {tDash(group.labelKey)}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const isComingSoon =
                item.id === "live-creator" && LIVE_CREATOR_COMING_SOON;
              const label = navItemLabel(item, tNav, tFlows);
              const Icon = item.icon;
              const inner = (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="shrink-0"
                    color={
                      isComingSoon
                        ? "rgba(240,239,232,0.25)"
                        : isActive
                          ? "#B4FF00"
                          : "rgba(255,255,255,0.75)"
                    }
                  />
                  {!collapsed && (
                    <>
                      <span className="truncate">{label}</span>
                      {item.badge && !isComingSoon && (
                        <span className="ml-auto text-[0.58rem] font-bold text-[#060608] bg-[#B4FF00] px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {isComingSoon && (
                        <span className="ml-auto text-[0.58rem] text-white/65">
                          Bald
                        </span>
                      )}
                    </>
                  )}
                </>
              );

              if (isComingSoon) {
                return (
                  <span
                    key={item.id}
                    title={collapsed ? `${label} (bald)` : "Kommt bald"}
                    className={linkClass(false, true)}
                  >
                    {inner}
                  </span>
                );
              }

              return (
                <SidebarNavLink
                  key={item.id}
                  href={item.href}
                  active={isActive}
                  collapsed={collapsed}
                  title={collapsed ? label : undefined}
                  className={linkClass(isActive)}
                >
                  {inner}
                </SidebarNavLink>
              );
            })}
          </div>
        ))}

        <div className="h-px bg-white/5 my-2 mx-1" />

        {!collapsed && (
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[rgba(255,255,255,0.65)] px-2.5 py-2">
            {tNav("more")}
          </p>
        )}
        {EXTRA_NAV.map((item) => {
          const isActive = pathname === item.href;
          const label = tNav(item.labelKey);
          const Icon = item.icon;
          return (
            <SidebarNavLink
              key={item.id}
              href={item.href}
              active={isActive}
              collapsed={collapsed}
              title={collapsed ? label : undefined}
              className={linkClass(isActive)}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 2}
                className="shrink-0"
                color={isActive ? "#B4FF00" : "rgba(255,255,255,0.75)"}
              />
              {!collapsed && label}
            </SidebarNavLink>
          );
        })}

        <div className="h-px bg-white/5 my-2 mx-1" />

        {BOTTOM_NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <SidebarNavLink
              key={item.id}
              href={item.href}
              active={isActive}
              collapsed={collapsed}
              title={collapsed ? tNav(item.labelKey) : undefined}
              className={`${linkClass(isActive)} !text-white/65 !font-normal !border-b-0`}
            >
              {"useGiftIcon" in item && item.useGiftIcon ? (
                <TablerGift
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                  color={isActive ? "#B4FF00" : "rgba(255,255,255,0.75)"}
                  className="shrink-0"
                />
              ) : (
                <span className="shrink-0 text-[0.95rem]">
                  {"emoji" in item ? item.emoji : "💳"}
                </span>
              )}
              {!collapsed && <span>{tNav(item.labelKey)}</span>}
            </SidebarNavLink>
          );
        })}

        {isAdmin && !collapsed && <div className="h-px bg-white/5 my-2 mx-1" />}
        {isAdmin &&
          ADMIN_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarNavLink
                key={item.label}
                href={item.href}
                active={isActive}
                collapsed={collapsed}
                title={collapsed ? item.label : undefined}
                className={`${linkClass(isActive)} !text-[#ff6b7a]/70 !border-b-0`}
              >
                <span className="text-[0.95rem] shrink-0">{item.icon}</span>
                {!collapsed && item.label}
              </SidebarNavLink>
            );
          })}

        {hasAgency && !collapsed && <div className="h-px bg-white/5 my-2 mx-1" />}
        {hasAgency &&
          AGENCY_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarNavLink
                key={item.label}
                href={item.href}
                active={isActive}
                collapsed={collapsed}
                title={collapsed ? item.label : undefined}
                className={`${linkClass(isActive)} !text-[var(--accent)] !font-bold !border-b-0`}
              >
                <span className="text-[0.95rem] shrink-0">{item.icon}</span>
                {!collapsed && item.label}
              </SidebarNavLink>
            );
          })}
      </nav>

      {credits !== null && (
        <LowCreditsSidebar
          credits={credits}
          maxCredits={maxCredits}
          collapsed={collapsed}
        />
      )}

      {!collapsed && (
        <div className="m-2 p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.72rem] text-[rgba(255,255,255,0.65)] font-medium">
              {tNav("credits")}
            </span>
            <AnimatedCredits
              value={credits}
              className="text-[0.78rem] font-bold"
              style={{ color: creditColor }}
            />
          </div>
          <div className="h-1 bg-[#222228] rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${creditPercent}%`, background: creditColor }}
            />
          </div>
          <div className="text-[0.65rem] text-[rgba(255,255,255,0.65)] mb-2.5">
            {tNav("credits_of", { max: maxCredits })}
          </div>
          <a
            href="/dashboard/credits"
            className="block text-center py-1.5 rounded-lg bg-[#B4FF00]/8 border border-[#B4FF00]/18 text-[#B4FF00] text-[0.72rem] font-bold no-underline"
          >
            ⚡ {tNav("top_up")}
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="m-2 mb-2 py-2 rounded-lg border border-white/[0.06] text-[rgba(255,255,255,0.65)] text-xs cursor-pointer"
      >
        {collapsed ? "→" : `← ${tNav("collapse")}`}
      </button>
    </aside>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BarChart2, Home, Images, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LIVE_CREATOR_COMING_SOON } from "@/lib/feature-flags";
import { NAV_GROUPS, SIDEBAR_TOOL_CATEGORIES, sidebarCategoryKeysForPath, type NavItem } from "@/lib/dashboard-flows";
import { getPlanMonthlyCredits } from "@/lib/subscription-plans";
import { hasActivePlan } from "@/lib/access";
import { SidebarNavLink } from "@/components/layout/SidebarNavLink";
import {
  SidebarChoosePlanPanel,
  SidebarCreditsPanel,
} from "@/components/layout/SidebarCreditsPanel";
import { TablerGift } from "@/components/icons/TablerGift";

type ExtraNavItem = {
  id: string;
  href: string;
  icon: typeof BarChart2;
  labelKey: "analytics";
};

const EXTRA_NAV: ExtraNavItem[] = [
  {
    id: "analytics",
    href: "/dashboard/analytics",
    labelKey: "analytics",
    icon: BarChart2,
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
  item: NavItem,
  tNav: ReturnType<typeof useTranslations<"nav">>,
  tFlows: ReturnType<typeof useTranslations<"flows">>
): string {
  if (item.label) return item.label;
  if (item.labelKey === "live_creator") return tNav("live_creator");
  if (item.labelKey === "script") return tFlows("script.title");
  if (item.labelKey === "thumbnail") return tFlows("thumbnail.title");
  if (item.labelKey === "image_generator") return tFlows("image_generator.title");
  if (item.labelKey === "ugc_video") return tFlows("ugcVideo.title");
  if (item.labelKey === "gallery") return tNav("gallery");
  if (item.labelKey === "remix") return tFlows("remix.title");
  if (item.labelKey === "viral_score") return tNav("viral_score");
  if (item.labelKey === "competitor") return tNav("competitor");
  return item.labelKey ?? item.id;
}

const DEFAULT_OPEN: Record<string, boolean> = {
  agent: true,
  text: true,
  video: true,
  bild: true,
  analyze: true,
  live: true,
};

export function DashboardSidebar() {
  const tNav = useTranslations("nav");
  const tFlows = useTranslations("flows");
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>(DEFAULT_OPEN);
  const [credits, setCredits] = useState<number | null>(null);
  const [maxCredits, setMaxCredits] = useState(0);
  const [hasPlatformPlan, setHasPlatformPlan] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAgency, setHasAgency] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    fetch("/api/auth/is-admin")
      .then((r) => r.json())
      .then((d: { isAdmin?: boolean }) => setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    const loadCredits = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("credits, plan, role, is_admin")
        .eq("id", user.id)
        .single();
      if (data) {
        setCredits(data.credits ?? 0);
        const active = hasActivePlan({
          plan: data.plan,
          role: data.role,
          is_admin: data.is_admin,
          email: user.email,
        });
        setHasPlatformPlan(active);
        setMaxCredits(active ? getPlanMonthlyCredits(data.plan) : 0);
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

  useEffect(() => {
    const keys = sidebarCategoryKeysForPath(pathname);
    if (keys.length === 0) return;
    setOpen((prev) => {
      const next = { ...prev };
      for (const key of keys) {
        next[key] = true;
      }
      return next;
    });
  }, [pathname]);

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

  const renderNavItem = (item: NavItem) => {
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
              <span className="ml-auto text-[0.58rem] text-white/65">Bald</span>
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
  };

  const renderCollapseCategory = (
    key: string,
    label: string,
    items: NavItem[],
    showDivider: boolean
  ) => {
    if (collapsed) {
      return items.map((item) => renderNavItem(item));
    }

    return (
      <div
        key={key}
        style={{
          borderTop: showDivider ? "1px solid rgba(255,255,255,0.06)" : undefined,
          margin: showDivider ? "4px 0" : undefined,
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((p) => ({ ...p, [key]: !p[key] }))}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.4)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "inherit",
          }}
        >
          <span>{label}</span>
          <span
            style={{
              fontSize: 10,
              color: "rgba(180,255,0,0.5)",
              transition: "transform 0.2s",
              transform: open[key] ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </span>
        </button>
        {open[key] && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              paddingBottom: 8,
            }}
          >
            {items.map((item) => renderNavItem(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className="flex flex-col shrink-0 min-h-screen bg-[#0f0f12] border-r border-white/[0.07] transition-[width] duration-300"
      style={{ width: collapsed ? 64 : 220 }}
    >
      <Link
        href="/dashboard"
        className="h-14 flex items-center border-b border-white/[0.07] gap-2.5 shrink-0 no-underline hover:opacity-90 transition-opacity"
        style={{ padding: collapsed ? "0 17px" : "0 20px" }}
        aria-label={tNav("dashboard")}
      >
        <div className="w-[30px] h-[30px] rounded-lg bg-[#B4FF00] flex items-center justify-center text-[#060608] font-bold shrink-0">
          I
        </div>
        {!collapsed && (
          <span className="text-[1.1rem] tracking-wide text-[#F0EFE8] whitespace-nowrap font-[family-name:var(--font-syne)]">
            Influex<span className="text-[#B4FF00]">AI</span>
          </span>
        )}
      </Link>

      <nav className="flex-1 py-2.5 px-2 flex flex-col gap-0.5 overflow-y-auto">
        <SidebarNavLink
          href="/dashboard"
          active={pathname === "/dashboard" || pathname === "/dashboard/agent"}
          collapsed={collapsed}
          title={collapsed ? tNav("agent") : undefined}
          className={linkClass(
            pathname === "/dashboard" || pathname === "/dashboard/agent"
          )}
        >
          <Star
            size={18}
            strokeWidth={
              pathname === "/dashboard" || pathname === "/dashboard/agent"
                ? 2.5
                : 2
            }
            className="shrink-0"
            color={
              pathname === "/dashboard" || pathname === "/dashboard/agent"
                ? "#B4FF00"
                : "rgba(255,255,255,0.75)"
            }
            fill={
              pathname === "/dashboard" || pathname === "/dashboard/agent"
                ? "#B4FF00"
                : "transparent"
            }
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

        <SidebarNavLink
          href="/dashboard/gallery"
          active={pathname === "/dashboard/gallery"}
          collapsed={collapsed}
          title={collapsed ? tNav("gallery") : undefined}
          className={linkClass(pathname === "/dashboard/gallery")}
        >
          <Images
            size={18}
            strokeWidth={pathname === "/dashboard/gallery" ? 2.5 : 2}
            className="shrink-0"
            color={
              pathname === "/dashboard/gallery"
                ? "#B4FF00"
                : "rgba(255,255,255,0.75)"
            }
          />
          {!collapsed && <span className="truncate">{tNav("gallery")}</span>}
        </SidebarNavLink>

        <div className="h-px bg-white/5 my-2 mx-1" />

        {!collapsed && (
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[rgba(255,255,255,0.65)] px-2.5 py-2">
            Tools
          </p>
        )}

        {SIDEBAR_TOOL_CATEGORIES.map((category, index) =>
          renderCollapseCategory(
            category.key,
            category.label,
            category.items,
            index > 0
          )
        )}

        {NAV_GROUPS.map((group) =>
          renderCollapseCategory(group.key, group.label, group.items, true)
        )}

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

      {credits !== null && !collapsed && !hasPlatformPlan && (
        <SidebarChoosePlanPanel />
      )}
      {credits !== null && !collapsed && hasPlatformPlan && (
        <SidebarCreditsPanel credits={credits} maxCredits={maxCredits} />
      )}

      <SidebarNavLink
        href="/"
        active={false}
        collapsed={collapsed}
        title={collapsed ? tNav("view_website") : undefined}
        className={`${linkClass(false)} !text-white/50 !font-normal !border-b-0 mb-1`}
      >
        <Home
          size={18}
          strokeWidth={2}
          className="shrink-0"
          color="rgba(255,255,255,0.5)"
        />
        {!collapsed && <span>{tNav("view_website")}</span>}
      </SidebarNavLink>

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

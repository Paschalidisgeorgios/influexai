"use client";

/**
 * DashboardShell — Haupt-Layout-Wrapper.
 *
 * ROUTING-LOGIK:
 * - Legacy-Routen (Settings, Credits, Analytics…) → StudioChrome-Wrapper (Header + Sidebar)
 * - Tool-Routen → neues DashboardLayout (Krea-Ästhetik)
 * - Content-Mode (kein Tool) → DashboardLayout
 */

import { usePathname } from "next/navigation";
import { BuyCreditsProvider } from "@/components/credits/BuyCreditsProvider";
import { PlanGateProvider } from "@/components/plan-gate/PlanGateProvider";
import { DashboardToolProvider } from "@/contexts/DashboardToolContext";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { DashboardLayout } from "./DashboardLayout";
import "@/styles/studio-glass.css";

// Legacy-Routen erhalten das alte Studio-Chrome-Layout (Header, Sidebar, Scrollbar)
const LEGACY_CHILD_ROUTES = [
  "/dashboard/settings",
  "/dashboard/credits",
  "/dashboard/admin",
  "/dashboard/agency",
  "/dashboard/analytics",
  "/dashboard/white-label",
  "/dashboard/referral",
  "/dashboard/profile",
  "/dashboard/api",
];

interface DashboardShellProps {
  children?: React.ReactNode;
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BuyCreditsProvider>
      <PlanGateProvider>
        <DashboardToolProvider>
          <DashboardProvider>{children}</DashboardProvider>
        </DashboardToolProvider>
      </PlanGateProvider>
    </BuyCreditsProvider>
  );
}

function LegacyChrome({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "#0A0A0A", color: "white" }}
    >
      {/* Minimale Legacy-Navigation */}
      <aside
        className="fixed left-0 top-0 z-20 flex h-screen w-[260px] flex-col"
        style={{ background: "#111111", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="px-5 pt-5">
          <a href="/dashboard" className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "#ccff00" }}
            >
              <span className="text-[10px] font-black text-black">IX</span>
            </div>
            <span className="text-[13px] font-semibold tracking-wide text-white">
              INFLUEX<span style={{ color: "#ccff00" }}>AI</span>
            </span>
          </a>
        </div>
        <div className="flex-1" />
        <div className="px-5 py-4">
          <a
            href="/dashboard"
            className="block text-[12px] text-white/40 hover:text-white/70"
          >
            ← Zurück zum Dashboard
          </a>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-[260px] flex-1 overflow-y-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const showLegacy = LEGACY_CHILD_ROUTES.some((p) => pathname.startsWith(p));

  if (showLegacy) {
    return (
      <Providers>
        <LegacyChrome>{children}</LegacyChrome>
      </Providers>
    );
  }

  // Alle Tool-Seiten + Übersicht → neues Krea-Layout
  return (
    <Providers>
      <DashboardLayout />
    </Providers>
  );
}

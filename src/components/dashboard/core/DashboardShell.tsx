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
import { DashboardStandaloneChrome } from "./DashboardStandaloneChrome";
import "@/styles/studio-glass.css";

// Routen mit eigenem Seiteninhalt + gemeinsamer Dashboard-Navigation
const STANDALONE_CHILD_ROUTES = [
  "/dashboard/settings",
  "/dashboard/credits",
  "/dashboard/gallery",
  "/dashboard/ki-agent",
  "/dashboard/admin",
  "/dashboard/agency",
  "/dashboard/analytics",
  "/dashboard/white-label",
  "/dashboard/referral",
  "/dashboard/profile",
  "/dashboard/api",
  "/dashboard/design-preview",
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
  return <DashboardStandaloneChrome>{children}</DashboardStandaloneChrome>;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const showStandalone = STANDALONE_CHILD_ROUTES.some((p) => pathname.startsWith(p));

  if (showStandalone) {
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

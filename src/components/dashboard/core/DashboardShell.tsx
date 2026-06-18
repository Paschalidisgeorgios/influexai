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
import { DashboardStudioSpa } from "./DashboardStudioSpa";
import { DashboardLayout } from "./DashboardLayout";
import { DashboardStandaloneChrome } from "./DashboardStandaloneChrome";
import { LegacyToolRedirect } from "./LegacyToolRedirect";
import { resolveLaunchToolFromPath } from "./production-tool-routes";
import "@/styles/studio-glass.css";

// Routen mit eigenem Seiteninhalt + gemeinsamer Dashboard-Navigation
const STANDALONE_CHILD_ROUTES = [
  "/dashboard/settings",
  "/dashboard/credits",
  "/dashboard/gallery",
  "/dashboard/ai-creator",
  "/dashboard/campaigns",
  "/dashboard/brand-kit",
  "/dashboard/ki-agent",
  "/dashboard/admin",
  "/dashboard/agency",
  "/dashboard/analytics",
  "/dashboard/white-label",
  "/dashboard/referral",
  "/dashboard/profile",
  "/dashboard/api",
];

/** Design preview — isolated fullscreen mock, no production chrome */
const PREVIEW_ONLY_ROUTES = ["/dashboard/design-preview"];

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

  if (PREVIEW_ONLY_ROUTES.some((p) => pathname.startsWith(p))) {
    return <Providers>{children}</Providers>;
  }

  const isStudioSpa = pathname === "/dashboard" || pathname === "/dashboard/";

  if (isStudioSpa) {
    return (
      <Providers>
        <DashboardStudioSpa />
      </Providers>
    );
  }

  const legacyLaunchTool = resolveLaunchToolFromPath(pathname);
  if (legacyLaunchTool) {
    return (
      <Providers>
        <LegacyToolRedirect toolId={legacyLaunchTool} />
      </Providers>
    );
  }

  const showStandalone = STANDALONE_CHILD_ROUTES.some((p) => pathname.startsWith(p));

  if (showStandalone || pathname.startsWith("/dashboard/")) {
    return (
      <Providers>
        <LegacyChrome>{children}</LegacyChrome>
      </Providers>
    );
  }

  return (
    <Providers>
      <DashboardLayout />
    </Providers>
  );
}

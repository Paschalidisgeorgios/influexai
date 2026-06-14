"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import "@/styles/studio-glass.css";
import { BuyCreditsProvider } from "@/components/credits/BuyCreditsProvider";
import { PlanGateProvider } from "@/components/plan-gate/PlanGateProvider";
import { DashboardToolProvider } from "@/contexts/DashboardToolContext";
import { resolveToolIdFromPath } from "@/lib/canvas/toolApiSchema";
import { useCanvasStore } from "@/lib/canvas/canvas-store";
import { CanvasSidebar } from "./CanvasSidebar";
import { CanvasMobileNav } from "./CanvasMobileNav";
import { CanvasHeader } from "./CanvasHeader";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { OnboardingAgentShell } from "./onboarding/OnboardingAgentShell";
import { PipelineProvider } from "./PipelineProvider";

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

interface CanvasShellProps {
  children?: React.ReactNode;
}

function ShellProviders({ children }: { children: React.ReactNode }) {
  return (
    <BuyCreditsProvider>
      <PlanGateProvider>
        <DashboardToolProvider>{children}</DashboardToolProvider>
      </PlanGateProvider>
    </BuyCreditsProvider>
  );
}

function StudioChrome({
  children,
  mainClassName,
}: {
  children: React.ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-x-clip overflow-y-hidden bg-[#050505] text-white">
      <div className="studio-glass-dot-grid studio-glass-glow-host relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="glass-ambient-layer" aria-hidden>
          <div className="glass-ambient-glow glass-ambient-glow--violet" />
          <div className="glass-ambient-glow glass-ambient-glow--green" />
        </div>
        <div className="studio-glass-glow studio-glass-glow--violet pointer-events-none" aria-hidden />
        <div className="studio-glass-glow studio-glass-glow--green pointer-events-none" aria-hidden />
        <CanvasHeader />
        <div className="relative z-[1] flex min-h-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <CanvasSidebar />
          <div className={`relative min-h-0 min-w-0 flex-1 ${mainClassName ?? "overflow-hidden"}`}>
            {children}
          </div>
          <CanvasMobileNav />
        </div>
      </div>
    </div>
  );
}

export function CanvasShell({ children }: CanvasShellProps) {
  const pathname = usePathname();
  const spawnControlNode = useCanvasStore((s) => s.spawnControlNode);
  const lastSpawned = useRef<string | null>(null);

  const showLegacy = LEGACY_CHILD_ROUTES.some((p) => pathname.startsWith(p));
  const canvasToolId = showLegacy ? null : resolveToolIdFromPath(pathname);
  const showContentMode = !showLegacy && !canvasToolId;

  useEffect(() => {
    if (showLegacy || showContentMode) return;
    const toolId = resolveToolIdFromPath(pathname);
    if (!toolId || lastSpawned.current === `${pathname}-${toolId}`) return;
    lastSpawned.current = `${pathname}-${toolId}`;
    spawnControlNode(toolId);
  }, [pathname, showLegacy, showContentMode, spawnControlNode]);

  if (showLegacy) {
    return (
      <ShellProviders>
        <StudioChrome mainClassName="overflow-y-auto">
          <div className="studio-glass-legacy-content min-h-full px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
            {children}
          </div>
        </StudioChrome>
      </ShellProviders>
    );
  }

  if (showContentMode) {
    return (
      <ShellProviders>
        <StudioChrome mainClassName="overflow-y-auto">
          <div className="studio-glass-legacy-content min-h-full px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
            {children}
          </div>
        </StudioChrome>
      </ShellProviders>
    );
  }

  return (
    <ShellProviders>
      <ReactFlowProvider>
        <OnboardingAgentShell>
          <PipelineProvider>
            <StudioChrome>
              <InfiniteCanvas />
            </StudioChrome>
          </PipelineProvider>
        </OnboardingAgentShell>
      </ReactFlowProvider>
    </ShellProviders>
  );
}

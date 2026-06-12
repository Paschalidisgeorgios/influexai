"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardMobileSidebar } from "@/components/layout/DashboardMobileSidebar";
import { DashboardShell } from "@/components/dashboard-shell";
import { GlobalSentientBadge } from "@/components/dashboard/GlobalSentientBadge";
import { BuyCreditsProvider } from "@/components/credits/BuyCreditsProvider";
import { PlanGateProvider } from "@/components/plan-gate/PlanGateProvider";
import { PushPermission } from "@/components/ui/PushPermission";
import { DashboardToolProvider } from "@/contexts/DashboardToolContext";

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <BuyCreditsProvider>
      <DashboardToolProvider>
        <div
          className="flex h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#060608] min-w-0 max-w-[100vw]"
          data-dashboard
        >
          <GlobalSentientBadge />
          <div className="hidden md:flex shrink-0">
            <DashboardSidebar />
          </div>
          <DashboardMobileSidebar
            open={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
          <DashboardShell onMobileMenuToggle={() => setMobileSidebarOpen(true)}>
            <PlanGateProvider>{children}</PlanGateProvider>
            <PushPermission />
          </DashboardShell>
        </div>
      </DashboardToolProvider>
    </BuyCreditsProvider>
  );
}

"use client";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardShell } from "@/components/dashboard-shell";
import { PlanGateProvider } from "@/components/plan-gate/PlanGateProvider";
import { PushPermission } from "@/components/ui/PushPermission";

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#060608]" data-dashboard>
      <div className="hidden md:flex shrink-0">
        <DashboardSidebar />
      </div>
      <DashboardShell>
        <PlanGateProvider>{children}</PlanGateProvider>
        <PushPermission />
      </DashboardShell>
    </div>
  );
}

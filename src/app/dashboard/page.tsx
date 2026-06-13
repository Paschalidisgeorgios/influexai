"use client";

import { DashboardCheckoutSuccess } from "@/components/credits/DashboardCheckoutSuccess";
import { AgentAutopilotHero } from "@/components/dashboard/AgentAutopilotHero";
import { DashboardHomeToolGrid } from "@/components/dashboard/DashboardHomeToolGrid";
import { DynamicDashboardEngine } from "@/components/dashboard/DynamicDashboardEngine";

export default function DashboardPage() {
  return (
    <DynamicDashboardEngine toolId="agent-autopilot" className="mx-auto w-full max-w-6xl flex-1">
      <div className="mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden px-4 pb-8">
        <DashboardCheckoutSuccess />
        <AgentAutopilotHero />
        <DashboardHomeToolGrid />
      </div>
    </DynamicDashboardEngine>
  );
}

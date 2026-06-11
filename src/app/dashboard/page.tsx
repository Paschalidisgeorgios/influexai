"use client";

import { DashboardCheckoutSuccess } from "@/components/credits/DashboardCheckoutSuccess";
import { AgentAutopilotHero } from "@/components/dashboard/AgentAutopilotHero";
import { DashboardHomeToolGrid } from "@/components/dashboard/DashboardHomeToolGrid";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-6xl flex-1 flex-col overflow-x-hidden overflow-y-auto px-4 pb-8">
      <DashboardCheckoutSuccess />
      <AgentAutopilotHero />
      <DashboardHomeToolGrid />
    </div>
  );
}

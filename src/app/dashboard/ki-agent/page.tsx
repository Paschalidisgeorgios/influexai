"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AgentAutopilotChat } from "@/components/agent/AgentAutopilotChat";
import { DynamicDashboardEngine } from "@/components/dashboard/DynamicDashboardEngine";
import { useDashboardTool } from "@/contexts/DashboardToolContext";
import { useEffect } from "react";

function KiAgentPageInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt")?.trim() ?? "";
  const { setPrompt } = useDashboardTool();

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt, setPrompt]);

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] min-h-0 w-full max-w-3xl flex-col md:h-full md:px-0 md:py-6">
      <AgentAutopilotChat initialPrompt={initialPrompt} />
    </div>
  );
}

export default function KiAgentPage() {
  return (
    <DynamicDashboardEngine toolId="agent-autopilot">
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-white/50">
            Agent Autopilot wird geladen…
          </div>
        }
      >
        <KiAgentPageInner />
      </Suspense>
    </DynamicDashboardEngine>
  );
}

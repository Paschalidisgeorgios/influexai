"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AgentAutopilotChat } from "@/components/agent/AgentAutopilotChat";

function KiAgentPageInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt")?.trim() ?? "";

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col px-4 py-6 md:px-6">
      <AgentAutopilotChat initialPrompt={initialPrompt} />
    </div>
  );
}

export default function KiAgentPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-white/50">
          Agent Autopilot wird geladen…
        </div>
      }
    >
      <KiAgentPageInner />
    </Suspense>
  );
}

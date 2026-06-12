"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AgentAutopilotChat } from "@/components/agent/AgentAutopilotChat";
import { useDashboardTool } from "@/contexts/DashboardToolContext";

function KiAgentChatInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt")?.trim() ?? "";
  const { setPrompt } = useDashboardTool();

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt, setPrompt]);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col bg-[#08080a] md:py-4">
      <AgentAutopilotChat initialPrompt={initialPrompt} />
    </div>
  );
}

export default function KiAgentChatPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-white/50">
          Agent Chat wird geladen…
        </div>
      }
    >
      <KiAgentChatInner />
    </Suspense>
  );
}

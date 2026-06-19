"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  loadAgentToolHandoff,
  parseHandoffSearchParams,
  resolveAgentToolHandoff,
  type AgentToolHandoff,
} from "@/lib/tools/agent-tool-handoff";

export function useAgentToolHandoff(expectedToolId?: string): AgentToolHandoff | null {
  const searchParams = useSearchParams();

  return useMemo(() => {
    if (!expectedToolId) return null;

    const { fromAgent, handoffId, goalFallback } = parseHandoffSearchParams(
      searchParams
    );

    if (!fromAgent) return null;

    const stored = handoffId ? loadAgentToolHandoff(handoffId) : null;

    return resolveAgentToolHandoff(
      handoffId,
      goalFallback,
      expectedToolId,
      stored
    );
  }, [searchParams, expectedToolId]);
}

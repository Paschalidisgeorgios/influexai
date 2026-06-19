"use client";

import { useMemo } from "react";
import type { AgentPreparedInputs } from "@/lib/tools/agent-prepared-inputs";
import {
  buildToolActionReadiness,
  type ToolActionReadiness,
  type ToolLocalInputState,
} from "@/lib/tools/tool-action-readiness";
import { useAgentPreparedInputs } from "@/hooks/useAgentPreparedInputs";

export function useToolActionReadinessFromPrepared(
  prepared: AgentPreparedInputs | null,
  local: ToolLocalInputState = {}
): ToolActionReadiness | null {
  return useMemo(() => {
    if (!prepared) return null;
    return buildToolActionReadiness(prepared, local);
  }, [prepared, local]);
}

export function useToolActionReadiness(
  expectedToolId: string,
  local: ToolLocalInputState = {}
): ToolActionReadiness | null {
  const prepared = useAgentPreparedInputs(expectedToolId);
  return useToolActionReadinessFromPrepared(prepared, local);
}

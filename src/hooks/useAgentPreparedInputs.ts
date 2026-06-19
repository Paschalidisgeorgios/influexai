"use client";

import { useMemo } from "react";
import {
  buildAgentPreparedInputsOrNull,
  type AgentPreparedInputs,
} from "@/lib/tools/agent-prepared-inputs";
import { useAgentToolHandoff } from "@/hooks/useAgentToolHandoff";

export function useAgentPreparedInputs(
  expectedToolId?: string
): AgentPreparedInputs | null {
  const handoff = useAgentToolHandoff(expectedToolId);

  return useMemo(
    () => buildAgentPreparedInputsOrNull(handoff),
    [handoff]
  );
}

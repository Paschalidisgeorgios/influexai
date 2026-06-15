"use client";

import { Loader2 } from "lucide-react";
import type { AgentMetaToolName, AgentToolName } from "@/lib/agent/types";
import { AGENT_TOOL_WORKING_LABELS } from "@/lib/agent/tool-labels";

type Props = {
  tool: AgentToolName | AgentMetaToolName | null;
  fallbackLabel?: string;
};

export function AgentWorkingStatus({ tool, fallbackLabel }: Props) {
  const label =
    (tool && tool in AGENT_TOOL_WORKING_LABELS
      ? AGENT_TOOL_WORKING_LABELS[tool as AgentToolName]
      : undefined) ||
    fallbackLabel ||
    "Agent arbeitet…";

  if (!tool && !fallbackLabel) return null;

  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-[var(--accent,#B4FF00)]/30 bg-[var(--accent,#B4FF00)]/8 px-3 py-2.5 text-xs font-medium text-[var(--accent,#B4FF00)]"
      role="status"
      aria-live="polite"
    >
      <Loader2 size={14} className="shrink-0 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

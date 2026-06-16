"use client";

import { Loader2 } from "lucide-react";
import type { AgentMetaToolName, AgentToolName } from "@/lib/agent/types";
import { AGENT_TOOL_WORKING_LABELS } from "@/lib/agent/tool-labels";

type Props = {
  tool: AgentToolName | AgentMetaToolName | null;
  fallbackLabel?: string;
  variant?: "dark" | "light";
};

export function AgentWorkingStatus({ tool, fallbackLabel, variant = "dark" }: Props) {
  const label =
    (tool && tool in AGENT_TOOL_WORKING_LABELS
      ? AGENT_TOOL_WORKING_LABELS[tool as AgentToolName]
      : undefined) ||
    fallbackLabel ||
    "Agent arbeitet…";

  if (!tool && !fallbackLabel) return null;

  const textColor =
    variant === "light" ? "rgba(8,8,8,0.72)" : "var(--accent,#B4FF00)";

  return (
    <div
      className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium"
      style={{
        borderColor: "rgba(180,255,0,0.28)",
        background: "rgba(180,255,0,0.10)",
        color: textColor,
      }}
      role="status"
      aria-live="polite"
    >
      <Loader2 size={14} className="shrink-0 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

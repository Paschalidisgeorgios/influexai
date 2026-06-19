"use client";

import {
  STUDIO_PROVIDER_DISABLED_HINT,
  STUDIO_SHELL_ONLY_HINT,
} from "@/lib/tools/studio-tool-registry";
import { getProviderDisabledAgentMessage } from "@/lib/tools/agent-tool-capability-map";
import { DASHBOARD_TEXT } from "@/components/dashboard/core/DashboardSurface";

type ToolExecutionDisabledNoticeProps = {
  variant?: "provider_disabled" | "shell_only";
  message?: string;
  toolId?: string;
};

export function ToolExecutionDisabledNotice({
  variant = "provider_disabled",
  message,
  toolId,
}: ToolExecutionDisabledNoticeProps) {
  const text =
    message ??
    (toolId
      ? getProviderDisabledAgentMessage(toolId)
      : variant === "shell_only"
        ? STUDIO_SHELL_ONLY_HINT
        : STUDIO_PROVIDER_DISABLED_HINT);

  return (
    <p
      className="mb-6 rounded-lg border px-3 py-2 text-xs leading-relaxed"
      style={{
        borderColor: "rgba(180,255,0,0.2)",
        color: DASHBOARD_TEXT,
      }}
      role="status"
      data-testid="tool-execution-disabled-notice"
    >
      {text}
    </p>
  );
}

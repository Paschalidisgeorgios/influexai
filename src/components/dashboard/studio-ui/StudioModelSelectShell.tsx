"use client";

import {
  type StudioModelDefinition,
  type StudioToolDefinition,
} from "@/lib/tools/studio-tool-registry";
import { DASHBOARD_MUTED } from "@/components/dashboard/core/DashboardSurface";
import { StudioFieldLabel, StudioSelect } from "./StudioField";
import { ToolExecutionDisabledNotice } from "./ToolExecutionDisabledNotice";

type StudioModelSelectShellProps = {
  tool: StudioToolDefinition | undefined;
  models: StudioModelDefinition[];
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  showProviderHint?: boolean;
  toolId?: string;
};

export function StudioModelSelectShell({
  tool,
  models,
  selectedModelId,
  onModelChange,
  showProviderHint = true,
  toolId,
}: StudioModelSelectShellProps) {  if (!tool || models.length === 0) return null;

  const selected = models.find((m) => m.id === selectedModelId) ?? models[0];

  return (
    <div
      className="mb-6 space-y-3 rounded-xl border p-4"
      style={{ borderColor: "rgba(255,255,255,0.1)" }}
    >
      <div>
        <StudioFieldLabel>Modell</StudioFieldLabel>
        <StudioSelect
          value={selectedModelId || models[0]?.id || ""}
          onChange={(event) => onModelChange(event.target.value)}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label} · {model.creditEstimate}
            </option>
          ))}
        </StudioSelect>
      </div>

      {selected ? (
        <p className="text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          {selected.notes ?? selected.label}
          {selected.supports.length ? ` · ${selected.supports.join(", ")}` : ""}
        </p>
      ) : null}

      {showProviderHint &&
      (tool.providerExecution === "disabled" ||
        tool.providerExecution === "shell_only") ? (
        <ToolExecutionDisabledNotice
          toolId={toolId ?? String(tool.id)}
          variant={
            tool.status === "shell" ? "shell_only" : "provider_disabled"
          }
        />      ) : null}
    </div>
  );
}

/** Alias for spec naming — same component */
export const ToolModelSelector = StudioModelSelectShell;

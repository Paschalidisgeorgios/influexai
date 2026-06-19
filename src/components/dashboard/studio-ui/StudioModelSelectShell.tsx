"use client";

import {
  STUDIO_PROVIDER_DISABLED_HINT,
  type StudioModelDefinition,
  type StudioToolDefinition,
} from "@/lib/tools/studio-tool-registry";
import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "@/components/dashboard/core/DashboardSurface";
import { StudioFieldLabel, StudioSelect } from "./StudioField";

type StudioModelSelectShellProps = {
  tool: StudioToolDefinition | undefined;
  models: StudioModelDefinition[];
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  showProviderHint?: boolean;
};

export function StudioModelSelectShell({
  tool,
  models,
  selectedModelId,
  onModelChange,
  showProviderHint = true,
}: StudioModelSelectShellProps) {
  if (!tool || models.length === 0) return null;

  const selected = models.find((m) => m.id === selectedModelId) ?? models[0];

  return (
    <div
      className="space-y-3 rounded-xl border p-4"
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
          {selected.providerLabel} · {selected.capability}
          {selected.supports.length ? ` · ${selected.supports.join(", ")}` : ""}
          {selected.notes ? ` — ${selected.notes}` : ""}
        </p>
      ) : null}

      {showProviderHint &&
      (tool.providerExecution === "disabled" ||
        tool.providerExecution === "shell_only") ? (
        <p
          className="rounded-lg border px-3 py-2 text-xs leading-relaxed"
          style={{
            borderColor: "rgba(180,255,0,0.2)",
            color: DASHBOARD_TEXT,
          }}
        >
          {STUDIO_PROVIDER_DISABLED_HINT}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import type { StudioToolStatus } from "@/lib/tools/studio-tool-registry";
import { STUDIO_STATUS_LABELS } from "@/lib/tools/studio-tool-registry";
import type { AgentToolCapability } from "@/lib/tools/agent-tool-capability-map";
import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "@/components/dashboard/core/DashboardSurface";
import type { AgentToolHandoff } from "@/lib/tools/agent-tool-handoff";
import { AgentHandoffPanel } from "./AgentHandoffPanel";
import { StudioCreditNote, StudioCreditPill } from "./StudioCreditPill";
import { StudioPageHeader } from "./StudioPageHeader";
import { StudioPanel } from "./StudioPanel";

type ToolWorkspaceShellProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  status?: StudioToolStatus;
  creditLabel?: string;
  creditNote?: string;
  capability?: AgentToolCapability;
  agentHandoff?: AgentToolHandoff | null;
  executionNotice?: ReactNode;
  modelSelector?: ReactNode;
  options?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
};

function CapabilityList({
  title,
  items,
}: {
  title: string;
  items: { id: string; label: string; description?: string }[] | string[];
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p
        className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: DASHBOARD_MUTED }}
      >
        {title}
      </p>
      <ul className="space-y-1 text-xs leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
        {items.map((item) => {
          const key = typeof item === "string" ? item : item.id;
          const label = typeof item === "string" ? item : item.label;
          return (
            <li key={key} className="list-inside list-disc">
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ToolWorkspaceShell({
  kicker = "Tool",
  title,
  subtitle,
  status,
  creditLabel,
  creditNote,
  capability,
  agentHandoff,
  executionNotice,
  modelSelector,
  options,
  actions,
  footer,
}: ToolWorkspaceShellProps) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-8">
      <StudioPageHeader
        kicker={kicker}
        title={title}
        subtitle={subtitle ?? capability?.useCases[0]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {status ? (
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: DASHBOARD_MUTED,
                }}
              >
                {STUDIO_STATUS_LABELS[status]}
              </span>
            ) : null}
            {creditLabel ? <StudioCreditPill label={creditLabel} /> : null}
          </div>
        }
      />

      <StudioPanel>
        {creditNote ? <StudioCreditNote className="mb-6">{creditNote}</StudioCreditNote> : null}
        {agentHandoff ? <AgentHandoffPanel handoff={agentHandoff} /> : null}
        {modelSelector}
        {executionNotice}
        {capability ? (
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <CapabilityList title="Benötigt" items={capability.requiredInputs} />
            <CapabilityList title="Ergebnis" items={capability.outputs} />
            {capability.optionalInputs.length > 0 ? (
              <div className="sm:col-span-2">
                <CapabilityList title="Optional" items={capability.optionalInputs} />
              </div>
            ) : null}
            {capability.recommendedAspectRatios.length > 0 ? (
              <p className="sm:col-span-2 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
                Empfohlene Formate: {capability.recommendedAspectRatios.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
        {options}
        {actions}
        {footer}
      </StudioPanel>
    </div>
  );
}

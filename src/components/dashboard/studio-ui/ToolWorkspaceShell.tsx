"use client";

import type { ReactNode } from "react";
import type { StudioToolStatus } from "@/lib/tools/studio-tool-registry";
import { STUDIO_STATUS_LABELS } from "@/lib/tools/studio-tool-registry";
import { DASHBOARD_MUTED } from "@/components/dashboard/core/DashboardSurface";
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
  executionNotice?: ReactNode;
  modelSelector?: ReactNode;
  options?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
};

export function ToolWorkspaceShell({
  kicker = "Tool",
  title,
  subtitle,
  status,
  creditLabel,
  creditNote,
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
        subtitle={subtitle}
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
        {modelSelector}
        {executionNotice}
        {options}
        {actions}
        {footer}
      </StudioPanel>
    </div>
  );
}

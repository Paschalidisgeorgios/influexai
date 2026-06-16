"use client";

import Link from "next/link";
import type { ToolId } from "./DashboardLayout";
import { DASHBOARD_MUTED } from "./DashboardSurface";
import {
  buildAgentPrepareHref,
  getSetupCreditLabel,
  getToolSetupSubtitle,
  SETUP_COPY,
} from "./production-tool-setup-ui";
import { getToolDisplayLabel, resolveToolRoute } from "./production-tool-routes";
import {
  StudioActionBar,
  StudioCreditNote,
  StudioCreditPill,
  StudioPageHeader,
  StudioPanel,
} from "../studio-ui";

export function ProductionToolLaunch({
  toolId,
}: {
  toolId: ToolId;
  onOpenDedicated?: (id: ToolId) => void;
}) {
  const creditLabel = getSetupCreditLabel(toolId);
  const label = getToolDisplayLabel(toolId);
  const subtitle = getToolSetupSubtitle(toolId);
  const dedicatedRoute = resolveToolRoute(toolId);
  const agentHref = buildAgentPrepareHref(toolId, {});

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-8">
      <StudioPageHeader
        kicker="Tool"
        title={label}
        subtitle={subtitle}
        action={<StudioCreditPill label={creditLabel} />}
      />

      <StudioPanel>
        <StudioCreditNote className="mb-6">{SETUP_COPY.creditsBeforeStart}</StudioCreditNote>

        <StudioActionBar
          primaryLabel={SETUP_COPY.agentPrimary}
          primaryHref={agentHref}
          secondaryLabel="Alle Tools"
          secondaryHref="/dashboard?tool=tools"
        />

        {dedicatedRoute ? (
          <p className="mt-6 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
            Direkt starten — vollständiges Setup folgt im nächsten Schritt.
          </p>
        ) : null}
      </StudioPanel>
    </div>
  );
}

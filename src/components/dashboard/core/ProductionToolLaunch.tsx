"use client";

import type { ToolId } from "./DashboardLayout";
import { DASHBOARD_MUTED } from "./DashboardSurface";
import {
  getToolSetupTitle,
  INACTIVE_AGENT_HREF,
  NON_MVP_SETUP_COPY,
} from "./production-tool-setup-ui";
import {
  StudioActionBar,
  StudioPageHeader,
  StudioPanel,
} from "../studio-ui";
import { STUDIO_TEXT } from "../studio-ui/tokens";

export function ProductionToolLaunch({
  toolId,
}: {
  toolId: ToolId;
  onOpenDedicated?: (id: ToolId) => void;
}) {
  const toolLabel = getToolSetupTitle(toolId);

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-8">
      <StudioPageHeader
        kicker="Tool"
        title={toolLabel}
        subtitle={NON_MVP_SETUP_COPY.headerSubline}
      />

      <StudioPanel>
        <h2
          className="text-lg font-semibold tracking-tight"
          style={{ color: STUDIO_TEXT }}
        >
          {NON_MVP_SETUP_COPY.headline}
        </h2>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          {NON_MVP_SETUP_COPY.body}
        </p>

        <StudioActionBar
          className="mt-6"
          primaryLabel={NON_MVP_SETUP_COPY.primaryCta}
          primaryHref="/dashboard?tool=tools"
          secondaryLabel={NON_MVP_SETUP_COPY.secondaryCta}
          secondaryHref={INACTIVE_AGENT_HREF}
        />
      </StudioPanel>
    </div>
  );
}

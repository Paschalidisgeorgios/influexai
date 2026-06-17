"use client";

import type { ToolId } from "./DashboardLayout";
import {
  buildAgentPrepareHref,
  getToolSetupTitle,
  NON_MVP_SETUP_COPY,
} from "./production-tool-setup-ui";
import {
  StudioActionBar,
  StudioPageHeader,
  StudioPanel,
} from "../studio-ui";

export function ProductionToolLaunch({
  toolId,
}: {
  toolId: ToolId;
  onOpenDedicated?: (id: ToolId) => void;
}) {
  const toolLabel = getToolSetupTitle(toolId);
  const agentHref = buildAgentPrepareHref(toolId, {});

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-8">
      <StudioPageHeader
        kicker={toolLabel}
        title={NON_MVP_SETUP_COPY.headline}
        subtitle={NON_MVP_SETUP_COPY.body}
      />

      <StudioPanel>
        <StudioActionBar
          primaryLabel={NON_MVP_SETUP_COPY.primaryCta}
          primaryHref="/dashboard?tool=tools"
          secondaryLabel={NON_MVP_SETUP_COPY.secondaryCta}
          secondaryHref={agentHref}
        />
      </StudioPanel>
    </div>
  );
}

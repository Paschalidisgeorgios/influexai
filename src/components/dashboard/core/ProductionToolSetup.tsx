"use client";

import Link from "next/link";
import type { ToolId } from "./DashboardLayout";
import { DASHBOARD_MUTED } from "./DashboardSurface";
import { useAgentToolHandoff } from "@/hooks/useAgentToolHandoff";
import { ProductionToolSetupBody } from "./ProductionToolSetupBody";
import {
  GALLERY_PERSISTED_TOOL_IDS,
  getSetupCreditLabel,
  getToolSetupCategory,
  getToolSetupSubtitle,
  getToolSetupTitle,
  SETUP_COPY,
} from "./production-tool-setup-ui";
import {
  StudioCreditNote,
  StudioCreditPill,
  ToolSetupContext,
  ToolSetupLayout,
  ToolSetupSurface,
  AgentHandoffPanel,
} from "../studio-ui";

export function ProductionToolSetup({ toolId }: { toolId: ToolId }) {
  const creditLabel = getSetupCreditLabel(toolId);
  const agentHandoff = useAgentToolHandoff(String(toolId));

  return (
    <div className="mx-auto w-full min-w-0 max-w-full space-y-8">
      {agentHandoff ? <AgentHandoffPanel handoff={agentHandoff} /> : null}
      <ToolSetupLayout
        context={
          <ToolSetupContext
            kicker={getToolSetupCategory(toolId)}
            title={getToolSetupTitle(toolId)}
            subtitle={getToolSetupSubtitle(toolId)}
            credit={<StudioCreditPill label={creditLabel} />}
          >
            <div className="space-y-3">
              <StudioCreditNote>{SETUP_COPY.creditsBeforeStart}</StudioCreditNote>
              {GALLERY_PERSISTED_TOOL_IDS.has(toolId) ? (
                <StudioCreditNote>{SETUP_COPY.galleryResult}</StudioCreditNote>
              ) : (
                <StudioCreditNote>{SETUP_COPY.resultInline}</StudioCreditNote>
              )}
            </div>
            <Link
              href="/dashboard?tool=tools"
              className="inline-flex text-sm no-underline"
              style={{ color: DASHBOARD_MUTED }}
            >
              ← Alle Tools
            </Link>
          </ToolSetupContext>
        }
        setup={
          <ToolSetupSurface className="min-w-0 w-full max-w-full">
            <ProductionToolSetupBody toolId={toolId} />
          </ToolSetupSurface>
        }
      />
    </div>
  );
}

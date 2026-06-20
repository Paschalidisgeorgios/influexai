"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ToolId } from "./DashboardLayout";
import { DASHBOARD_MUTED } from "./DashboardSurface";
import { useAgentPreparedInputs } from "@/hooks/useAgentPreparedInputs";
import { buildToolActionReadiness } from "@/lib/tools/tool-action-readiness";
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
  GENERATE_IMAGE_CREDIT_PILL_LABEL,
  GENERATE_IMAGE_QUALITY_HINT,
} from "@/lib/generate-image-ux";
import {
  StudioCreditNote,
  StudioCreditPill,
  ToolSetupContext,
  ToolSetupLayout,
  ToolSetupSurface,
  AgentHandoffPanel,
} from "../studio-ui";

export function ProductionToolSetup({ toolId }: { toolId: ToolId }) {
  const creditLabel =
    toolId === "image-gen"
      ? GENERATE_IMAGE_CREDIT_PILL_LABEL
      : getSetupCreditLabel(toolId);
  const prepared = useAgentPreparedInputs(String(toolId));
  const readiness = useMemo(
    () => (prepared ? buildToolActionReadiness(prepared, {}) : null),
    [prepared]
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-full space-y-8">
      {prepared ? <AgentHandoffPanel prepared={prepared} readiness={readiness} /> : null}
      <ToolSetupLayout
        context={
          <ToolSetupContext
            kicker={getToolSetupCategory(toolId)}
            title={getToolSetupTitle(toolId)}
            subtitle={getToolSetupSubtitle(toolId)}
            credit={
              <StudioCreditPill
                label={creditLabel}
                data-testid={
                  toolId === "image-gen" ? "image-gen-credit-hint" : undefined
                }
              />
            }
          >
            <div className="space-y-3">
              <StudioCreditNote>{SETUP_COPY.creditsBeforeStart}</StudioCreditNote>
              {toolId === "image-gen" ? (
                <StudioCreditNote>{GENERATE_IMAGE_QUALITY_HINT}</StudioCreditNote>
              ) : null}
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

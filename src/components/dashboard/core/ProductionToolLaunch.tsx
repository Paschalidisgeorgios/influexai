"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  getModelsForTool,
  getStudioToolByDashboardId,
  getStudioToolPrimaryAction,
  isStudioProviderExecutionDisabled,
} from "@/lib/tools/studio-tool-registry";
import { getToolCapabilityForDashboardId } from "@/lib/tools/agent-tool-capability-map";
import {
  StudioActionBar,
  StudioModelSelectShell,
  ToolExecutionDisabledNotice,
  ToolWorkspaceShell,
} from "../studio-ui";

export function ProductionToolLaunch({
  toolId,
}: {
  toolId: ToolId;
}) {
  const studioTool = getStudioToolByDashboardId(toolId);
  const capability = getToolCapabilityForDashboardId(toolId);
  const primaryAction = getStudioToolPrimaryAction(toolId);
  const safeHref =
    capability?.safeRoutingTarget ??
    (primaryAction.disabled ? undefined : primaryAction.href);
  const creditLabel =
    capability?.creditEstimate ??
    studioTool?.creditLabel ??
    getSetupCreditLabel(toolId);
  const label = capability?.label ?? studioTool?.label ?? getToolDisplayLabel(toolId);
  const subtitle = getToolSetupSubtitle(toolId);
  const dedicatedRoute = resolveToolRoute(toolId);
  const agentHref = buildAgentPrepareHref(toolId, {});
  const models = useMemo(() => getModelsForTool(toolId), [toolId]);
  const defaultModelId =
    studioTool?.defaultModelId ?? models[0]?.id ?? "";
  const [selectedModelId, setSelectedModelId] = useState(defaultModelId);
  const providerDisabled = isStudioProviderExecutionDisabled(toolId);
  const showDisabledNotice =
    providerDisabled ||
    capability?.executionStatus === "provider_disabled" ||
    capability?.executionStatus === "shell_only" ||
    studioTool?.status === "shell";

  return (
    <ToolWorkspaceShell
      title={label}
      subtitle={subtitle}
      status={studioTool?.status}
      creditLabel={creditLabel}
      creditNote={SETUP_COPY.creditsBeforeStart}
      capability={capability}
      modelSelector={
        studioTool?.supportsModelSelection ? (
          <StudioModelSelectShell
            tool={studioTool}
            models={models}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
            toolId={String(toolId)}
          />
        ) : null
      }
      executionNotice={
        showDisabledNotice ? (
          <ToolExecutionDisabledNotice
            toolId={String(toolId)}
            variant={studioTool?.status === "shell" ? "shell_only" : "provider_disabled"}
          />
        ) : null
      }
      actions={
        <>
          <StudioActionBar
            primaryLabel={primaryAction.label}
            primaryHref={primaryAction.disabled ? undefined : safeHref}
            primaryDisabled={primaryAction.disabled || providerDisabled}
            secondaryLabel="Mit Agent planen"
            secondaryHref={agentHref}
          />
          {primaryAction.disabled && primaryAction.disabledReason ? (
            <p className="mt-4 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
              {primaryAction.disabledReason}
            </p>
          ) : null}
          {capability?.agentInstructions ? (
            <p className="mt-4 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
              {capability.agentInstructions}
            </p>
          ) : null}
        </>
      }
      footer={
        dedicatedRoute && studioTool?.status === "available" ? (
          <p className="mt-6 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
            Vollständiges Studio:{" "}
            <Link href={dedicatedRoute} className="underline">
              {dedicatedRoute.replace("/dashboard/", "")}
            </Link>
          </p>
        ) : null
      }
    />
  );
}

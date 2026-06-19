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
  STUDIO_SHELL_ONLY_HINT,
} from "@/lib/tools/studio-tool-registry";
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
  const primaryAction = getStudioToolPrimaryAction(toolId);
  const creditLabel = studioTool?.creditLabel ?? getSetupCreditLabel(toolId);
  const label = studioTool?.label ?? getToolDisplayLabel(toolId);
  const subtitle = getToolSetupSubtitle(toolId);
  const dedicatedRoute = resolveToolRoute(toolId);
  const agentHref = buildAgentPrepareHref(toolId, {});
  const models = useMemo(() => getModelsForTool(toolId), [toolId]);
  const defaultModelId =
    studioTool?.defaultModelId ?? models[0]?.id ?? "";
  const [selectedModelId, setSelectedModelId] = useState(defaultModelId);

  return (
    <ToolWorkspaceShell
      title={label}
      subtitle={subtitle}
      status={studioTool?.status}
      creditLabel={creditLabel}
      creditNote={SETUP_COPY.creditsBeforeStart}
      modelSelector={
        studioTool?.supportsModelSelection ? (
          <StudioModelSelectShell
            tool={studioTool}
            models={models}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
          />
        ) : null
      }
      executionNotice={
        studioTool?.status === "shell" ? (
          <ToolExecutionDisabledNotice variant="shell_only" />
        ) : null
      }
      options={
        studioTool?.status === "shell" ? (
          <p className="mb-6 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
            {STUDIO_SHELL_ONLY_HINT}
          </p>
        ) : null
      }
      actions={
        <>
          <StudioActionBar
            primaryLabel={primaryAction.label}
            primaryHref={primaryAction.disabled ? undefined : primaryAction.href}
            primaryDisabled={primaryAction.disabled}
            secondaryLabel="Mit Agent planen"
            secondaryHref={agentHref}
          />
          {primaryAction.disabled && primaryAction.disabledReason ? (
            <p className="mt-4 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
              {primaryAction.disabledReason}
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

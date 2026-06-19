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
  STUDIO_STATUS_LABELS,
} from "@/lib/tools/studio-tool-registry";
import {
  StudioActionBar,
  StudioCreditNote,
  StudioCreditPill,
  StudioModelSelectShell,
  StudioPageHeader,
  StudioPanel,
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

  const shellMessage =
    studioTool?.status === "shell"
      ? "Dieses Tool ist vorbereitet, aber noch nicht aktiviert."
      : null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-8">
      <StudioPageHeader
        kicker="Tool"
        title={label}
        subtitle={subtitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {studioTool ? (
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: DASHBOARD_MUTED,
                }}
              >
                {STUDIO_STATUS_LABELS[studioTool.status]}
              </span>
            ) : null}
            <StudioCreditPill label={creditLabel} />
          </div>
        }
      />

      <StudioPanel>
        <StudioCreditNote className="mb-6">{SETUP_COPY.creditsBeforeStart}</StudioCreditNote>

        <StudioModelSelectShell
          tool={studioTool}
          models={models}
          selectedModelId={selectedModelId}
          onModelChange={setSelectedModelId}
        />

        {shellMessage ? (
          <p className="mb-6 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
            {shellMessage}
          </p>
        ) : null}

        <StudioActionBar
          primaryLabel={primaryAction.label}
          primaryHref={primaryAction.disabled ? undefined : primaryAction.href}
          secondaryLabel={SETUP_COPY.agentSecondary}
          secondaryHref={agentHref}
        />

        {primaryAction.disabled && primaryAction.disabledReason ? (
          <p className="mt-4 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
            {primaryAction.disabledReason}
          </p>
        ) : null}

        {dedicatedRoute && studioTool?.status === "available" ? (
          <p className="mt-6 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
            Vollständiges Studio:{" "}
            <Link href={dedicatedRoute} className="underline">
              {dedicatedRoute.replace("/dashboard/", "")}
            </Link>
          </p>
        ) : null}
      </StudioPanel>
    </div>
  );
}

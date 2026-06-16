"use client";

import Link from "next/link";
import type { ToolId } from "./DashboardLayout";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPageHeader,
  DashboardPanel,
} from "./DashboardSurface";
import { buildAgentPrepareHref, getSetupCreditLabel } from "./production-tool-setup-ui";
import {
  getToolDisplayLabel,
  resolveToolRoute,
} from "./production-tool-routes";

const TOOL_DESCRIPTIONS: Partial<Record<ToolId, string>> = {
  "viral-hook": "Hooks aus Thema oder Link.",
  "content-calendar": "Content-Plan mit Hooks.",
  "trend-script": "Trend-Thema in Script.",
  "image-gen": "Prompt und Format wählen.",
  "img-to-img": "Bilder variieren oder remixen.",
  "img-to-video": "Startbild animieren.",
  "text-to-video": "Prompt in Video umsetzen.",
  "ecommerce-ads": "Produkt-Clips für Ads.",
  "avatar-video": "Avatar-Videos mit Sprache.",
  "tts": "Text-to-Speech und Stimme.",
};

export function ProductionToolLaunch({
  toolId,
}: {
  toolId: ToolId;
  onOpenDedicated?: (id: ToolId) => void;
}) {
  const creditLabel = getSetupCreditLabel(toolId);
  const label = getToolDisplayLabel(toolId);
  const toolDescription = TOOL_DESCRIPTIONS[toolId];
  const subtitle = toolDescription ?? "Setup folgt — vorerst über den Agent.";
  const dedicatedRoute = resolveToolRoute(toolId);
  const agentHref = buildAgentPrepareHref(toolId, {});

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-6">
      <DashboardPageHeader kicker="Tool" title={label} subtitle={subtitle} />

      <DashboardPanel>
        <p
          className="mb-1 font-mono text-[10px] uppercase tracking-widest"
          style={{ color: DASHBOARD_MUTED }}
        >
          Credits
        </p>
        <p className="mb-6 text-lg font-semibold" style={{ color: DASHBOARD_TEXT }}>
          {creditLabel}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={agentHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2.5 text-sm font-bold no-underline transition-opacity hover:opacity-90"
            style={{ background: DASHBOARD_ACCENT, color: "#060608" }}
          >
            Mit Agent vorbereiten
          </Link>

          <Link
            href="/dashboard?tool=tools"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium no-underline transition-colors hover:border-black/15"
            style={{
              borderColor: "rgba(8,8,8,0.12)",
              background: "#FFFCF7",
              color: DASHBOARD_TEXT,
            }}
          >
            Alle Tools
          </Link>
        </div>

        {dedicatedRoute ? (
          <p className="mt-5 text-xs" style={{ color: DASHBOARD_MUTED }}>
            Eigene Tool-Seite folgt im nächsten Redesign.
          </p>
        ) : null}
      </DashboardPanel>
    </div>
  );
}

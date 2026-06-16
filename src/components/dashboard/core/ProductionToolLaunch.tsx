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
import { getCreditDisplayLabel } from "@/lib/tools/credit-display";
import {
  getToolDisplayLabel,
  isToolPushSafeToOpen,
  resolveToolRoute,
} from "./production-tool-routes";

const TOOL_DESCRIPTIONS: Partial<Record<ToolId, string>> = {
  "viral-hook": "Hooks und Story-Struktur aus Trends oder Briefings.",
  "content-calendar": "Content-Plan mit Hooks für mehrere Plattformen.",
  "trend-script": "Trend-Thema in ein fertiges Script überführen.",
  "image-gen": "KI-Bilder für Social, Ads und Thumbnails.",
  "img-to-img": "Bestehende Bilder variieren oder remixen.",
  "img-to-video": "Statische Frames zu kurzen Video-Clips.",
  "text-to-video": "Text-Prompt direkt in Video umsetzen.",
  "ecommerce-ads": "Produkt-Clips für E-Commerce und Performance Ads.",
  "avatar-video": "Avatar-Videos mit synchroner Sprache.",
  "tts": "Text-to-Speech, Voice Clone und Voice Changer.",
};

export function ProductionToolLaunch({
  toolId,
  onOpenDedicated,
}: {
  toolId: ToolId;
  onOpenDedicated?: (id: ToolId) => void;
}) {
  const dedicatedRoute = resolveToolRoute(toolId);
  const canOpenDedicated = Boolean(dedicatedRoute && isToolPushSafeToOpen(toolId));
  const creditLabel = getCreditDisplayLabel(toolId);
  const label = getToolDisplayLabel(toolId);
  const description =
    TOOL_DESCRIPTIONS[toolId] ??
    "Starte im Agent — die dedizierte Tool-Oberfläche wird als Nächstes an die Studio-Shell angebunden.";

  const agentHref =
    toolId === "content-calendar"
      ? "/dashboard/ki-agent"
      : `/dashboard/ki-agent?tool=${encodeURIComponent(toolId)}`;

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-6">
      <DashboardPageHeader kicker="Tool" title={label} subtitle={description} />

      <DashboardPanel>
        <p
          className="mb-1 font-mono text-[10px] uppercase tracking-widest"
          style={{ color: DASHBOARD_MUTED }}
        >
          Credit-Kosten
        </p>
        <p className="mb-5 text-lg font-semibold" style={{ color: DASHBOARD_TEXT }}>
          {creditLabel}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={agentHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2.5 text-sm font-bold no-underline transition-opacity hover:opacity-90"
            style={{ background: DASHBOARD_ACCENT, color: "#060608" }}
          >
            Im Agent starten
          </Link>

          {canOpenDedicated && onOpenDedicated ? (
            <button
              type="button"
              onClick={() => onOpenDedicated(toolId)}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:border-black/15"
              style={{
                borderColor: "rgba(8,8,8,0.12)",
                background: "#FFFCF7",
                color: DASHBOARD_TEXT,
              }}
            >
              Tool öffnen
            </button>
          ) : null}

          <Link
            href="/dashboard/ki-agent"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium no-underline transition-colors hover:border-black/15"
            style={{
              borderColor: "rgba(8,8,8,0.12)",
              background: "#FFFCF7",
              color: DASHBOARD_TEXT,
            }}
          >
            Agent Command Center
          </Link>

          <Link
            href="/dashboard?tool=tools"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2.5 text-sm no-underline"
            style={{ color: DASHBOARD_MUTED }}
          >
            ← Alle Tools
          </Link>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Die klassische Tool-Oberfläche wird gerade an die Studio-Shell angebunden.
          Bis dahin startest du sicher über den Agent — ohne Legacy-Dark-UI.
        </p>
      </DashboardPanel>
    </div>
  );
}

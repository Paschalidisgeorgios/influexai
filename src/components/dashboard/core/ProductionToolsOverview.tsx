"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ToolId } from "./DashboardLayout";
import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "./DashboardSurface";
import { SETUP_COPY } from "./production-tool-setup-ui";
import { TOOL_OVERVIEW_CATEGORIES } from "./production-tool-routes";
import {
  STUDIO_RADIUS,
  STUDIO_SHADOW,
  StudioCreditNote,
  StudioPageHeader,
  StudioPanel,
  StudioSection,
} from "../studio-ui";

export function ProductionToolsOverview({
  onSelect,
}: {
  onSelect: (id: ToolId) => void;
}) {
  return (
    <div className="w-full min-w-0 space-y-10 md:space-y-12">
      <StudioPageHeader
        kicker="Studio"
        title="Tools"
        subtitle="Wähle das passende Tool für Bild, Video, Text, Avatar oder Kampagnenplanung."
      />

      <div className="space-y-10 md:space-y-12">
        {TOOL_OVERVIEW_CATEGORIES.map((category) => (
          <StudioSection key={category.id} title={category.title} description={category.description}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {category.tools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onSelect(tool.id)}
                  className={`group flex min-h-[108px] flex-col p-5 text-left transition-all hover:-translate-y-0.5 ${STUDIO_RADIUS.card}`}
                  style={{
                    background: "rgba(255,252,247,0.65)",
                    border: "1px solid rgba(8,8,8,0.05)",
                    boxShadow: STUDIO_SHADOW.card,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-[14px] font-semibold tracking-tight"
                      style={{ color: DASHBOARD_TEXT }}
                    >
                      {tool.label}
                    </span>
                    <ChevronRight
                      size={15}
                      className="shrink-0 opacity-40 transition-opacity group-hover:opacity-80"
                      style={{ color: DASHBOARD_MUTED }}
                    />
                  </div>
                  <p
                    className="mt-2 flex-1 text-[12px] leading-relaxed"
                    style={{ color: DASHBOARD_MUTED }}
                  >
                    {tool.description}
                  </p>
                  <p
                    className="mt-3 text-[11px] font-semibold tracking-wide"
                    style={{ color: DASHBOARD_TEXT }}
                  >
                    {SETUP_COPY.toolCardCta} →
                  </p>
                </button>
              ))}
            </div>
          </StudioSection>
        ))}
      </div>

      <StudioCreditNote>{SETUP_COPY.creditsBeforeStart}</StudioCreditNote>

      <StudioPanel title="Agent">
        <p className="mb-5 max-w-lg text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Der Agent hilft beim Briefing. Du behältst Kontrolle über Tool, Modell und Output.
        </p>
        <Link
          href="/dashboard/ki-agent"
          className={`inline-flex min-h-[44px] items-center px-6 text-sm font-semibold no-underline transition-opacity hover:opacity-90 ${STUDIO_RADIUS.button}`}
          style={{
            background: "rgba(180,255,0,0.12)",
            border: "1px solid rgba(180,255,0,0.22)",
            color: DASHBOARD_TEXT,
          }}
        >
          {SETUP_COPY.agentPrimary} →
        </Link>
      </StudioPanel>
    </div>
  );
}

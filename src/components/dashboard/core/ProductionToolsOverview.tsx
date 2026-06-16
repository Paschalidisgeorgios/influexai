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
        kicker="Creator Studio"
        title="Production Hub"
        subtitle="Bild, Video, Text und Avatar — wähle das Tool für deinen nächsten Output."
      />

      <div className="space-y-12 md:space-y-14">
        {TOOL_OVERVIEW_CATEGORIES.map((category) => (
          <StudioSection key={category.id} title={category.title} description={category.description}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {category.tools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onSelect(tool.id)}
                  className={`group flex min-h-[120px] flex-col p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(8,8,8,0.06)] ${STUDIO_RADIUS.card}`}
                  style={{
                    background: "rgba(255,252,247,0.88)",
                    border: "1px solid rgba(8,8,8,0.06)",
                    boxShadow: STUDIO_SHADOW.card,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-[15px] font-semibold tracking-tight"
                      style={{ color: DASHBOARD_TEXT }}
                    >
                      {tool.label}
                    </span>
                    <ChevronRight
                      size={16}
                      className="shrink-0 opacity-30 transition-all group-hover:translate-x-0.5 group-hover:opacity-70"
                    />
                  </div>
                  <p
                    className="mt-2.5 flex-1 text-[13px] leading-relaxed"
                    style={{ color: DASHBOARD_MUTED }}
                  >
                    {tool.description}
                  </p>
                  <span
                    className="mt-4 inline-flex items-center text-[12px] font-semibold"
                    style={{ color: DASHBOARD_TEXT }}
                  >
                    {SETUP_COPY.toolCardCta}
                    <ChevronRight size={12} className="ml-0.5 opacity-50" />
                  </span>
                </button>
              ))}
            </div>
          </StudioSection>
        ))}
      </div>

      <StudioCreditNote>{SETUP_COPY.creditsBeforeStart}</StudioCreditNote>

      <div
        className="flex flex-col gap-4 border-t border-black/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="max-w-md text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Lieber mit Briefing starten? Der Agent schlägt einen Produktionspfad vor — du entscheidest über Tool und Output.
        </p>
        <Link
          href="/dashboard/ki-agent"
          className={`inline-flex shrink-0 min-h-[44px] items-center px-5 text-sm font-medium no-underline transition-colors hover:border-black/18 ${STUDIO_RADIUS.button}`}
          style={{
            border: "1px solid rgba(8,8,8,0.10)",
            background: "#FFFCF7",
            color: DASHBOARD_TEXT,
          }}
        >
          Agent öffnen →
        </Link>
      </div>
    </div>
  );
}

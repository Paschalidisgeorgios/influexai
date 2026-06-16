"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ToolId } from "./DashboardLayout";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPageHeader,
  DashboardPanel,
  DashboardSection,
} from "./DashboardSurface";
import { getCreditDisplayLabel } from "@/lib/tools/credit-display";
import { TOOL_OVERVIEW_CATEGORIES } from "./production-tool-routes";

export function ProductionToolsOverview({
  onSelect,
}: {
  onSelect: (id: ToolId) => void;
}) {
  return (
    <div className="w-full min-w-0 space-y-8">
      <DashboardPageHeader
        kicker="Production Tools"
        title="Tools"
        subtitle="Wähle ein Tool — dedizierte Seiten öffnen sich in der Studio-Shell."
      />

      <div className="space-y-8">
        {TOOL_OVERVIEW_CATEGORIES.map((category) => (
          <DashboardSection key={category.id} title={category.title}>
            <p className="mb-3 text-sm" style={{ color: DASHBOARD_MUTED }}>
              {category.description}
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {category.tools.map((tool) => {
                const creditLabel = getCreditDisplayLabel(tool.id);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onSelect(tool.id)}
                    className="flex min-h-[88px] flex-col rounded-xl border p-4 text-left transition-colors hover:border-[#B4FF00]/28"
                    style={{
                      borderColor: "rgba(8,8,8,0.11)",
                      background: "#FFFCF7",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: DASHBOARD_TEXT }}
                      >
                        {tool.label}
                      </span>
                      <ChevronRight
                        size={14}
                        className="shrink-0"
                        style={{ color: DASHBOARD_MUTED }}
                      />
                    </div>
                    <p className="mt-1.5 flex-1 text-[11px] leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
                      {tool.description}
                    </p>
                    <p className="mt-2 font-mono text-[10px]" style={{ color: DASHBOARD_ACCENT }}>
                      {creditLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </DashboardSection>
        ))}
      </div>

      <DashboardPanel title="Agent">
        <p className="mb-4 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Unsicher welches Tool passt? Starte im Agent — Briefing analysieren, Tool wählen,
          Output vorbereiten.
        </p>
        <Link
          href="/dashboard/ki-agent"
          className="inline-flex rounded-lg border px-4 py-2.5 text-sm font-semibold no-underline transition-colors hover:border-[#B4FF00]/30"
          style={{
            borderColor: "rgba(8,8,8,0.12)",
            background: "rgba(180,255,0,0.10)",
            color: DASHBOARD_TEXT,
          }}
        >
          Zum Agent →
        </Link>
      </DashboardPanel>
    </div>
  );
}

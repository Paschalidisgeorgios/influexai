"use client";

import Link from "next/link";
import type { ToolId } from "./DashboardLayout";
import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "./DashboardSurface";
import { SETUP_COPY } from "./production-tool-setup-ui";
import {
  FEATURED_TOOLS,
  getToolOverviewCategoriesExcludingFeatured,
  type FeaturedTool,
} from "./production-tool-routes";
import {
  STUDIO_RADIUS,
  STUDIO_SHADOW,
  StudioCreditNote,
  StudioPageHeader,
  StudioSection,
} from "../studio-ui";

function FeaturedToolCard({
  tool,
  onSelect,
}: {
  tool: FeaturedTool;
  onSelect: (id: ToolId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tool.id)}
      className={`group flex min-h-[196px] flex-col p-6 text-left transition-all duration-300 hover:-translate-y-0.5 md:min-h-[220px] md:p-7 ${STUDIO_RADIUS.panel}`}
      style={{
        background: "rgba(255,252,247,0.94)",
        border: "1px solid rgba(8,8,8,0.045)",
        boxShadow: STUDIO_SHADOW.featured,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = STUDIO_SHADOW.cardHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = STUDIO_SHADOW.featured;
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: DASHBOARD_MUTED }}
      >
        {tool.category}
      </p>
      <h3
        className="mt-3 text-xl font-bold tracking-tight md:text-[1.35rem]"
        style={{ color: DASHBOARD_TEXT, letterSpacing: "-0.025em" }}
      >
        {tool.label}
      </h3>
      <p
        className="mt-3 flex-1 text-[14px] leading-relaxed"
        style={{ color: DASHBOARD_MUTED }}
      >
        {tool.description}
      </p>
      <span
        className="mt-6 text-[13px] font-semibold tracking-tight transition-opacity group-hover:opacity-80"
        style={{ color: DASHBOARD_TEXT }}
      >
        {SETUP_COPY.toolCardCta}
      </span>
    </button>
  );
}

function StandardToolCard({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[108px] flex-col p-4 text-left transition-all duration-200 hover:-translate-y-px md:p-5 ${STUDIO_RADIUS.card}`}
      style={{
        background: "rgba(255,252,247,0.72)",
        border: "1px solid rgba(8,8,8,0.04)",
        boxShadow: STUDIO_SHADOW.card,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = STUDIO_SHADOW.cardHover;
        e.currentTarget.style.background = "rgba(255,252,247,0.88)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = STUDIO_SHADOW.card;
        e.currentTarget.style.background = "rgba(255,252,247,0.72)";
      }}
    >
      <span
        className="text-[14px] font-semibold tracking-tight"
        style={{ color: DASHBOARD_TEXT }}
      >
        {label}
      </span>
      <p
        className="mt-2 flex-1 text-[12px] leading-relaxed"
        style={{ color: DASHBOARD_MUTED }}
      >
        {description}
      </p>
      <span
        className="mt-3 text-[11px] font-medium opacity-70 transition-opacity group-hover:opacity-100"
        style={{ color: DASHBOARD_TEXT }}
      >
        {SETUP_COPY.toolCardCta}
      </span>
    </button>
  );
}

export function ProductionToolsOverview({
  onSelect,
}: {
  onSelect: (id: ToolId) => void;
}) {
  const categories = getToolOverviewCategoriesExcludingFeatured();

  return (
    <div className="w-full min-w-0 space-y-14 md:space-y-16">
      <StudioPageHeader
        kicker="Creator Studio"
        title="Wähle deinen Produktionspfad"
        subtitle="Bild, Video, Text und Kampagnenassets in einem Studio vorbereiten."
      />

      <section className="space-y-5">
        <div className="space-y-1">
          <h2
            className="text-base font-semibold tracking-tight md:text-lg"
            style={{ color: DASHBOARD_TEXT }}
          >
            Empfohlene Produktionsschritte
          </h2>
          <p className="text-sm" style={{ color: DASHBOARD_MUTED }}>
            Die häufigsten Wege — direkt einrichten und starten.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          {FEATURED_TOOLS.map((tool) => (
            <FeaturedToolCard key={tool.id} tool={tool} onSelect={onSelect} />
          ))}
        </div>
      </section>

      <div className="space-y-12 md:space-y-14">
        {categories.map((category) => (
          <StudioSection
            key={category.id}
            title={category.title}
            description={category.description}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {category.tools.map((tool) => (
                <StandardToolCard
                  key={tool.id}
                  label={tool.label}
                  description={tool.description}
                  onClick={() => onSelect(tool.id)}
                />
              ))}
            </div>
          </StudioSection>
        ))}
      </div>

      <StudioCreditNote>{SETUP_COPY.creditsBeforeStart}</StudioCreditNote>

      <div className="flex flex-col gap-4 border-t border-black/[0.05] pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Briefing statt manueller Eingabe? Der Agent schlägt einen Produktionspfad vor.
        </p>
        <Link
          href="/dashboard/ki-agent"
          className={`inline-flex shrink-0 min-h-[44px] items-center px-5 text-sm font-medium no-underline transition-colors hover:border-black/16 ${STUDIO_RADIUS.button}`}
          style={{
            border: "1px solid rgba(8,8,8,0.08)",
            background: "rgba(255,252,247,0.85)",
            color: DASHBOARD_TEXT,
          }}
        >
          Agent öffnen
        </Link>
      </div>
    </div>
  );
}

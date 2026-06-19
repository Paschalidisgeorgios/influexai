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
  getStudioToolByDashboardId,
  STUDIO_STATUS_LABELS,
  type StudioToolStatus,
} from "@/lib/tools/studio-tool-registry";
import {
  STUDIO_CARD_BG,
  STUDIO_CARD_BG_FEATURED,
  STUDIO_CARD_BG_HOVER,
  STUDIO_CARD_BG_SOFT,
  STUDIO_CARD_BORDER,
  STUDIO_RADIUS,
  STUDIO_SHADOW,
  StudioCreditNote,
  StudioPageHeader,
  StudioSection,
} from "../studio-ui";

const STATUS_COLORS: Record<StudioToolStatus, { bg: string; text: string }> = {
  available: { bg: "rgba(52,211,153,0.12)", text: "#34d399" },
  shell: { bg: "rgba(180,255,0,0.12)", text: DASHBOARD_TEXT },
  disabled: { bg: "rgba(255,255,255,0.06)", text: DASHBOARD_MUTED },
  coming_soon: { bg: "rgba(255,255,255,0.06)", text: DASHBOARD_MUTED },
};

function ToolStatusPill({ status }: { status: StudioToolStatus }) {
  const colors = STATUS_COLORS[status];

  return (
    <span
      className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: colors.bg, color: colors.text }}
    >
      {STUDIO_STATUS_LABELS[status]}
    </span>
  );
}

function FeaturedToolCard({
  tool,
  onSelect,
}: {
  tool: FeaturedTool;
  onSelect: (id: ToolId) => void;
}) {
  const meta = getStudioToolByDashboardId(tool.id);
  const status = meta?.status ?? "available";
  const creditLabel = meta?.creditLabel;
  const disabled = status === "disabled" || status === "coming_soon";

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(tool.id)}
      disabled={disabled}
      className={`group flex min-h-[196px] flex-col p-6 text-left transition-all duration-300 hover:-translate-y-0.5 md:min-h-[220px] md:p-7 ${STUDIO_RADIUS.panel} disabled:cursor-not-allowed disabled:opacity-50`}
      style={{
        background: STUDIO_CARD_BG_FEATURED,
        border: `1px solid ${STUDIO_CARD_BORDER}`,
        boxShadow: STUDIO_SHADOW.featured,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.boxShadow = STUDIO_SHADOW.cardHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = STUDIO_SHADOW.featured;
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: DASHBOARD_MUTED }}
        >
          {tool.category}
        </p>
        <ToolStatusPill status={status} />
      </div>
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
      {creditLabel ? (
        <p className="mt-2 text-[11px]" style={{ color: DASHBOARD_MUTED }}>
          {creditLabel}
        </p>
      ) : null}
      <span
        className="mt-4 text-[13px] font-semibold tracking-tight transition-opacity group-hover:opacity-80"
        style={{ color: DASHBOARD_TEXT }}
      >
        {disabled ? STUDIO_STATUS_LABELS[status] : SETUP_COPY.toolCardCta}
      </span>
    </button>
  );
}

function StandardToolCard({
  toolId,
  label,
  description,
  onClick,
}: {
  toolId: ToolId;
  label: string;
  description: string;
  onClick: () => void;
}) {
  const meta = getStudioToolByDashboardId(toolId);
  const status = meta?.status ?? "shell";
  const creditLabel = meta?.creditLabel;
  const disabled = status === "disabled" || status === "coming_soon";

  return (
    <button
      type="button"
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className={`group flex min-h-[108px] flex-col p-4 text-left transition-all duration-200 hover:-translate-y-px md:p-5 ${STUDIO_RADIUS.card} disabled:cursor-not-allowed disabled:opacity-50`}
      style={{
        background: STUDIO_CARD_BG_SOFT,
        border: `1px solid ${STUDIO_CARD_BORDER}`,
        boxShadow: STUDIO_SHADOW.card,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.boxShadow = STUDIO_SHADOW.cardHover;
        e.currentTarget.style.background = STUDIO_CARD_BG_HOVER;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = STUDIO_SHADOW.card;
        e.currentTarget.style.background = STUDIO_CARD_BG_SOFT;
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-[14px] font-semibold tracking-tight"
          style={{ color: DASHBOARD_TEXT }}
        >
          {label}
        </span>
        <ToolStatusPill status={status} />
      </div>
      <p
        className="mt-2 flex-1 text-[12px] leading-relaxed"
        style={{ color: DASHBOARD_MUTED }}
      >
        {description}
      </p>
      {creditLabel ? (
        <p className="mt-1 text-[10px]" style={{ color: DASHBOARD_MUTED }}>
          {creditLabel}
        </p>
      ) : null}
      <span
        className="mt-3 text-[11px] font-medium opacity-70 transition-opacity group-hover:opacity-100"
        style={{ color: DASHBOARD_TEXT }}
      >
        {disabled ? STUDIO_STATUS_LABELS[status] : SETUP_COPY.toolCardCta}
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
                  toolId={tool.id}
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
          Briefing statt manueller Eingabe? Der Agent schlägt einen Produktionspfad vor — optional,
          nicht als Ersatz für Tool-Oberflächen.
        </p>
        <Link
          href="/dashboard/ki-agent"
          className={`inline-flex shrink-0 min-h-[44px] items-center px-5 text-sm font-medium no-underline transition-colors hover:border-black/16 ${STUDIO_RADIUS.button}`}
          style={{
            border: `1px solid ${STUDIO_CARD_BORDER}`,
            background: STUDIO_CARD_BG,
            color: DASHBOARD_TEXT,
          }}
        >
          Agent öffnen
        </Link>
      </div>
    </div>
  );
}

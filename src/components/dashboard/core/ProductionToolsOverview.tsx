"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ToolId } from "./DashboardLayout";
import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "./DashboardSurface";
import {
  INACTIVE_AGENT_HREF,
  SETUP_COPY,
} from "./production-tool-setup-ui";
import {
  ACTIVE_STUDIO_TOOLS,
  getHubInactiveTools,
  PRODUCTION_PATHS,
  type ProductionPath,
} from "./production-tool-routes";
import {
  STUDIO_CARD_BG,
  STUDIO_CARD_BG_FEATURED,
  STUDIO_CARD_BORDER,
  STUDIO_RADIUS,
  STUDIO_SHADOW,
  StudioCreditNote,
  StudioPageHeader,
  StudioSection,
} from "../studio-ui";

function ProductionPathCard({
  path,
  onSelect,
}: {
  path: ProductionPath;
  onSelect: (id: ToolId) => void;
}) {
  return (
    <div
      className={`flex min-h-[220px] flex-col p-6 md:min-h-[240px] md:p-7 ${STUDIO_RADIUS.panel}`}
      style={{
        background: STUDIO_CARD_BG_FEATURED,
        border: `1px solid ${STUDIO_CARD_BORDER}`,
        boxShadow: STUDIO_SHADOW.featured,
      }}
    >
      <h3
        className="text-xl font-bold tracking-tight md:text-[1.35rem]"
        style={{ color: DASHBOARD_TEXT, letterSpacing: "-0.025em" }}
      >
        {path.label}
      </h3>
      <p
        className="mt-3 flex-1 text-[14px] leading-relaxed"
        style={{ color: DASHBOARD_MUTED }}
      >
        {path.description}
      </p>

      {path.options.length > 1 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {path.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`border px-3.5 py-2 text-[12px] font-medium transition-colors hover:border-black/14 hover:bg-black/[0.03] ${STUDIO_RADIUS.button}`}
              style={{
                borderColor: "rgba(8,8,8,0.10)",
                color: DASHBOARD_TEXT,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onSelect(path.primaryToolId)}
        className={`mt-5 inline-flex min-h-[44px] w-full items-center justify-center text-sm font-semibold transition-opacity hover:opacity-90 sm:w-auto sm:px-6 ${STUDIO_RADIUS.button}`}
        style={{ background: "#B4FF00", color: "#08080a" }}
      >
        {SETUP_COPY.hubPathCta}
      </button>
    </div>
  );
}

function ActiveToolRow({
  label,
  onOpen,
}: {
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group flex w-full min-w-0 items-center gap-3 border px-4 py-3.5 text-left transition-colors hover:border-black/12 hover:bg-white/45 ${STUDIO_RADIUS.input}`}
      style={{
        borderColor: STUDIO_CARD_BORDER,
        background: "rgba(255,252,247,0.55)",
      }}
    >
      <span
        className="min-w-0 flex-1 text-[14px] font-semibold tracking-tight"
        style={{ color: DASHBOARD_TEXT }}
      >
        {label}
      </span>
      <span
        className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium"
        style={{ color: DASHBOARD_MUTED }}
      >
        {SETUP_COPY.hubActiveCta}
        <ChevronRight
          size={14}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </button>
  );
}

function InactiveToolRow({
  label,
  onOpen,
}: {
  label: string;
  onOpen: () => void;
}) {
  return (
    <div
      className={`flex min-w-0 items-center justify-between gap-3 px-3 py-2.5 ${STUDIO_RADIUS.input}`}
      style={{ background: "rgba(255,250,242,0.28)" }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`shrink-0 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${STUDIO_RADIUS.pill}`}
          style={{
            background: "rgba(8,8,8,0.04)",
            color: DASHBOARD_MUTED,
          }}
        >
          {SETUP_COPY.hubInactiveBadge}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="truncate text-left text-[13px] font-medium"
          style={{ color: DASHBOARD_TEXT }}
        >
          {label}
        </button>
      </div>
      <Link
        href={INACTIVE_AGENT_HREF}
        className="shrink-0 text-[11px] font-medium no-underline hover:opacity-80"
        style={{ color: DASHBOARD_MUTED }}
      >
        {SETUP_COPY.toolCardCtaInactiveAgent}
      </Link>
    </div>
  );
}

export function ProductionToolsOverview({
  onSelect,
}: {
  onSelect: (id: ToolId) => void;
}) {
  const inactiveTools = getHubInactiveTools();

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-10 md:space-y-12">
      <StudioPageHeader
        kicker="Creator Studio"
        title={SETUP_COPY.hubPageTitle}
        subtitle={SETUP_COPY.hubPageSubtitle}
      />

      <section className="space-y-4">
        <h2
          className="text-sm font-semibold tracking-tight md:text-base"
          style={{ color: DASHBOARD_TEXT }}
        >
          {SETUP_COPY.hubPathsTitle}
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          {PRODUCTION_PATHS.map((path) => (
            <ProductionPathCard key={path.id} path={path} onSelect={onSelect} />
          ))}
        </div>
      </section>

      <StudioSection title={SETUP_COPY.hubActiveTitle}>
        <div className="flex flex-col gap-2">
          {ACTIVE_STUDIO_TOOLS.map((tool) => (
            <ActiveToolRow
              key={tool.id}
              label={tool.label}
              onOpen={() => onSelect(tool.id)}
            />
          ))}
        </div>
      </StudioSection>

      {inactiveTools.length > 0 ? (
        <StudioSection
          title={SETUP_COPY.hubInactiveTitle}
          description={SETUP_COPY.hubInactiveDescription}
        >
          <div className="flex flex-col gap-1.5">
            {inactiveTools.map((tool) => (
              <InactiveToolRow
                key={tool.id}
                label={tool.label}
                onOpen={() => onSelect(tool.id)}
              />
            ))}
          </div>
        </StudioSection>
      ) : null}

      <StudioCreditNote>{SETUP_COPY.creditsBeforeStart}</StudioCreditNote>

      <div className="flex flex-col gap-4 border-t border-black/[0.05] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Briefing statt manueller Eingabe? Der Agent schlägt einen Produktionspfad vor.
        </p>
        <Link
          href={INACTIVE_AGENT_HREF}
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

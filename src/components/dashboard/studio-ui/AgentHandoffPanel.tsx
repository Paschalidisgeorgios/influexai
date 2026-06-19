"use client";

import { useMemo } from "react";
import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "@/components/dashboard/core/DashboardSurface";
import type { AgentToolHandoff } from "@/lib/tools/agent-tool-handoff";
import {
  buildAgentPreparedInputsOrNull,
  type AgentPreparedInputs,
} from "@/lib/tools/agent-prepared-inputs";
import type { ToolActionReadiness } from "@/lib/tools/tool-action-readiness";
import { STUDIO_CARD_BORDER, STUDIO_RADIUS } from "./tokens";

type AgentHandoffPanelProps = {
  handoff?: AgentToolHandoff | null;
  prepared?: AgentPreparedInputs | null;
  readiness?: ToolActionReadiness | null;
};

function ReadinessStatusBadge({ readiness }: { readiness: ToolActionReadiness }) {
  const tone =
    readiness.status === "ready_preview"
      ? "rgba(180,255,0,0.22)"
      : readiness.status === "missing_inputs" || readiness.status === "not_started"
        ? "rgba(255,255,255,0.12)"
        : "rgba(251,191,36,0.18)";

  return (
    <p className="mt-3 flex flex-wrap items-center gap-2">
      <span
        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ background: tone, color: DASHBOARD_TEXT }}
      >
        {readiness.statusLabel}
      </span>
      {readiness.providerDisabled ? (
        <span className="text-[11px] leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Ausführung deaktiviert — nur Vorbereitung
        </span>
      ) : null}
    </p>
  );
}

export function AgentHandoffPanel({
  handoff,
  prepared: preparedProp,
  readiness,
}: AgentHandoffPanelProps) {
  const prepared = useMemo(() => {
    if (preparedProp) return preparedProp;
    return buildAgentPreparedInputsOrNull(handoff);
  }, [handoff, preparedProp]);

  if (!prepared) return null;

  return (
    <aside
      className={`mb-6 min-w-0 border p-4 ${STUDIO_RADIUS.card}`}
      style={{
        borderColor: "rgba(180,255,0,0.22)",
        background: "rgba(180,255,0,0.06)",
      }}
      aria-label="Vom Agenten vorbereitet"
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: DASHBOARD_MUTED }}
      >
        Vom Agenten vorbereitet
      </p>
      <p className="mt-2 break-words text-sm font-medium" style={{ color: DASHBOARD_TEXT }}>
        {prepared.originalGoal}
      </p>

      {readiness ? <ReadinessStatusBadge readiness={readiness} /> : null}

      {prepared.recommendedAspectRatio ? (
        <p className="mt-3">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: "rgba(180,255,0,0.18)",
              color: DASHBOARD_TEXT,
            }}
          >
            Empfohlenes Format: {prepared.recommendedAspectRatio}
          </span>
        </p>
      ) : null}

      <dl className="mt-4 grid min-w-0 gap-3 text-xs sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Nächster sicherer Schritt
          </dt>
          <dd className="mt-1 leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
            {readiness?.recommendedNextStep ?? prepared.safeNextStep}
          </dd>
        </div>

        {readiness && readiness.missingRequiredInputs.length > 0 ? (
          <div className="sm:col-span-2">
            <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
              Fehlt noch
            </dt>
            <dd className="mt-2">
              <ul className="space-y-1.5" style={{ color: DASHBOARD_TEXT }}>
                {readiness.missingRequiredInputs.map((label) => (
                  <li key={label} className="flex items-start gap-2 leading-relaxed">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]"
                      style={{ borderColor: STUDIO_CARD_BORDER, color: DASHBOARD_MUTED }}
                    >
                      ○
                    </span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}

        {readiness && readiness.completedInputs.length > 0 ? (
          <div className="sm:col-span-2">
            <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
              {readiness.status === "ready_preview" ? "Bereit zur Vorschau" : "Erledigt"}
            </dt>
            <dd className="mt-2">
              <ul className="space-y-1.5" style={{ color: DASHBOARD_TEXT }}>
                {readiness.completedInputs.map((label) => (
                  <li key={label} className="flex items-start gap-2 leading-relaxed">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]"
                      style={{
                        borderColor: "rgba(180,255,0,0.35)",
                        color: DASHBOARD_TEXT,
                        background: "rgba(180,255,0,0.12)",
                      }}
                    >
                      ✓
                    </span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Briefing vorbereiten
          </dt>
          <dd className="mt-2">
            <p
              className="rounded-lg border px-3 py-2 text-xs leading-relaxed"
              style={{
                borderColor: STUDIO_CARD_BORDER,
                color: DASHBOARD_TEXT,
                background: "rgba(255,255,255,0.35)",
              }}
            >
              {prepared.suggestedPrompt}
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
              Placeholder-Hinweis: {prepared.suggestedPromptPlaceholder}
            </p>
          </dd>
        </div>

        {!readiness ? (
          <div className="sm:col-span-2">
            <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
              Eingaben prüfen
            </dt>
            <dd className="mt-2">
              <ul className="space-y-1.5" style={{ color: DASHBOARD_TEXT }}>
                {prepared.inputChecklist.map((input) => (
                  <li key={input.id} className="flex items-start gap-2 leading-relaxed">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]"
                      style={{ borderColor: STUDIO_CARD_BORDER, color: DASHBOARD_MUTED }}
                    >
                      ○
                    </span>
                    <span>
                      {input.label}
                      {input.required ? (
                        <span className="ml-1 text-[10px] uppercase" style={{ color: DASHBOARD_MUTED }}>
                          Pflicht
                        </span>
                      ) : null}
                      {input.description ? (
                        <span className="block text-[11px]" style={{ color: DASHBOARD_MUTED }}>
                          {input.description}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}

        <div>
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Mögliche Ausgabe
          </dt>
          <dd className="mt-1 leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
            {readiness?.outputExpectation ?? prepared.outputExpectation}
          </dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Workflow
          </dt>
          <dd className="mt-1" style={{ color: DASHBOARD_TEXT }}>
            {prepared.workflowStageLabel}
          </dd>
        </div>
      </dl>

      <p
        className="mt-3 rounded-lg border px-3 py-2 text-[11px] leading-relaxed"
        style={{
          borderColor: STUDIO_CARD_BORDER,
          color: DASHBOARD_TEXT,
        }}
      >
        {readiness?.executionDisabledMessage ?? prepared.disabledExecutionMessage}
      </p>

      <p className="mt-3 text-[11px] leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
        {readiness?.safeCtaLabel ?? prepared.safeCtaLabel} — Vorbereitung fortsetzen ohne Generierung,
        Upload oder Training.
      </p>
    </aside>
  );
}

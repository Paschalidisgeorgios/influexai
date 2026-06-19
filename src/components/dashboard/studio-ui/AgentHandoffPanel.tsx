"use client";

import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "@/components/dashboard/core/DashboardSurface";
import type { AgentToolHandoff } from "@/lib/tools/agent-tool-handoff";
import { STUDIO_CARD_BORDER, STUDIO_RADIUS } from "./tokens";

type AgentHandoffPanelProps = {
  handoff: AgentToolHandoff;
};

export function AgentHandoffPanel({ handoff }: AgentHandoffPanelProps) {
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
        {handoff.originalGoal}
      </p>

      {handoff.recommendedAspectRatio ? (
        <p className="mt-3">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: "rgba(180,255,0,0.18)",
              color: DASHBOARD_TEXT,
            }}
          >
            Empfohlenes Format: {handoff.recommendedAspectRatio}
          </span>
        </p>
      ) : null}

      <dl className="mt-4 grid min-w-0 gap-3 text-xs sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Nächster sicherer Schritt
          </dt>
          <dd className="mt-1 leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
            {handoff.nextStepSummary}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Eingaben prüfen
          </dt>
          <dd className="mt-2">
            {handoff.requiredInputs.length ? (
              <ul className="space-y-1.5" style={{ color: DASHBOARD_TEXT }}>
                {handoff.requiredInputs.map((input) => (
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
                      {input.description ? (
                        <span className="block text-[11px]" style={{ color: DASHBOARD_MUTED }}>
                          {input.description}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <span style={{ color: DASHBOARD_TEXT }}>Keine Pflichtfelder</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Mögliche Ausgabe
          </dt>
          <dd className="mt-1 leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
            {handoff.outputs.join(", ")}
          </dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Workflow
          </dt>
          <dd className="mt-1" style={{ color: DASHBOARD_TEXT }}>
            {handoff.workflowStageLabel}
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
        {handoff.providerDisabledMessage}
      </p>

      <p className="mt-3 text-[11px] leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
        Vorbereitung fortsetzen und Tool öffnen — ohne Generierung, Upload oder Training.
      </p>
    </aside>
  );
}

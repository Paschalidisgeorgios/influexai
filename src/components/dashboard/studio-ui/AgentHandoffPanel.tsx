"use client";

import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "@/components/dashboard/core/DashboardSurface";
import type { AgentToolHandoff } from "@/lib/tools/agent-tool-handoff";
import { STUDIO_CARD_BORDER, STUDIO_RADIUS } from "./tokens";

type AgentHandoffPanelProps = {
  handoff: AgentToolHandoff;
};

export function AgentHandoffPanel({ handoff }: AgentHandoffPanelProps) {
  const aspectRatios =
    handoff.recommendedAspectRatio != null
      ? [handoff.recommendedAspectRatio]
      : [];

  return (
    <aside
      className={`mb-6 border p-4 ${STUDIO_RADIUS.card}`}
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
      <p className="mt-2 text-sm font-medium" style={{ color: DASHBOARD_TEXT }}>
        {handoff.originalGoal}
      </p>

      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Empfohlener nächster Schritt
          </dt>
          <dd className="mt-1 leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
            {handoff.nextStepSummary}
          </dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Benötigte Eingaben
          </dt>
          <dd className="mt-1 leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
            {handoff.requiredInputs.length
              ? handoff.requiredInputs.map((i) => i.label).join(", ")
              : "Keine Pflichtfelder"}
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
        {aspectRatios.length > 0 ? (
          <div>
            <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
              Empfohlenes Format
            </dt>
            <dd className="mt-1" style={{ color: DASHBOARD_TEXT }}>
              {aspectRatios.join(", ")}
            </dd>
          </div>
        ) : null}
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

      <p className="mt-3 text-[11px]" style={{ color: DASHBOARD_MUTED }}>
        Eingaben prüfen und Vorbereitung fortsetzen — ohne Generierung, Upload oder Training.
      </p>
    </aside>
  );
}

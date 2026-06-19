"use client";

import Link from "next/link";
import type { CreatorGoalPlan } from "@/lib/tools/agent-tool-capability-planner";
import {
  AGENT_EXECUTION_DISABLED_COPY,
  AGENT_RECOMMENDATION_INTRO,
  buildRecommendationCards,
  type AgentRecommendationCardModel,
} from "@/lib/tools/agent-recommendation-ui";
import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "@/components/dashboard/core/DashboardSurface";
import { STUDIO_CARD_BORDER, STUDIO_RADIUS } from "@/components/dashboard/studio-ui/tokens";

function RecommendationCard({ card }: { card: AgentRecommendationCardModel }) {
  return (
    <article
      className={`border p-4 ${STUDIO_RADIUS.card}`}
      style={{
        borderColor: STUDIO_CARD_BORDER,
        background: "rgba(255,255,255,0.35)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3
            className="text-sm font-semibold tracking-tight"
            style={{ color: DASHBOARD_TEXT }}
          >
            {card.label}
          </h3>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
            {card.reason}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: "rgba(8,8,8,0.05)",
            color: DASHBOARD_MUTED,
          }}
        >
          {card.workflowStageLabel}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Benötigte Eingaben
          </dt>
          <dd className="mt-1 leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
            {card.requiredInputs.length
              ? card.requiredInputs.map((i) => i.label).join(", ")
              : "Keine Pflichtfelder"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Mögliche Ausgabe
          </dt>
          <dd className="mt-1 leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
            {card.outputs.join(", ")}
          </dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
            Credit-Hinweis
          </dt>
          <dd className="mt-1" style={{ color: DASHBOARD_TEXT }}>
            {card.creditEstimate}
          </dd>
        </div>
        {card.recommendedAspectRatios.length > 0 ? (
          <div>
            <dt className="font-semibold uppercase tracking-[0.12em]" style={{ color: DASHBOARD_MUTED }}>
              Empfohlenes Format
            </dt>
            <dd className="mt-1" style={{ color: DASHBOARD_TEXT }}>
              {card.recommendedAspectRatios.join(", ")}
            </dd>
          </div>
        ) : null}
      </dl>

      <p
        className="mt-3 rounded-lg border px-3 py-2 text-[11px] leading-relaxed"
        style={{
          borderColor: "rgba(180,255,0,0.18)",
          color: DASHBOARD_TEXT,
        }}
      >
        {card.providerDisabledMessage}
      </p>

      {card.ctaDisabled ? (
        <span
          className={`mt-4 inline-flex min-h-[40px] w-full items-center justify-center px-4 text-xs font-medium opacity-50 sm:w-auto ${STUDIO_RADIUS.button}`}
          style={{
            border: `1px solid ${STUDIO_CARD_BORDER}`,
            color: DASHBOARD_MUTED,
          }}
        >
          {card.ctaLabel}
        </span>
      ) : (
        <Link
          href={card.safeRoutingTarget}
          className={`mt-4 inline-flex min-h-[40px] w-full items-center justify-center px-4 text-xs font-semibold no-underline transition-opacity hover:opacity-85 sm:w-auto ${STUDIO_RADIUS.button}`}
          style={{ background: "#B4FF00", color: "#08080a" }}
        >
          {card.ctaLabel}
        </Link>
      )}
    </article>
  );
}

type AgentToolRecommendationsProps = {
  plan: CreatorGoalPlan;
};

export function AgentToolRecommendations({ plan }: AgentToolRecommendationsProps) {
  const primary = buildRecommendationCards(plan, false);
  const optional = buildRecommendationCards(plan, true);

  return (
    <section className="space-y-5" aria-live="polite">
      <div className="space-y-2">
        <p className="text-sm font-medium" style={{ color: DASHBOARD_TEXT }}>
          {AGENT_RECOMMENDATION_INTRO}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          Ziel: <span style={{ color: DASHBOARD_TEXT }}>{plan.goal}</span>
        </p>
        <p
          className="rounded-lg border px-3 py-2 text-xs leading-relaxed"
          style={{
            borderColor: "rgba(180,255,0,0.2)",
            color: DASHBOARD_TEXT,
          }}
        >
          {plan.providerDisabledNotice || AGENT_EXECUTION_DISABLED_COPY}
        </p>
        {plan.recommendedAspectRatio ? (
          <p className="text-xs" style={{ color: DASHBOARD_MUTED }}>
            Empfohlenes Format für dieses Ziel:{" "}
            <strong style={{ color: DASHBOARD_TEXT }}>{plan.recommendedAspectRatio}</strong>
          </p>
        ) : null}
      </div>

      {plan.workflowSteps.length > 0 ? (
        <div>
          <h2
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: DASHBOARD_MUTED }}
          >
            Empfohlener nächster Schritt
          </h2>
          <ol className="space-y-1.5 text-xs leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
            {plan.workflowSteps.map((step) => (
              <li key={step} className="list-inside list-decimal">
                {step}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="space-y-3">
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: DASHBOARD_MUTED }}
        >
          Empfohlene Tools
        </h2>
        {primary.map((card) => (
          <RecommendationCard key={card.toolId} card={card} />
        ))}
      </div>

      {optional.length > 0 ? (
        <div className="space-y-3">
          <h2
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: DASHBOARD_MUTED }}
          >
            Optional
          </h2>
          {optional.map((card) => (
            <RecommendationCard key={`opt-${card.toolId}`} card={card} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

"use client";

import Link from "next/link";
import type {
  AgentPlannerBlockedResponse,
  AgentPlanPreviewStep,
  AgentPlannerDecision,
} from "@/lib/agent/plan-preview-types";

const TOOL_DASHBOARD_ROUTES: Record<string, string> = {
  script_generator: "/dashboard/script-generator",
  trend_script: "/dashboard/trend-to-script",
  viral_hook: "/dashboard/viral-hook",
  content_kalender: "/dashboard/content-kalender",
  image_generator: "/dashboard/image-generator",
  ki_ich: "/dashboard/ki-ich",
  ugc_video: "/dashboard/ugc-video",
  seedance: "/dashboard/seedance",
  live_creator: "/dashboard/live-creator",
  lora_training: "/dashboard/lora-training",
  produkt_werbung: "/dashboard/produkt",
  video_remix: "/dashboard/video-remix",
  viral_score: "/dashboard/viral-score",
  competitor: "/dashboard/competitor",
  campaign_autopilot: "/dashboard/campaign-autopilot",
  niche_analyzer: "/dashboard/niche-analyzer",
  outlier_detector: "/dashboard/outlier-detector",
  thumbnail_concept: "/dashboard/thumbnail-concept",
  stimme_musik: "/dashboard/stimme-musik",
  gallery: "/dashboard/gallery",
  face_swap: "/dashboard/motion-transfer",
};

const DECISION_HEADLINE: Record<AgentPlannerDecision, string> = {
  execute_auto: "Kann direkt ausgeführt werden",
  ask_clarifying_question: "Rückfrage nötig",
  confirm_cost: "Kosten bestätigen",
  require_consent: "Einwilligung nötig",
  redirect_to_tool: "Zum Tool wechseln",
  preview_only: "Preview-only",
  not_agent_ready: "Noch nicht agent-ready",
  unsupported: "Nicht unterstützt",
};

function decisionPillStyle(decision: AgentPlannerDecision) {
  switch (decision) {
    case "ask_clarifying_question":
      return { background: "rgba(96,165,250,0.12)", color: "#93c5fd", border: "1px solid rgba(96,165,250,0.3)" };
    case "confirm_cost":
      return { background: "rgba(251,191,36,0.12)", color: "#fcd34d", border: "1px solid rgba(251,191,36,0.3)" };
    case "require_consent":
      return { background: "rgba(249,115,22,0.12)", color: "#fdba74", border: "1px solid rgba(249,115,22,0.3)" };
    default:
      return { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.14)" };
  }
}

function BlockedToolRow({ step }: { step: AgentPlanPreviewStep }) {
  const route = TOOL_DASHBOARD_ROUTES[step.toolId];
  const credits =
    step.estimatedCredits?.min != null
      ? step.estimatedCredits.max != null &&
        step.estimatedCredits.max !== step.estimatedCredits.min
        ? `~${step.estimatedCredits.min}–${step.estimatedCredits.max} Credits`
        : `~${step.estimatedCredits.min} Credits`
      : null;

  return (
    <li
      className="rounded p-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p className="text-[0.82rem] font-semibold" style={{ color: "#F0EFE8" }}>
        {step.label}
      </p>
      <p className="mt-1 text-[11px] leading-[1.45]" style={{ color: "rgba(255,255,255,0.62)" }}>
        {step.reason}
      </p>
      {credits && (
        <p className="mt-1 text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
          {credits} (nur Schätzung)
        </p>
      )}
      {step.decision === "redirect_to_tool" && route && (
        <Link
          href={route}
          className="mt-2 inline-block text-[11px] font-semibold underline-offset-2 hover:underline"
          style={{ color: "#B4FF00" }}
        >
          Tool im Dashboard öffnen →
        </Link>
      )}
    </li>
  );
}

export function AgentPlannerBlockedCard({
  blocked,
}: {
  blocked: AgentPlannerBlockedResponse;
}) {
  const headline =
    DECISION_HEADLINE[blocked.plannerDecision] ?? blocked.plannerDecision;
  const pill = decisionPillStyle(blocked.plannerDecision);

  return (
    <div
      className="mt-4 min-w-0 overflow-hidden p-4"
      style={{
        borderRadius: 4,
        background: "#0f0f12",
        border: "1px solid rgba(96,165,250,0.28)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{
            borderRadius: 3,
            background: "rgba(96,165,250,0.12)",
            color: "#93c5fd",
            border: "1px solid rgba(96,165,250,0.3)",
          }}
        >
          Entscheidung nötig
        </span>
        <span className="text-[11px] sm:text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          Es wurden keine Credits verbraucht.
        </span>
      </div>

      <div
        className="mt-3 inline-flex px-2.5 py-1 text-[11px] font-semibold"
        style={{ borderRadius: 3, ...pill }}
      >
        {headline}
      </div>

      <p
        className="mt-3 text-[0.82rem] font-medium leading-[1.5]"
        style={{ color: "#F0EFE8" }}
      >
        Ich brauche noch eine Entscheidung von dir.
      </p>

      <p
        className="mt-1.5 text-[0.82rem] leading-[1.5]"
        style={{ color: "rgba(255,255,255,0.72)" }}
      >
        {blocked.message}
      </p>

      {blocked.clarificationQuestion && (
        <div
          className="mt-3 rounded p-3"
          style={{
            background: "rgba(96,165,250,0.1)",
            border: "1px solid rgba(96,165,250,0.35)",
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ color: "#93c5fd" }}
          >
            Deine Rückfrage
          </p>
          <p
            className="mt-1.5 text-[0.85rem] font-medium leading-[1.5]"
            style={{ color: "#F0EFE8" }}
          >
            {blocked.clarificationQuestion}
          </p>
          <p
            className="mt-2 text-[11px] leading-[1.45]"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Antworte im Prompt oben und tippe erneut auf Plan-Vorschau oder
            Ausführen.
          </p>
        </div>
      )}

      {blocked.confirmationMessage && (
        <div
          className="mt-3 rounded p-3"
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.25)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "#fcd34d" }}>
            Kosten-Hinweis
          </p>
          <p className="mt-1.5 text-[11px] leading-[1.45]" style={{ color: "rgba(255,255,255,0.75)" }}>
            {blocked.confirmationMessage}
          </p>
        </div>
      )}

      {blocked.selectedTools.length > 0 && (
        <div className="mt-4">
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "rgba(180,255,0,0.6)" }}
          >
            Vorgeschlagene Tools
          </p>
          <ul className="space-y-2">
            {blocked.selectedTools.map((step) => (
              <BlockedToolRow key={step.toolId} step={step} />
            ))}
          </ul>
        </div>
      )}

      {blocked.warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {blocked.warnings.map((warning) => (
            <li
              key={warning}
              className="text-[10px] leading-[1.45]"
              style={{ color: "rgba(255,200,80,0.9)" }}
            >
              {warning}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

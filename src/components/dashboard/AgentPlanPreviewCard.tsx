"use client";

import Link from "next/link";
import type {
  AgentPlanPreviewResponse,
  AgentPlanPreviewStep,
  AgentPlannerDecision,
} from "@/lib/agent/plan-preview-types";

/** Client-safe dashboard routes (mirrors tool-registry; no server imports). */
const TOOL_DASHBOARD_ROUTES: Record<string, string> = {
  script_generator: "/dashboard/script-generator",
  trend_script: "/dashboard/trend-to-script",
  viral_hook: "/dashboard/viral-hook",
  content_kalender: "/dashboard/content-kalender",
  image_generator: "/dashboard/image-generator",
  ki_ich: "/dashboard/ki-ich",
  ugc_video: "/dashboard/ugc-video",
  seedance: "/dashboard/seedance",
  kling25_i2v: "/dashboard/seedance?model=kling25_turbo_pro",
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

const DECISION_BODY: Record<AgentPlannerDecision, string> = {
  execute_auto:
    "Dieses Tool kann ausgeführt werden, wenn du auf Ausführen klickst. Die Plan-Vorschau startet nichts automatisch.",
  ask_clarifying_question:
    "Bevor etwas ausgeführt wird, braucht der Agent noch eine Entscheidung von dir.",
  confirm_cost:
    "Dieses Tool kann Credits verbrauchen. Bitte bestätige die Ausführung über Ausführen, wenn du fortfahren möchtest.",
  require_consent:
    "Dieses Tool verarbeitet Bild, Stimme oder Identität. Es braucht vorher deine Einwilligung.",
  redirect_to_tool:
    "Dieses Tool läuft im Dashboard (Upload, Einstellungen oder Vorschau) — kein autonomer Chat-Run.",
  preview_only:
    "Dieses Feature ist aktuell nur eine Preview — kein echter autonomer Agent.",
  not_agent_ready:
    "Dieses Tool ist in der Registry noch nicht für den Agent freigegeben.",
  unsupported:
    "Dafür habe ich noch kein passendes Tool gefunden. Beschreibe dein Ziel etwas genauer.",
};

const STEP_DECISION_LABEL: Record<AgentPlannerDecision, string> = {
  execute_auto: "Direkt ausführbar",
  ask_clarifying_question: "Rückfrage",
  confirm_cost: "Kosten bestätigen",
  require_consent: "Einwilligung",
  redirect_to_tool: "Dashboard-Tool",
  preview_only: "Nur Preview",
  not_agent_ready: "Nicht agent-ready",
  unsupported: "Nicht unterstützt",
};

const INTENT_LABELS: Record<string, string> = {
  video_briefing: "Video / Short / Reel",
  script_generation: "Script",
  product_ad: "Produkt-Werbung",
  hook_generation: "Hook",
  content_calendar: "Content-Kalender",
  image_generation: "Bild",
  thumbnail_concept: "Thumbnail",
  avatar_workflow: "Avatar / KI-Ich",
  multi_tool_content_package: "Mehrere Tools",
  unknown: "Allgemeine Anfrage",
};

function formatCredits(step: AgentPlanPreviewStep): string | null {
  const c = step.estimatedCredits;
  if (c?.min == null) return null;
  if (c.max != null && c.max !== c.min) return `~${c.min}–${c.max} Credits`;
  return `~${c.min} Credits`;
}

function formatCreditImpact(
  impact: AgentPlanPreviewResponse["estimatedCreditImpact"]
): string | null {
  if (impact.min == null) return null;
  if (impact.max != null && impact.max !== impact.min) {
    return `Geschätzt gesamt: ${impact.min}–${impact.max} Credits (nur Planung)`;
  }
  return `Geschätzt gesamt: ${impact.min} Credits (nur Planung)`;
}

function decisionPillStyle(decision: AgentPlannerDecision) {
  switch (decision) {
    case "execute_auto":
      return { background: "rgba(180,255,0,0.15)", color: "#B4FF00", border: "1px solid rgba(180,255,0,0.35)" };
    case "ask_clarifying_question":
      return { background: "rgba(96,165,250,0.12)", color: "#93c5fd", border: "1px solid rgba(96,165,250,0.3)" };
    case "confirm_cost":
      return { background: "rgba(251,191,36,0.12)", color: "#fcd34d", border: "1px solid rgba(251,191,36,0.3)" };
    case "require_consent":
      return { background: "rgba(249,115,22,0.12)", color: "#fdba74", border: "1px solid rgba(249,115,22,0.3)" };
    case "redirect_to_tool":
      return { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.14)" };
    case "preview_only":
      return { background: "rgba(168,85,247,0.12)", color: "#d8b4fe", border: "1px solid rgba(168,85,247,0.3)" };
    default:
      return { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" };
  }
}

function PlanPreviewStepRow({ step }: { step: AgentPlanPreviewStep }) {
  const route = TOOL_DASHBOARD_ROUTES[step.toolId];
  const credits = formatCredits(step);
  const pill = decisionPillStyle(step.decision);

  return (
    <li
      className="rounded p-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.82rem] font-semibold" style={{ color: "#F0EFE8" }}>
            {step.label}
          </p>
          <p className="mt-0.5 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            {step.toolId}
          </p>
        </div>
        <span
          className="shrink-0 px-2 py-0.5 text-[10px] font-semibold"
          style={{ borderRadius: 3, ...pill }}
        >
          {STEP_DECISION_LABEL[step.decision]}
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-[1.45]" style={{ color: "rgba(255,255,255,0.62)" }}>
        {step.reason}
      </p>
      {credits && (
        <p className="mt-1 text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
          {credits} · nur Schätzung, keine Abbuchung in der Vorschau
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

export function AgentPlanPreviewCard({
  preview,
}: {
  preview: AgentPlanPreviewResponse;
}) {
  const decision = preview.plannerDecision;
  const headline = DECISION_HEADLINE[decision] ?? decision;
  const body = DECISION_BODY[decision];
  const intentLabel =
    INTENT_LABELS[preview.detectedIntent] ?? preview.detectedIntent;
  const creditImpact = formatCreditImpact(preview.estimatedCreditImpact);
  const showClarificationHints =
    decision === "ask_clarifying_question" &&
    preview.plannedSteps.some((s) => s.toolId === "script_generator") &&
    preview.plannedSteps.some((s) =>
      ["ugc_video", "ki_ich", "seedance"].includes(s.toolId)
    );

  return (
    <div
      className="mt-4 min-w-0 overflow-hidden p-4 sm:p-4"
      style={{
        borderRadius: 4,
        background: "#0f0f12",
        border: "1px solid rgba(180,255,0,0.2)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{
            borderRadius: 3,
            background: "rgba(180,255,0,0.12)",
            color: "#B4FF00",
            border: "1px solid rgba(180,255,0,0.35)",
          }}
        >
          Plan-Vorschau
        </span>
        <span className="text-[11px] sm:text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          Keine Credits in der Vorschau · noch keine Ausführung
        </span>
      </div>

      <div
        className="mt-3 inline-flex px-2.5 py-1 text-[11px] font-semibold"
        style={{ borderRadius: 3, ...decisionPillStyle(decision) }}
      >
        {headline}
      </div>

      <p
        className="mt-3 text-[0.82rem] leading-[1.5]"
        style={{ color: "rgba(255,255,255,0.82)" }}
      >
        {preview.summary}
      </p>

      <p className="mt-2 text-[11px] leading-[1.45]" style={{ color: "rgba(255,255,255,0.55)" }}>
        {body}
      </p>

      {preview.clarificationQuestion && (
        <div
          className="mt-3 rounded p-3"
          style={{
            background: "rgba(96,165,250,0.08)",
            border: "1px solid rgba(96,165,250,0.25)",
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ color: "#93c5fd" }}
          >
            Rückfrage
          </p>
          <p
            className="mt-1.5 text-[0.85rem] font-medium leading-[1.5]"
            style={{ color: "#F0EFE8" }}
          >
            {preview.clarificationQuestion}
          </p>
          {showClarificationHints && (
            <ul className="mt-2 space-y-1 text-[10px] leading-[1.45]" style={{ color: "rgba(255,255,255,0.55)" }}>
              <li>Script/Briefing → sicherer Text-Workflow (Script Generator)</li>
              <li>Fertiges KI-Video → Tool mit Upload, Consent oder Kosten im Dashboard</li>
            </ul>
          )}
        </div>
      )}

      {preview.confirmationMessage && (
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
            {preview.confirmationMessage}
          </p>
        </div>
      )}

      <div
        className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px]"
        style={{ color: "rgba(255,255,255,0.42)" }}
      >
        <span>Verstanden als: {intentLabel}</span>
        <span>Sicherheit: {Math.round(preview.confidence * 100)}%</span>
        {creditImpact && <span>{creditImpact}</span>}
      </div>

      {preview.plannedSteps.length > 0 && (
        <div className="mt-4">
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "rgba(180,255,0,0.6)" }}
          >
            Vorgeschlagene Tools
          </p>
          <ul className="space-y-2">
            {preview.plannedSteps.map((step) => (
              <PlanPreviewStepRow key={step.toolId} step={step} />
            ))}
          </ul>
        </div>
      )}

      {decision === "preview_only" &&
        preview.plannedSteps.some((s) => s.toolId === "campaign_autopilot") && (
          <p
            className="mt-3 text-[10px] leading-[1.45]"
            style={{ color: "rgba(216,180,254,0.9)" }}
          >
            Campaign Autopilot ist eine Demo-Preview — kein autonomer Live-Kampagnen-Agent.
          </p>
        )}

      {preview.warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {preview.warnings.map((warning) => (
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

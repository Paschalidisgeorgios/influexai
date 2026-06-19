/**
 * Agent recommendation UI helpers — Phase 4G.4V-C.
 * Pure functions for safe CTA copy and labels. No execution.
 */

import type {
  ToolExecutionStatus,
  WorkflowStage,
} from "@/lib/tools/agent-tool-capability-map";
import type { CreatorGoalPlan } from "@/lib/tools/agent-tool-capability-planner";
import { getToolCapabilityById } from "@/lib/tools/agent-tool-capability-map";
import { recommendToolsForCreatorGoal } from "@/lib/tools/agent-tool-capability-planner";

export const AGENT_RECOMMENDATION_INTRO =
  "Ich kann dir den passenden Workflow vorbereiten.";

export const AGENT_EXECUTION_DISABLED_COPY =
  "Ausführung ist in dieser Umgebung deaktiviert. Es wird nichts generiert, trainiert oder hochgeladen.";

export const FORBIDDEN_CTA_PHRASES = [
  "jetzt generieren",
  "training starten",
  "upload starten",
  "credits abbuchen",
  "sofort rendern",
] as const;

export const WORKFLOW_STAGE_LABELS: Record<WorkflowStage, string> = {
  planning: "Planung",
  character_setup: "Character-Setup",
  asset_creation: "Asset-Erstellung",
  video_production: "Video-Produktion",
  voice_avatar: "Stimme & Avatar",
  live_interaction: "Live-Interaktion",
  distribution: "Distribution",
  management: "Verwaltung",
};

export function getRecommendationCtaLabel(
  executionStatus: ToolExecutionStatus
): string {
  switch (executionStatus) {
    case "available":
      return "Tool öffnen";
    case "provider_disabled":
    case "shell_only":
      return "Vorbereitung anzeigen";
    case "coming_soon":
      return "Demnächst verfügbar";
    case "disabled":
      return "Nicht verfügbar";
    default:
      return "Inputs prüfen";
  }
}

export function isRecommendationCtaDisabled(
  executionStatus: ToolExecutionStatus
): boolean {
  return executionStatus === "disabled" || executionStatus === "coming_soon";
}

export function isForbiddenCtaLabel(label: string): boolean {
  const lower = label.toLowerCase();
  return FORBIDDEN_CTA_PHRASES.some((phrase) => lower.includes(phrase));
}

export type AgentRecommendationCardModel = {
  toolId: string;
  label: string;
  reason: string;
  requiredInputs: { id: string; label: string }[];
  outputs: string[];
  creditEstimate: string;
  recommendedAspectRatios: string[];
  workflowStageLabel: string;
  safeRoutingTarget: string;
  providerDisabledMessage: string;
  ctaLabel: string;
  ctaDisabled: boolean;
  optional: boolean;
};

export function buildRecommendationCards(
  plan: CreatorGoalPlan,
  optional = false
): AgentRecommendationCardModel[] {
  const source = optional ? plan.optionalTools : plan.recommendations;

  return source.map((rec) => {
    const cap = getToolCapabilityById(rec.toolId);
    const executionStatus = cap?.executionStatus ?? rec.executionStatus;
    const ctaLabel = getRecommendationCtaLabel(executionStatus);

    return {
      toolId: rec.toolId,
      label: cap?.label ?? rec.label,
      reason: rec.reason,
      requiredInputs: cap?.requiredInputs ?? [],
      outputs: cap?.outputs ?? [],
      creditEstimate: cap?.creditEstimate ?? "—",
      recommendedAspectRatios:
        cap?.recommendedAspectRatios.length
          ? cap.recommendedAspectRatios
          : plan.recommendedAspectRatio
            ? [plan.recommendedAspectRatio]
            : [],
      workflowStageLabel: cap
        ? WORKFLOW_STAGE_LABELS[cap.workflowStage]
        : "Workflow",
      safeRoutingTarget: cap?.safeRoutingTarget ?? rec.safeRoutingTarget,
      providerDisabledMessage:
        cap?.providerDisabledMessage ?? plan.providerDisabledNotice,
      ctaLabel,
      ctaDisabled: isRecommendationCtaDisabled(executionStatus),
      optional,
    };
  });
}

export function planCreatorGoal(goal: string): CreatorGoalPlan | null {
  const trimmed = goal.trim();
  if (!trimmed) return null;
  return recommendToolsForCreatorGoal(trimmed);
}

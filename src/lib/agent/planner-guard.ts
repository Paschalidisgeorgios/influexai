import "server-only";

import {
  planAgentTask,
  type AgentPlannerDecision,
  type AgentPlannerResult,
} from "./planner";

const BLOCKING_PLANNER_DECISIONS = new Set<AgentPlannerDecision>([
  "ask_clarifying_question",
  "require_consent",
  "confirm_cost",
  "redirect_to_tool",
  "preview_only",
  "not_agent_ready",
  "unsupported",
]);

export function isBlockingPlannerDecision(
  decision: AgentPlannerDecision
): boolean {
  return BLOCKING_PLANNER_DECISIONS.has(decision);
}

export function evaluatePlannerGuard(
  prompt: string,
  availableCredits?: number
): AgentPlannerResult {
  return planAgentTask({
    prompt,
    locale: "de",
    availableCredits,
  });
}

export function buildPlannerBlockedPayload(plan: AgentPlannerResult) {
  return {
    blockedByPlanner: true as const,
    plannerDecision: plan.decision,
    message: plan.summary,
    clarificationQuestion: plan.clarificationQuestion,
    confirmationMessage: plan.confirmationMessage,
    selectedTools: plan.selectedTools.map((step) => ({
      toolId: step.toolId,
      label: step.label,
      decision: step.decision,
      reason: step.reason,
      missingInputs: step.missingInputs,
      estimatedCredits: step.estimatedCredits,
      riskLevel: step.riskLevel,
    })),
    warnings: plan.warnings,
    dryRun: false as const,
    executionAllowed: false as const,
  };
}

import "server-only";

import {
  planAgentTask,
  type AgentPlannerInput,
  type AgentPlannerResult,
} from "./planner";
import type { AgentPlanPreviewResponse } from "./plan-preview-types";
import { detectIntent, routeToTools } from "./router";

function collectMissingInputs(plan: AgentPlannerResult): string[] {
  const seen = new Set<string>();
  for (const step of plan.selectedTools) {
    for (const input of step.missingInputs ?? []) {
      seen.add(input);
    }
  }
  return [...seen];
}

function collectRiskFlags(plan: AgentPlannerResult): string[] {
  const flags: string[] = [];
  for (const step of plan.selectedTools) {
    if (step.riskLevel === "high") {
      flags.push(`high_risk:${step.toolId}`);
    }
    if (step.requiresConsent) {
      flags.push(`consent_required:${step.toolId}`);
    }
    if (step.requiresUpload) {
      flags.push(`upload_required:${step.toolId}`);
    }
    if (step.decision === "preview_only") {
      flags.push(`preview_only:${step.toolId}`);
    }
    if (step.decision === "confirm_cost") {
      flags.push(`cost_confirmation:${step.toolId}`);
    }
    if (step.decision === "not_agent_ready") {
      flags.push(`not_agent_ready:${step.toolId}`);
    }
  }
  return flags;
}

function computeConfidence(
  plan: AgentPlannerResult,
  hasLegacyRoute: boolean
): number {
  if (plan.decision === "unsupported") return 0.2;
  if (plan.selectedTools.length === 0) return 0.25;

  let score = 0.55;
  if (hasLegacyRoute) score += 0.1;
  if (plan.decision === "execute_auto") score += 0.2;
  if (plan.decision === "redirect_to_tool") score += 0.1;
  if (plan.decision === "confirm_cost") score += 0.08;
  if (plan.decision === "require_consent") score += 0.05;
  if (plan.decision === "preview_only") score += 0.12;
  if (plan.decision === "ask_clarifying_question") score -= 0.15;
  if (plan.warnings.length > 0) score -= 0.08 * plan.warnings.length;

  return Math.round(Math.min(0.95, Math.max(0.15, score)) * 100) / 100;
}

/**
 * Registry-based plan preview — no tool execution, no credits, no provider calls.
 */
export function buildAgentPlanPreview(
  input: AgentPlannerInput
): AgentPlanPreviewResponse {
  const prompt = input.prompt.trim();
  const detectedIntent = detectIntent(prompt);
  const legacyRoutedTools = routeToTools(detectedIntent);
  const plan = planAgentTask(input);

  const plannedSteps = plan.selectedTools.map((step) => ({
    toolId: step.toolId,
    label: step.label,
    decision: step.decision,
    reason: step.reason,
    missingInputs: step.missingInputs,
    estimatedCredits: step.estimatedCredits,
    riskLevel: step.riskLevel,
  }));

  const requiredTools = plan.selectedTools.map((step) => step.toolId);
  const missingInputs = collectMissingInputs(plan);
  const riskFlags = collectRiskFlags(plan);

  return {
    executionAllowed: false,
    dryRun: true,
    detectedIntent,
    legacyRoutedTools,
    goal: prompt,
    plannerDecision: plan.decision,
    summary: plan.summary,
    plannedSteps,
    requiredTools,
    missingInputs,
    riskFlags,
    warnings: plan.warnings,
    confidence: computeConfidence(plan, legacyRoutedTools.length > 0),
    estimatedCreditImpact: {
      min: plan.estimatedTotalCredits?.min,
      max: plan.estimatedTotalCredits?.max,
      note: plan.estimatedTotalCredits?.note,
    },
    clarificationQuestion: plan.clarificationQuestion,
    confirmationMessage: plan.confirmationMessage,
  };
}

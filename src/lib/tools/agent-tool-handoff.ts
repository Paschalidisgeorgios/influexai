/**
 * Agent → Tool handoff context — Phase 4G.4V-D.
 * Pure helpers (testable). Client persistence via sessionStorage helpers below.
 */

import type {
  ToolCapabilityInput,
  WorkflowStage,
} from "@/lib/tools/agent-tool-capability-map";
import { getToolCapabilityById } from "@/lib/tools/agent-tool-capability-map";
import {
  recommendToolsForCreatorGoal,
  type CreatorGoalPlan,
} from "@/lib/tools/agent-tool-capability-planner";
import { WORKFLOW_STAGE_LABELS } from "@/lib/tools/agent-recommendation-ui";
import type { AgentRecommendationCardModel } from "@/lib/tools/agent-recommendation-ui";

export type AgentToolHandoffSource = "agent-recommendation";

export type AgentToolHandoff = {
  handoffId: string;
  originalGoal: string;
  selectedToolId: string;
  recommendedToolIds: string[];
  recommendedAspectRatio: string | null;
  requiredInputs: ToolCapabilityInput[];
  optionalInputs: ToolCapabilityInput[];
  outputs: string[];
  workflowStage: WorkflowStage;
  workflowStageLabel: string;
  nextStepSummary: string;
  safeRoutingTarget: string;
  providerDisabledMessage: string;
  createdAt: string;
  source: AgentToolHandoffSource;
};

export const AGENT_HANDOFF_STORAGE_PREFIX = "influex:agent-handoff:";
export const AGENT_HANDOFF_MAX_GOAL_URL_LENGTH = 120;
/** Handoffs older than this are ignored and pruned from sessionStorage. */
export const AGENT_HANDOFF_MAX_AGE_MS = 2 * 60 * 60 * 1000;
export const AGENT_HANDOFF_MAX_STORED = 12;

const FORBIDDEN_HANDOFF_PATTERNS = [
  /api[_-]?key/i,
  /\bsecret\b/i,
  /\bpassword\b/i,
  /\btoken\b/i,
  /service_role/i,
  /providerpayload/i,
  /data:[^;]+;base64,/i,
] as const;

function containsForbiddenHandoffContent(value: string): boolean {
  return FORBIDDEN_HANDOFF_PATTERNS.some((pattern) => pattern.test(value));
}

function walkHandoffValues(value: unknown): boolean {
  if (typeof value === "string") {
    if (containsForbiddenHandoffContent(value)) return true;
    if (value.length > 2_000) return true;
    return false;
  }
  if (Array.isArray(value)) {
    return value.some(walkHandoffValues);
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(walkHandoffValues);
  }
  return false;
}

export function generateHandoffId(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `h_${Date.now()}_${rand}`;
}

export function truncateGoalForUrl(goal: string): string {
  const trimmed = goal.trim();
  if (trimmed.length <= AGENT_HANDOFF_MAX_GOAL_URL_LENGTH) return trimmed;
  return `${trimmed.slice(0, AGENT_HANDOFF_MAX_GOAL_URL_LENGTH - 1)}…`;
}

export function appendHandoffQueryParams(
  baseHref: string,
  handoffId: string,
  goalSnippet?: string
): string {
  const hashIndex = baseHref.indexOf("#");
  const hash = hashIndex >= 0 ? baseHref.slice(hashIndex) : "";
  const pathQuery = hashIndex >= 0 ? baseHref.slice(0, hashIndex) : baseHref;
  const qIndex = pathQuery.indexOf("?");
  const path = qIndex >= 0 ? pathQuery.slice(0, qIndex) : pathQuery;
  const existing = qIndex >= 0 ? pathQuery.slice(qIndex + 1) : "";
  const params = new URLSearchParams(existing);
  params.set("fromAgent", "1");
  params.set("handoff", handoffId);
  if (goalSnippet?.trim()) {
    params.set("goal", truncateGoalForUrl(goalSnippet));
  }
  const query = params.toString();
  return `${path}${query ? `?${query}` : ""}${hash}`;
}

export function parseHandoffSearchParams(
  params: Pick<URLSearchParams, "get">
): {
  fromAgent: boolean;
  handoffId: string | null;
  goalFallback: string | null;
} {
  return {
    fromAgent: params.get("fromAgent") === "1",
    handoffId: params.get("handoff")?.trim() || null,
    goalFallback: params.get("goal")?.trim() || null,
  };
}

export function isHandoffPayloadSafe(handoff: AgentToolHandoff): boolean {
  if (walkHandoffValues(handoff)) return false;
  if (JSON.stringify(handoff).length > 16_000) return false;
  return true;
}

export function isHandoffFresh(
  handoff: AgentToolHandoff,
  nowMs = Date.now()
): boolean {
  const created = Date.parse(handoff.createdAt);
  if (Number.isNaN(created)) return false;
  return nowMs - created <= AGENT_HANDOFF_MAX_AGE_MS;
}

export function isStoredHandoffValid(
  handoff: AgentToolHandoff,
  handoffId: string,
  expectedToolId: string,
  nowMs = Date.now()
): boolean {
  return (
    handoff.handoffId === handoffId &&
    handoff.selectedToolId === expectedToolId &&
    handoff.source === "agent-recommendation" &&
    isHandoffPayloadSafe(handoff) &&
    isHandoffFresh(handoff, nowMs)
  );
}

export function buildAgentToolHandoff(
  plan: CreatorGoalPlan,
  card: AgentRecommendationCardModel,
  handoffId = generateHandoffId()
): AgentToolHandoff {
  const cap = getToolCapabilityById(card.toolId);
  const workflowStage = cap?.workflowStage ?? "planning";
  const nextStepSummary =
    plan.workflowSteps.find((step) =>
      step.toLowerCase().includes(card.label.toLowerCase().split(" ")[0] ?? "")
    ) ??
    plan.workflowSteps[0] ??
    card.reason;

  const handoff: AgentToolHandoff = {
    handoffId,
    originalGoal: plan.goal,
    selectedToolId: card.toolId,
    recommendedToolIds: [
      ...plan.recommendations.map((r) => r.toolId),
      ...plan.optionalTools.map((r) => r.toolId),
    ],
    recommendedAspectRatio: plan.recommendedAspectRatio,
    requiredInputs: card.requiredInputs,
    optionalInputs: cap?.optionalInputs ?? [],
    outputs: card.outputs,
    workflowStage,
    workflowStageLabel: WORKFLOW_STAGE_LABELS[workflowStage],
    nextStepSummary,
    safeRoutingTarget: card.safeRoutingTarget,
    providerDisabledMessage: card.providerDisabledMessage,
    createdAt: new Date().toISOString(),
    source: "agent-recommendation",
  };

  if (!isHandoffPayloadSafe(handoff)) {
    throw new Error("Unsafe handoff payload rejected");
  }

  return handoff;
}

export function buildHandoffNavigationHref(
  plan: CreatorGoalPlan,
  card: AgentRecommendationCardModel,
  handoffId: string
): string {
  return appendHandoffQueryParams(
    card.safeRoutingTarget,
    handoffId,
    plan.goal
  );
}

export function reconstructHandoffForTool(
  goal: string,
  toolId: string
): AgentToolHandoff | null {
  const trimmed = goal.trim();
  if (!trimmed) return null;

  const plan = recommendToolsForCreatorGoal(trimmed);
  const match =
    plan.recommendations.find((r) => r.toolId === toolId) ??
    plan.optionalTools.find((r) => r.toolId === toolId);

  if (!match) return null;

  const cap = getToolCapabilityById(toolId);
  if (!cap) return null;

  const card: AgentRecommendationCardModel = {
    toolId,
    label: cap.label,
    reason: match.reason,
    requiredInputs: cap.requiredInputs,
    outputs: cap.outputs,
    creditEstimate: cap.creditEstimate,
    recommendedAspectRatios: cap.recommendedAspectRatios.length
      ? cap.recommendedAspectRatios
      : plan.recommendedAspectRatio
        ? [plan.recommendedAspectRatio]
        : [],
    workflowStageLabel: WORKFLOW_STAGE_LABELS[cap.workflowStage],
    safeRoutingTarget: cap.safeRoutingTarget,
    providerDisabledMessage: cap.providerDisabledMessage,
    ctaLabel: "Vorbereitung anzeigen",
    ctaDisabled: false,
    optional: !plan.recommendations.some((r) => r.toolId === toolId),
  };

  return buildAgentToolHandoff(plan, card);
}

export function resolveAgentToolHandoff(
  handoffId: string | null,
  goalFallback: string | null,
  expectedToolId: string,
  stored: AgentToolHandoff | null,
  nowMs = Date.now()
): AgentToolHandoff | null {
  if (
    stored &&
    handoffId &&
    isStoredHandoffValid(stored, handoffId, expectedToolId, nowMs)
  ) {
    return stored;
  }

  if (goalFallback) {
    const reconstructed = reconstructHandoffForTool(goalFallback, expectedToolId);
    if (reconstructed && isHandoffFresh(reconstructed, nowMs)) {
      return reconstructed;
    }
  }

  return null;
}

export function getAgentHandoffStorageKey(handoffId: string): string {
  return `${AGENT_HANDOFF_STORAGE_PREFIX}${handoffId}`;
}

export function persistAgentToolHandoff(handoff: AgentToolHandoff): void {
  if (typeof window === "undefined") return;
  if (!isHandoffPayloadSafe(handoff) || !isHandoffFresh(handoff)) return;
  try {
    sessionStorage.setItem(
      getAgentHandoffStorageKey(handoff.handoffId),
      JSON.stringify(handoff)
    );
    pruneStaleAgentHandoffs();
  } catch {
    // Quota or privacy mode — URL goal fallback still available
  }
}

export function loadAgentToolHandoff(handoffId: string): AgentToolHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(getAgentHandoffStorageKey(handoffId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AgentToolHandoff;
    if (!parsed?.handoffId || parsed.handoffId !== handoffId) return null;
    if (!isHandoffPayloadSafe(parsed)) return null;
    if (!isHandoffFresh(parsed)) {
      sessionStorage.removeItem(getAgentHandoffStorageKey(handoffId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function pruneStaleAgentHandoffs(nowMs = Date.now()): void {
  if (typeof window === "undefined") return;
  try {
    const entries: { key: string; created: number }[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith(AGENT_HANDOFF_STORAGE_PREFIX)) continue;
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as AgentToolHandoff;
        const created = Date.parse(parsed.createdAt);
        if (
          !parsed.handoffId ||
          !isHandoffPayloadSafe(parsed) ||
          Number.isNaN(created) ||
          nowMs - created > AGENT_HANDOFF_MAX_AGE_MS
        ) {
          sessionStorage.removeItem(key);
          continue;
        }
        entries.push({ key, created });
      } catch {
        sessionStorage.removeItem(key);
      }
    }
    entries.sort((a, b) => b.created - a.created);
    for (const stale of entries.slice(AGENT_HANDOFF_MAX_STORED)) {
      sessionStorage.removeItem(stale.key);
    }
  } catch {
    // Best-effort cleanup only
  }
}

export function buildHandoffNavigation(
  plan: CreatorGoalPlan,
  card: AgentRecommendationCardModel,
  handoffId = generateHandoffId()
): { href: string; handoff: AgentToolHandoff } {
  const handoff = buildAgentToolHandoff(plan, card, handoffId);
  return {
    handoff,
    href: buildHandoffNavigationHref(plan, card, handoff.handoffId),
  };
}

export function prepareHandoffNavigation(
  plan: CreatorGoalPlan,
  card: AgentRecommendationCardModel
): { href: string; handoff: AgentToolHandoff } {
  const navigation = buildHandoffNavigation(plan, card);
  persistAgentToolHandoff(navigation.handoff);
  return navigation;
}

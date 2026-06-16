/**
 * canonical-tool-registry.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CANONICAL PRODUCT TRUTH — Phase 1A (documentation / SSOT preparation)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file is the intended Single Source of Truth for:
 *   - Tool identity (id, label, routes, pages)
 *   - Credit policy documentation (UI vs API vs provider)
 *   - Production vs preview separation
 *   - Known mismatches and DOCS_REQUIRED flags
 *
 * NOT YET WIRED INTO:
 *   - API route billing (deductCredits / withCreditDeduction)
 *   - calculateExactCredits (promptOptimizer.ts)
 *   - Agent orchestrator / planner
 *   - Dashboard UI components
 *
 * Legacy registries remain runtime adapters until Phase 1B+:
 *   - dashboard-tool-registry.ts (audit + AgentBox dev validation)
 *   - tool-registry.ts (4-tool studio pages)
 *   - agent/tool-registry.ts (agent metadata)
 *   - canvas/toolApiSchema.ts + tool-credit-costs.ts
 *
 * @see PRODUCT_TRUTH_FREEZE.md
 */

import type {
  CanonicalToolDefinition,
  CanonicalToolStatus,
  CreditMismatchSummary,
} from "./canonical-tool-types";
import { PRODUCTION_CANONICAL_TOOLS } from "./canonical-tools-data";
import { PREVIEW_MOCK_CANONICAL_TOOLS } from "./canonical-tools-preview";

// Re-export types for consumers
export type {
  CanonicalToolDefinition,
  CanonicalToolCategory,
  CanonicalToolStatus,
  CreditPolicy,
  CreditPolicyMode,
  CreditChargeTiming,
  CreditMismatchSummary,
} from "./canonical-tool-types";

/** All tools including preview mocks (use filters for production-only). */
export const CANONICAL_TOOL_REGISTRY: Record<string, CanonicalToolDefinition> =
  Object.fromEntries(
    [...PRODUCTION_CANONICAL_TOOLS, ...PREVIEW_MOCK_CANONICAL_TOOLS].map(
      (t) => [t.id, t]
    )
  );

/** Production tools only — use this for product planning. */
export const PRODUCTION_TOOLS: CanonicalToolDefinition[] =
  PRODUCTION_CANONICAL_TOOLS;

/** Preview / mock tools — never use for billing. */
export const PREVIEW_MOCK_TOOLS: CanonicalToolDefinition[] =
  PREVIEW_MOCK_CANONICAL_TOOLS;

// ─── Lookup helpers (read-only) ─────────────────────────────────────────────

export function getCanonicalTool(
  id: string
): CanonicalToolDefinition | undefined {
  return CANONICAL_TOOL_REGISTRY[id];
}

/** Resolve by alias (dashboard ToolId, agent id, preview id). */
export function getCanonicalToolByAlias(
  alias: string
): CanonicalToolDefinition | undefined {
  const direct = CANONICAL_TOOL_REGISTRY[alias];
  if (direct) return direct;
  return Object.values(CANONICAL_TOOL_REGISTRY).find((t) =>
    t.aliases?.includes(alias)
  );
}

export function getProductionTools(): CanonicalToolDefinition[] {
  return PRODUCTION_CANONICAL_TOOLS;
}

export function getPreviewMockTools(): CanonicalToolDefinition[] {
  return PREVIEW_MOCK_CANONICAL_TOOLS;
}

export function getToolsByCanonicalStatus(
  status: CanonicalToolStatus
): CanonicalToolDefinition[] {
  return Object.values(CANONICAL_TOOL_REGISTRY).filter(
    (t) => t.status === status
  );
}

export function getToolsWithCreditMismatches(): CanonicalToolDefinition[] {
  return PRODUCTION_CANONICAL_TOOLS.filter(
    (t) => t.knownMismatches.length > 0
  );
}

export function getToolsRequiringDocs(): CanonicalToolDefinition[] {
  return PRODUCTION_CANONICAL_TOOLS.filter((t) => t.docsRequired);
}

export function getPostPayRiskTools(): CanonicalToolDefinition[] {
  return PRODUCTION_CANONICAL_TOOLS.filter(
    (t) =>
      t.creditPolicy.chargeTiming === "postpay" ||
      t.creditPolicy.chargeTiming === "deferred" ||
      t.knownMismatches.some((m) =>
        /POST-PAY|DEFERRED|deferred/i.test(m)
      )
  );
}

/** Summarize UI displayedCredits vs API baseCredits for audit reports. */
export function summarizeCreditMismatches(): CreditMismatchSummary[] {
  return PRODUCTION_CANONICAL_TOOLS.filter(
    (t) => t.knownMismatches.length > 0
  ).map((t) => ({
    toolId: t.id,
    label: t.label,
    uiCredits: String(t.creditPolicy.displayedCredits),
    apiCredits: String(t.creditPolicy.baseCredits ?? "dynamic"),
    registryNote: t.knownMismatches.join("; "),
  }));
}

export function getCanonicalRegistrySummary(): {
  production: number;
  previewMock: number;
  withMismatches: number;
  docsRequired: number;
  postPayOrDeferred: number;
  comingSoon: number;
} {
  return {
    production: PRODUCTION_CANONICAL_TOOLS.length,
    previewMock: PREVIEW_MOCK_CANONICAL_TOOLS.length,
    withMismatches: getToolsWithCreditMismatches().length,
    docsRequired: getToolsRequiringDocs().length,
    postPayOrDeferred: getPostPayRiskTools().length,
    comingSoon: PRODUCTION_CANONICAL_TOOLS.filter(
      (t) => t.status === "coming-soon"
    ).length,
  };
}

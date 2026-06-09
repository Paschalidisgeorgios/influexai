/** Client-safe response shape for /api/agent/plan-preview (no server imports). */

export type AgentPlannerDecision =
  | "execute_auto"
  | "ask_clarifying_question"
  | "confirm_cost"
  | "require_consent"
  | "redirect_to_tool"
  | "preview_only"
  | "not_agent_ready"
  | "unsupported";

export type AgentPlanPreviewStep = {
  toolId: string;
  label: string;
  decision: AgentPlannerDecision;
  reason: string;
  missingInputs?: string[];
  estimatedCredits?: {
    min?: number;
    max?: number;
    note?: string;
  };
  riskLevel?: "low" | "medium" | "high";
};

export type AgentPlanPreviewResponse = {
  executionAllowed: false;
  dryRun: true;
  detectedIntent: string;
  legacyRoutedTools: string[];
  goal: string;
  plannerDecision: AgentPlannerDecision;
  summary: string;
  plannedSteps: AgentPlanPreviewStep[];
  requiredTools: string[];
  missingInputs: string[];
  riskFlags: string[];
  warnings: string[];
  confidence: number;
  estimatedCreditImpact: {
    min?: number;
    max?: number;
    note?: string;
  };
  clarificationQuestion?: string;
  confirmationMessage?: string;
};

export type AgentPlanPreviewErrorResponse = {
  error: string;
};

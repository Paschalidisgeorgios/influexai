/**
 * Deterministic agent tool planner — Phase 4G.4V-B.
 * Keyword/capability based; no LLM, no provider execution.
 */

import {
  AGENT_TOOL_CAPABILITY_MAP,
  getToolCapabilityById,
  type AgentToolCapability,
} from "@/lib/tools/agent-tool-capability-map";

export type CreatorGoalRecommendation = {
  toolId: string;
  label: string;
  reason: string;
  safeRoutingTarget: string;
  executionStatus: AgentToolCapability["executionStatus"];
  priority: number;
};

export type CreatorGoalPlan = {
  goal: string;
  providerDisabledNotice: string;
  recommendedAspectRatio: string | null;
  recommendations: CreatorGoalRecommendation[];
  workflowSteps: string[];
  optionalTools: CreatorGoalRecommendation[];
};

export type WorkflowStepContext = {
  hasCharacterDraft?: boolean;
  consentConfirmed?: boolean;
  handoffReady?: boolean;
  uploadPending?: boolean;
  hasStartImage?: boolean;
};

function normalizeGoal(input: string): string {
  return input.trim().toLowerCase();
}

function goalMatchesKeyword(goal: string, keyword: string): boolean {
  const normalized = normalizeGoal(goal);
  const key = keyword.toLowerCase();
  return normalized.includes(key);
}

function scoreCapability(cap: AgentToolCapability, goal: string): number {
  let score = 0;
  for (const keyword of cap.matchKeywords) {
    if (goalMatchesKeyword(goal, keyword)) score += 3;
  }
  for (const useCase of cap.useCases) {
    if (goalMatchesKeyword(goal, useCase)) score += 2;
  }
  for (const rec of cap.recommendedFor) {
    if (goalMatchesKeyword(goal, rec)) score += 1;
  }
  return score;
}

function isVideoGoal(goal: string): boolean {
  return /tiktok|video|reel|short|clip|motion|9:16|16:9/.test(goal);
}

function isInfluencerGoal(goal: string): boolean {
  return /ai-influencer|ki-ich|influencer|character|ki ich|ai creator/.test(goal);
}

function isPlanningGoal(goal: string): boolean {
  return /kalender|plan|hook|script|trend|kampagne/.test(goal);
}

export function recommendToolsForCreatorGoal(goalInput: string): CreatorGoalPlan {
  const goal = normalizeGoal(goalInput);
  const scored = AGENT_TOOL_CAPABILITY_MAP.map((cap) => ({
    cap,
    score: scoreCapability(cap, goal),
  }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const recommendations: CreatorGoalRecommendation[] = [];
  const optionalTools: CreatorGoalRecommendation[] = [];
  const workflowSteps: string[] = [];
  let recommendedAspectRatio: string | null = null;

  const pushRec = (
    toolId: string,
    reason: string,
    priority: number,
    optional = false
  ) => {
    const cap = getToolCapabilityById(toolId);
    if (!cap) return;
    const entry: CreatorGoalRecommendation = {
      toolId: cap.toolId,
      label: cap.label,
      reason,
      safeRoutingTarget: cap.safeRoutingTarget,
      executionStatus: cap.executionStatus,
      priority,
    };
    const list = optional ? optionalTools : recommendations;
    if (!list.some((r) => r.toolId === toolId)) {
      list.push(entry);
    }
  };

  if (isInfluencerGoal(goal) || goal.includes("ai-influencer")) {
    pushRec(
      "ai-creator",
      "Character Draft, Consent und Handoff prüfen — Basis für KI-Influencer.",
      100
    );
    workflowSteps.push(
      "1. AI Creator öffnen und prüfen, ob ein Character Draft existiert.",
      "2. Consent bestätigen (Pflicht für Character-Nutzung).",
      "3. Draft auf handoff_ready vorbereiten, wenn vollständig.",
      "4. Upload-Shell-Status prüfen (upload_pending) — kein echtes Training/Upload."
    );
  }

  if (isVideoGoal(goal)) {
    recommendedAspectRatio = goal.includes("youtube") && !goal.includes("short") ? "16:9" : "9:16";
    if (goal.includes("startbild") || goal.includes("foto") || isInfluencerGoal(goal)) {
      pushRec(
        "img-to-video",
        "Motion-Clip aus Startbild — passend für TikTok/Reels mit Character-Motiv.",
        90
      );
    } else {
      pushRec(
        "text-to-video",
        "Clip aus Szenenbeschreibung — wenn noch kein Startbild vorhanden ist.",
        85
      );
      pushRec(
        "img-to-video",
        "Alternative: zuerst Motiv im Image Studio, dann Bild-zu-Video.",
        80,
        true
      );
    }
    pushRec("image-gen", "Startbild oder Kampagnenmotiv für die Video-Pipeline.", 70, true);
    workflowSteps.push(
      "5. Video-Tool wählen: Image-to-Video (mit Startbild) oder Text-to-Video (aus Brief).",
      `6. Format ${recommendedAspectRatio} für vertikale Shorts empfehlen.`
    );
  }

  if (isPlanningGoal(goal)) {
    pushRec("viral-hook", "Starken Einstieg für Reels/Ads formulieren.", 60, true);
    pushRec("content-calendar", "Redaktionsplan und Rhythmus strukturieren.", 55, true);
  }

  if (goal.includes("lip") || goal.includes("stimme") || goal.includes("sprechen")) {
    pushRec("talking-avatar", "Lip Sync vorbereiten — Video + Audio erforderlich.", 75);
  }

  if (goal.includes("live")) {
    pushRec("live-creator", "Live Creator Shell — Echtzeit-Workflow vorbereiten.", 65, true);
  }

  if (goal.includes("face swap") || goal.includes("gesicht tauschen")) {
    pushRec("face-swap-video", "Face Swap — nur mit Consent und Shell-Status.", 65, true);
  }

  if (goal.includes("lora") || goal.includes("training")) {
    pushRec("lora-training", "LoRA/Training folgt auf AI Creator Handoff — derzeit Shell-only.", 50, true);
  }

  for (const { cap, score } of scored) {
    if (recommendations.some((r) => r.toolId === cap.toolId)) continue;
    if (optionalTools.some((r) => r.toolId === cap.toolId)) continue;
    if (score >= 3) {
      pushRec(cap.toolId, `Passt zum Ziel (${cap.useCases[0] ?? cap.label}).`, score, score < 5);
    }
  }

  recommendations.sort((a, b) => b.priority - a.priority);
  optionalTools.sort((a, b) => b.priority - a.priority);

  if (isVideoGoal(goal) && isInfluencerGoal(goal)) {
    pushRec("viral-hook", "Optional: Hook vor dem Video für besseren TikTok-Einstieg.", 40, true);
    workflowSteps.push(
      "7. Optional: Viral Hook für Einstieg generieren.",
      "8. Provider-Ausführung ist deaktiviert — nichts wird generiert oder trainiert."
    );
  } else {
    workflowSteps.push(
      "Hinweis: Provider-Ausführung ist deaktiviert — Planung und Routing only."
    );
  }

  return {
    goal: goalInput.trim(),
    providerDisabledNotice:
      "Provider-Ausführung ist in dieser Umgebung deaktiviert. Es wird nichts generiert, trainiert oder hochgeladen.",
    recommendedAspectRatio,
    recommendations,
    workflowSteps,
    optionalTools,
  };
}

export function getNextWorkflowSteps(
  toolId: string,
  context: WorkflowStepContext = {}
): string[] {
  const cap = getToolCapabilityById(toolId);
  if (!cap) return [];

  const steps: string[] = [];

  if (toolId === "ai-creator") {
    if (!context.hasCharacterDraft) {
      steps.push("Character Draft anlegen (Name, Typ, Brief).");
    }
    if (!context.consentConfirmed) {
      steps.push("Consent bestätigen — Pflicht vor Handoff/Upload.");
    }
    if (context.hasCharacterDraft && context.consentConfirmed && !context.handoffReady) {
      steps.push("Draft für Upload vorbereiten (handoff_ready).");
    }
    if (context.handoffReady && !context.uploadPending) {
      steps.push("Upload-Shell vorbereiten (upload_pending) — kein echter Upload.");
    }
    if (context.uploadPending) {
      steps.push("Weiter zu Image Studio oder Image-to-Video für Content-Produktion.");
    }
  }

  for (const nextId of cap.nextSteps) {
    const nextCap = getToolCapabilityById(nextId);
    if (nextCap) {
      steps.push(`Nächster Schritt: ${nextCap.label} (${nextCap.safeRoutingTarget}).`);
    }
  }

  if (cap.executionStatus === "provider_disabled" || cap.executionStatus === "shell_only") {
    steps.push(cap.providerDisabledMessage);
  }

  return steps;
}

export { getToolCapabilities, getToolCapabilityById, getProviderDisabledAgentMessage } from "@/lib/tools/agent-tool-capability-map";

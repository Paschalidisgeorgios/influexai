import {
  getAgentToolById,
  listAgentTools,
  type AgentToolRegistryItem,
  type AgentToolRiskLevel,
} from "./tool-registry";

/** v0 — registry-based planning only. Not wired to /api/agent or orchestrator. */

export type AgentPlannerDecision =
  | "execute_auto"
  | "ask_clarifying_question"
  | "confirm_cost"
  | "require_consent"
  | "redirect_to_tool"
  | "preview_only"
  | "not_agent_ready"
  | "unsupported";

export type AgentPlannerStep = {
  toolId: string;
  label: string;
  decision: AgentPlannerDecision;
  reason: string;
  estimatedCredits?: {
    min?: number;
    max?: number;
    note?: string;
  };
  requiredInputs?: string[];
  missingInputs?: string[];
  requiresConsent?: boolean;
  requiresUpload?: boolean;
  riskLevel?: AgentToolRiskLevel;
};

export type AgentPlannerInput = {
  prompt: string;
  locale?: "de" | "en";
  userConfirmedCost?: boolean;
  userConfirmedConsent?: boolean;
  availableCredits?: number;
  preferredToolId?: string;
};

export type AgentPlannerResult = {
  decision: AgentPlannerDecision;
  summary: string;
  clarificationQuestion?: string;
  confirmationMessage?: string;
  selectedTools: AgentPlannerStep[];
  rejectedTools?: AgentPlannerStep[];
  estimatedTotalCredits?: {
    min?: number;
    max?: number;
    note?: string;
  };
  warnings: string[];
};

const HIGH_CREDIT_THRESHOLD = 20;
const CONFIRM_COST_MIN = 5;

type PromptSignal = {
  toolIds: string[];
  pattern: RegExp;
  priority: number;
};

const PROMPT_SIGNALS: PromptSignal[] = [
  {
    toolIds: ["campaign_autopilot"],
    pattern:
      /kampagne|campaign|autopilot|content.?plan.?30|komplette.?kampagne/i,
    priority: 10,
  },
  {
    toolIds: ["face_swap"],
    pattern: /face.?swap|gesicht.?tausch|gesicht.?ersetzen/i,
    priority: 10,
  },
  {
    toolIds: ["ki_ich"],
    pattern: /mein.?ki.?ich|ki.?ich|ai.?self|mein.?gesicht|avatar.?selfie/i,
    priority: 9,
  },
  {
    toolIds: ["lora_training"],
    pattern: /lora|trainieren|charakter.?konsistent|custom.?model/i,
    priority: 9,
  },
  {
    toolIds: ["ugc_video"],
    pattern: /ugc|user.?generated.?content|authentische.?ad/i,
    priority: 8,
  },
  {
    toolIds: ["viral_hook"],
    pattern: /hook|hooks|scroll.?stopper|tiktok.?hook|viral.?hook/i,
    priority: 8,
  },
  {
    toolIds: ["content_kalender"],
    pattern: /kalender|content.?plan|30.?tage|posting.?plan|contentplan/i,
    priority: 7,
  },
  {
    toolIds: ["trend_script", "competitor"],
    pattern:
      /aktuelle.?trends|live.?research|trend.?recherche|youtube.?trends|was.?läuft.?gerade/i,
    priority: 7,
  },
  {
    toolIds: ["trend_script"],
    pattern: /trend.?script|trend.?skript|trend.?video/i,
    priority: 6,
  },
  {
    toolIds: ["competitor"],
    pattern: /konkurrenz|competitor|kanal.?analys|youtube.?kanal/i,
    priority: 6,
  },
  {
    toolIds: ["image_generator"],
    pattern: /bild.?generier|foto.?generier|image.?gener|flux|ki.?bild/i,
    priority: 6,
  },
  {
    toolIds: ["image_generator"],
    pattern: /\b(bild|foto|image|visual|poster)\b/i,
    priority: 4,
  },
  {
    toolIds: ["script_generator", "trend_script"],
    pattern: /script|skript|reel.?script|shorts.?script/i,
    priority: 5,
  },
  {
    toolIds: ["niche_analyzer"],
    pattern: /nische|niche.?analys|profitable.?nische/i,
    priority: 5,
  },
  {
    toolIds: ["outlier_detector"],
    pattern: /outlier|virale.?videos.?finden/i,
    priority: 5,
  },
  {
    toolIds: ["thumbnail_concept"],
    pattern: /thumbnail|ctr.?konzept/i,
    priority: 5,
  },
  {
    toolIds: ["viral_score"],
    pattern: /viral.?score|viralit/i,
    priority: 5,
  },
  {
    toolIds: ["produkt_werbung"],
    pattern: /produkt.?werbung|product.?ad|werbespot/i,
    priority: 5,
  },
  {
    toolIds: ["seedance"],
    pattern: /seedance|bild.?zu.?video|image.?to.?video|animier/i,
    priority: 5,
  },
  {
    toolIds: ["video_remix"],
    pattern: /video.?remix|remix.?video/i,
    priority: 5,
  },
  {
    toolIds: ["stimme_musik"],
    pattern: /stimme|voice.?clone|voiceover|musik.?generier/i,
    priority: 5,
  },
  {
    toolIds: ["live_creator"],
    pattern: /live.?creator|live.?avatar|face.?swap.?live/i,
    priority: 5,
  },
  {
    toolIds: ["gallery"],
    pattern: /gallery|galerie|meine.?creation/i,
    priority: 3,
  },
];

const RESEARCH_PROMPT =
  /aktuelle|live.?daten|recherche|research|echte.?daten|was.?trendet|trend.?daten/i;

const UPLOAD_HINT =
  /upload|hochladen|angehängt|anbei|dieses.?foto|dieses.?bild|datei|selfie/i;

const CHANNEL_URL_HINT =
  /youtube\.com|youtu\.be|@[\w.-]+|kanal.?url/i;

export function normalizePlannerPrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ");
}

export function findCandidateToolsForPrompt(
  prompt: string
): AgentToolRegistryItem[] {
  const normalized = normalizePlannerPrompt(prompt).toLowerCase();
  if (!normalized) return [];

  const scores = new Map<string, number>();

  for (const signal of PROMPT_SIGNALS) {
    if (!signal.pattern.test(normalized)) continue;
    for (const toolId of signal.toolIds) {
      scores.set(toolId, Math.max(scores.get(toolId) ?? 0, signal.priority));
    }
  }

  if (scores.size === 0) return [];

  const wantsResearch = RESEARCH_PROMPT.test(normalized);
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => getAgentToolById(id))
    .filter((tool): tool is AgentToolRegistryItem => Boolean(tool));

  if (!wantsResearch) return ranked;

  const withResearch = ranked.filter((tool) => tool.hasRealResearch);
  return withResearch.length > 0 ? withResearch : ranked;
}

export function requiresConfirmationForTool(
  tool: AgentToolRegistryItem,
  userConfirmedCost = false
): boolean {
  if (userConfirmedCost) return false;
  if (tool.executionMode === "confirm_required") return true;

  const min = tool.creditCost.min ?? 0;
  if (tool.creditCost.type === "variable" && min > 0) return true;
  if (tool.riskLevel === "high" && min > 0) return true;
  if (min >= CONFIRM_COST_MIN) return true;

  return false;
}

export function requiresConsentForTool(
  tool: AgentToolRegistryItem,
  userConfirmedConsent = false
): boolean {
  if (userConfirmedConsent) return false;
  return (
    tool.requiresConsent || tool.executionMode === "consent_required"
  );
}

function hasTopicLikeContent(prompt: string): boolean {
  const words = normalizePlannerPrompt(prompt).split(/\s+/).filter(Boolean);
  return words.length >= 4;
}

function inferMissingInputs(
  tool: AgentToolRegistryItem,
  prompt: string
): string[] {
  const normalized = normalizePlannerPrompt(prompt).toLowerCase();
  const missing: string[] = [];

  for (const input of tool.requiredInputs) {
    const key = input.toLowerCase();

    if (
      key.includes("topic") ||
      key.includes("niche") ||
      key.includes("prompt") ||
      key.includes("text") ||
      key.includes("productname") ||
      key.includes("title") ||
      key.includes("brief")
    ) {
      if (!hasTopicLikeContent(prompt)) missing.push(input);
      continue;
    }

    if (
      key.includes("upload") ||
      key.includes("face") ||
      key.includes("selfie") ||
      key.includes("image") ||
      key.includes("video") ||
      key.includes("media") ||
      key.includes("training")
    ) {
      if (!UPLOAD_HINT.test(normalized)) missing.push(input);
      continue;
    }

    if (key.includes("channelurl") || key.includes("channel")) {
      if (!CHANNEL_URL_HINT.test(normalized)) missing.push(input);
      continue;
    }

    if (key.includes("imageurl") || key.includes("motion")) {
      if (!UPLOAD_HINT.test(normalized) && !/https?:\/\//i.test(prompt)) {
        missing.push(input);
      }
    }
  }

  return missing;
}

function creditsFromTool(tool: AgentToolRegistryItem): AgentPlannerStep["estimatedCredits"] {
  return {
    min: tool.creditCost.min,
    max: tool.creditCost.max,
    note: tool.creditCost.note,
  };
}

function baseDecisionForTool(tool: AgentToolRegistryItem): AgentPlannerDecision {
  switch (tool.executionMode) {
    case "auto_allowed":
      return "execute_auto";
    case "confirm_required":
      return "confirm_cost";
    case "consent_required":
      return "require_consent";
    case "redirect_only":
      return "redirect_to_tool";
    case "preview_only":
      return "preview_only";
    case "not_agent_ready":
      return "not_agent_ready";
    default:
      return "unsupported";
  }
}

function resolveStepDecision(
  tool: AgentToolRegistryItem,
  input: AgentPlannerInput,
  missingInputs: string[]
): { decision: AgentPlannerDecision; reason: string } {
  if (tool.executionMode === "not_agent_ready") {
    return {
      decision: "not_agent_ready",
      reason: `${tool.label} ist in der Registry als nicht agent-ready markiert.`,
    };
  }

  if (tool.executionMode === "preview_only") {
    return {
      decision: "preview_only",
      reason:
        tool.confirmationRequiredReason ??
        `${tool.label} ist Preview/Mock — kein autonomer Agent.`,
    };
  }

  if (tool.executionMode === "redirect_only") {
    return {
      decision: "redirect_to_tool",
      reason: `${tool.label} erfordert Dashboard/Upload — Weiterleitung statt Chat-Ausführung.`,
    };
  }

  if (requiresConsentForTool(tool, input.userConfirmedConsent)) {
    return {
      decision: "require_consent",
      reason:
        tool.confirmationRequiredReason ??
        `${tool.label} erfordert Einwilligung (Gesicht/Stimme/Upload).`,
    };
  }

  if (missingInputs.length > 0) {
    return {
      decision: "ask_clarifying_question",
      reason: `Fehlende Angaben: ${missingInputs.join(", ")}`,
    };
  }

  if (requiresConfirmationForTool(tool, input.userConfirmedCost)) {
    return {
      decision: "confirm_cost",
      reason:
        tool.confirmationRequiredReason ??
        `${tool.label} verursacht Provider-Kosten (${tool.creditCost.min ?? "?"}+ Credits).`,
    };
  }

  if (tool.autoRunAllowed && tool.executionMode === "auto_allowed") {
    return {
      decision: "execute_auto",
      reason: `${tool.label} ist laut Registry auto-fähig (Planung only — keine Ausführung).`,
    };
  }

  return {
    decision: baseDecisionForTool(tool),
    reason: `${tool.label} — Registry-Modus: ${tool.executionMode}`,
  };
}

export function buildClarifyingQuestion(
  steps: AgentPlannerStep[],
  locale: "de" | "en" = "de"
): string | undefined {
  const step = steps.find((s) => s.decision === "ask_clarifying_question");
  if (!step?.missingInputs?.length) {
    if (locale === "en") {
      return "What exactly should I create, and for which platform or product?";
    }
    return "Wofür genau soll ich etwas erstellen — Thema, Plattform oder Produkt?";
  }

  const missing = step.missingInputs.join(", ");
  if (locale === "en") {
    return `To use ${step.label}, I still need: ${missing}. Can you provide that?`;
  }
  return `Für ${step.label} fehlen noch: ${missing}. Kannst du das ergänzen?`;
}

export function buildConfirmationMessage(
  steps: AgentPlannerStep[],
  locale: "de" | "en" = "de"
): string | undefined {
  const costly = steps.filter((s) => s.decision === "confirm_cost");
  if (costly.length === 0) return undefined;

  const credits = estimatePlannerCredits(costly);
  const label = costly.map((s) => s.label).join(", ");

  if (locale === "en") {
    return `This plan uses ${label} and may cost about ${credits.min ?? "?"}–${credits.max ?? "?"} credits. Continue?`;
  }
  return `Dieser Plan nutzt ${label} (ca. ${credits.min ?? "?"}–${credits.max ?? "?"} Credits). Fortfahren?`;
}

export function estimatePlannerCredits(steps: AgentPlannerStep[]): {
  min?: number;
  max?: number;
  note?: string;
} {
  let min = 0;
  let max = 0;
  let hasOpenMax = false;
  const notes: string[] = [];

  for (const step of steps) {
    const c = step.estimatedCredits;
    if (!c) continue;
    if (c.min != null) min += c.min;
    if (c.max != null) {
      max += c.max;
    } else if (c.min != null) {
      max += c.min;
    } else {
      hasOpenMax = true;
    }
    if (c.note) notes.push(c.note);
  }

  return {
    min: min > 0 ? min : undefined,
    max: hasOpenMax ? undefined : max > 0 ? max : undefined,
    note: notes.length ? notes.join(" · ") : undefined,
  };
}

function buildPlannerStep(
  tool: AgentToolRegistryItem,
  input: AgentPlannerInput
): AgentPlannerStep {
  const missingInputs = inferMissingInputs(tool, input.prompt);
  const { decision, reason } = resolveStepDecision(tool, input, missingInputs);

  return {
    toolId: tool.id,
    label: tool.label,
    decision,
    reason,
    estimatedCredits: creditsFromTool(tool),
    requiredInputs: [...tool.requiredInputs],
    missingInputs: missingInputs.length ? missingInputs : undefined,
    requiresConsent: tool.requiresConsent,
    requiresUpload: tool.requiresUpload,
    riskLevel: tool.riskLevel,
  };
}

function collectResearchWarnings(
  prompt: string,
  steps: AgentPlannerStep[]
): string[] {
  if (!RESEARCH_PROMPT.test(normalizePlannerPrompt(prompt))) return [];

  const warnings: string[] = [];
  for (const step of steps) {
    const tool = getAgentToolById(step.toolId);
    if (tool && !tool.hasRealResearch) {
      warnings.push(
        `${tool.label} nutzt keine echte Live-Recherche — Ergebnisse können LLM-basiert sein.`
      );
    }
  }
  return warnings;
}

function collectCreditWarnings(
  input: AgentPlannerInput,
  total: { min?: number; max?: number }
): string[] {
  const warnings: string[] = [];
  const available = input.availableCredits;

  if (available == null) return warnings;

  const needed = total.max ?? total.min;
  if (needed != null && available < needed) {
    warnings.push(
      `Verfügbare Credits (${available}) reichen möglicherweise nicht (geschätzt ${needed}+).`
    );
  }

  if ((total.max ?? total.min ?? 0) >= HIGH_CREDIT_THRESHOLD) {
    warnings.push(
      `Hohe Credit-Schätzung (≥${HIGH_CREDIT_THRESHOLD}) — Kostenbestätigung empfohlen.`
    );
  }

  return warnings;
}

function aggregateDecision(steps: AgentPlannerStep[]): AgentPlannerDecision {
  const priority: AgentPlannerDecision[] = [
    "not_agent_ready",
    "preview_only",
    "unsupported",
    "require_consent",
    "ask_clarifying_question",
    "confirm_cost",
    "redirect_to_tool",
    "execute_auto",
  ];

  for (const decision of priority) {
    if (steps.some((s) => s.decision === decision)) return decision;
  }

  return "unsupported";
}

function buildSummary(
  decision: AgentPlannerDecision,
  steps: AgentPlannerStep[],
  locale: "de" | "en"
): string {
  const names = steps.map((s) => s.label).join(", ");
  const en = locale === "en";

  switch (decision) {
    case "execute_auto":
      return en
        ? `Plan: ${names} — eligible for auto-run (planner only, not executed).`
        : `Plan: ${names} — theoretisch auto-fähig (nur Planung, keine Ausführung).`;
    case "confirm_cost":
      return en
        ? `Plan: ${names} — credit confirmation required before execution.`
        : `Plan: ${names} — Kostenbestätigung vor Ausführung nötig.`;
    case "require_consent":
      return en
        ? `Plan: ${names} — consent required before execution.`
        : `Plan: ${names} — Einwilligung vor Ausführung nötig.`;
    case "redirect_to_tool":
      return en
        ? `Plan: ${names} — redirect to dashboard tool recommended.`
        : `Plan: ${names} — Weiterleitung ins Dashboard empfohlen.`;
    case "preview_only":
      return en
        ? `Plan: ${names} — preview/mock only, not a live autonomous agent.`
        : `Plan: ${names} — nur Preview/Mock, kein autonomer Live-Agent.`;
    case "ask_clarifying_question":
      return en
        ? `Plan: ${names} — more input needed before execution.`
        : `Plan: ${names} — Rückfrage nötig vor Ausführung.`;
    case "not_agent_ready":
      return en
        ? `Plan: ${names} — tool not agent-ready in registry.`
        : `Plan: ${names} — Tool laut Registry nicht agent-ready.`;
    default:
      return en
        ? "No matching agent tool found for this request."
        : "Kein passendes Agent-Tool für diese Anfrage gefunden.";
  }
}

/**
 * Registry-based planner v0 — decides what could run, never executes tools.
 */
export function planAgentTask(input: AgentPlannerInput): AgentPlannerResult {
  const locale = input.locale ?? "de";
  const prompt = normalizePlannerPrompt(input.prompt);
  const warnings: string[] = [];

  if (!prompt) {
    return {
      decision: "ask_clarifying_question",
      summary:
        locale === "en"
          ? "Empty prompt — please describe your task."
          : "Leere Anfrage — bitte beschreibe deine Aufgabe.",
      clarificationQuestion:
        locale === "en"
          ? "What would you like to create or analyze?"
          : "Was möchtest du erstellen oder analysieren?",
      selectedTools: [],
      warnings: [],
    };
  }

  let candidates: AgentToolRegistryItem[];

  if (input.preferredToolId) {
    const preferred = getAgentToolById(input.preferredToolId);
    candidates = preferred ? [preferred] : [];
  } else {
    candidates = findCandidateToolsForPrompt(prompt);
  }

  if (candidates.length === 0) {
    return {
      decision: "unsupported",
      summary:
        locale === "en"
          ? "No registry tool matches this prompt."
          : "Kein Registry-Tool passt zu dieser Anfrage.",
      clarificationQuestion: buildClarifyingQuestion([], locale),
      selectedTools: [],
      warnings: [],
    };
  }

  const primary = candidates[0];
  const secondary = candidates.slice(1, 3);
  const selectedTools = [buildPlannerStep(primary, input)];

  for (const tool of secondary) {
    if (
      tool.id !== primary.id &&
      !selectedTools.some((s) => s.toolId === tool.id)
    ) {
      selectedTools.push(buildPlannerStep(tool, input));
    }
  }

  warnings.push(...collectResearchWarnings(prompt, selectedTools));

  const estimatedTotalCredits = estimatePlannerCredits(selectedTools);
  warnings.push(...collectCreditWarnings(input, estimatedTotalCredits));

  const decision = aggregateDecision(selectedTools);
  const summary = buildSummary(decision, selectedTools, locale);

  const rejectedTools = listAgentTools()
    .filter(
      (tool) =>
        !selectedTools.some((s) => s.toolId === tool.id) &&
        tool.executionMode === "not_agent_ready"
    )
    .slice(0, 3)
    .map((tool) => buildPlannerStep(tool, input));

  return {
    decision,
    summary,
    clarificationQuestion:
      decision === "ask_clarifying_question"
        ? buildClarifyingQuestion(selectedTools, locale)
        : decision === "unsupported"
          ? buildClarifyingQuestion([], locale)
          : undefined,
    confirmationMessage:
      decision === "confirm_cost"
        ? buildConfirmationMessage(selectedTools, locale)
        : undefined,
    selectedTools,
    rejectedTools: rejectedTools.length ? rejectedTools : undefined,
    estimatedTotalCredits,
    warnings,
  };
}

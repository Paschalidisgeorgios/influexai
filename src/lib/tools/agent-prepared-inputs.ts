/**
 * Agent prepared workspace inputs — Phase 4G.4W.
 * Pure helpers: no provider payloads, files, or execution.
 */

import type { WorkflowStage } from "@/lib/tools/agent-tool-capability-map";
import { getToolCapabilityById } from "@/lib/tools/agent-tool-capability-map";
import type { AgentToolHandoff } from "@/lib/tools/agent-tool-handoff";
import {
  FORBIDDEN_CTA_PHRASES,
  getRecommendationCtaLabel,
} from "@/lib/tools/agent-recommendation-ui";

export type PreparedInputChecklistItem = {
  id: string;
  label: string;
  description?: string;
  required: boolean;
};

export type AgentPreparedInputs = {
  originalGoal: string;
  toolId: string;
  recommendedAspectRatio: string | null;
  suggestedPrompt: string;
  suggestedPromptPlaceholder: string;
  inputChecklist: PreparedInputChecklistItem[];
  outputExpectation: string;
  workflowStage: WorkflowStage;
  workflowStageLabel: string;
  safeNextStep: string;
  disabledExecutionMessage: string;
  safeCtaLabel: string;
};

export const ALLOWED_PREPARED_CTA_LABELS = [
  "Eingaben prüfen",
  "Vorbereitung fortsetzen",
  "Briefing vorbereiten",
  "Tool öffnen",
  "Vorbereitung anzeigen",
] as const;

const FORBIDDEN_PREPARED_PATTERNS = [
  /api[_-]?key/i,
  /data:[^;]+;base64,/i,
  /providerpayload/i,
  /service_role/i,
] as const;

const VERTICAL_GOAL_PATTERN =
  /tiktok|reels|shorts|9:16|vertical|story|instagram story/i;

function goalMentionsVerticalFormat(goal: string): boolean {
  return VERTICAL_GOAL_PATTERN.test(goal);
}

export function isSafeCtaLabel(label: string): boolean {
  const lower = label.trim().toLowerCase();
  if (FORBIDDEN_CTA_PHRASES.some((phrase) => lower.includes(phrase))) {
    return false;
  }
  if (/video erstellen|jetzt generieren|training starten|upload starten/.test(lower)) {
    return false;
  }
  return ALLOWED_PREPARED_CTA_LABELS.some(
    (allowed) => allowed.toLowerCase() === lower
  );
}

export function isPreparedInputsSafe(prepared: AgentPreparedInputs): boolean {
  const serialized = JSON.stringify(prepared);
  if (serialized.length > 16_000) return false;
  if (FORBIDDEN_PREPARED_PATTERNS.some((p) => p.test(serialized))) return false;
  if (!isSafeCtaLabel(prepared.safeCtaLabel)) return false;
  return true;
}

export function resolveRecommendedAspectRatio(
  goal: string,
  handoffRatio: string | null,
  toolId: string
): string | null {
  if (goalMentionsVerticalFormat(goal)) return "9:16";
  if (handoffRatio) return handoffRatio;
  const cap = getToolCapabilityById(toolId);
  return cap?.recommendedAspectRatios[0] ?? null;
}

export function buildSuggestedPrompt(goal: string, toolId: string): string {
  const trimmed = goal.trim();
  const vertical = goalMentionsVerticalFormat(trimmed);

  switch (toolId) {
    case "ai-creator":
      return trimmed
        ? `Character für: ${trimmed}. Persona, Consent und Draft vorbereiten — ohne Training oder Upload.`
        : "Character-Name, Typ und Consent vorbereiten.";
    case "img-to-video":
      return vertical
        ? `Vertical Motion-Clip (${trimmed}): ruhige Kamerafahrt, AI-Influencer im Fokus, klarer Hook-Moment in den ersten Sekunden.`
        : `Motion-Clip vorbereiten: ${trimmed || "Startbild in sanfte Bewegung überführen."}`;
    case "text-to-video":
      return vertical
        ? `9:16 Kurzclip-Idee: ${trimmed}. Eine Szene, klare Stimmung, kein Render in dieser Umgebung.`
        : trimmed || "Szenenbeschreibung für einen kurzen Clip formulieren.";
    case "viral-hook":
      return trimmed
        ? `Hook-Ideen für: ${trimmed}. Zielgruppe und Plattform kurz mitdenken.`
        : "Thema und Zielgruppe für Hook-Varianten skizzieren.";
    case "content-calendar":
      return trimmed
        ? `Content-Plan skizzieren für: ${trimmed}. Rhythmus und Formate strukturieren — ohne Auto-Posting.`
        : "Brand, Zeitraum und Plattformen für einen Redaktionsplan notieren.";
    default:
      return trimmed || "Briefing für dieses Tool vorbereiten.";
  }
}

export function buildSuggestedPromptPlaceholder(toolId: string): string {
  switch (toolId) {
    case "img-to-video":
      return "z.B. Langsame Kamerafahrt — AI-Influencer winkt in die Kamera (9:16 TikTok)";
    case "text-to-video":
      return "z.B. AI-Influencer stellt Produkt vor, urbaner Hintergrund, dynamischer Schnitt";
    case "viral-hook":
      return "z.B. Zielgruppe: Fitness-Creator · Thema: AI-Influencer · Plattform: TikTok";
    case "content-calendar":
      return "z.B. Brand: AI Influencer · Zeitraum: 7 Tage · Plattformen: TikTok, Reels";
    case "ai-creator":
      return "z.B. Fiktive AI-Influencer-Persona für TikTok-Reels vorbereiten";
    default:
      return "Briefing kurz formulieren — ohne Generierung in dieser Umgebung.";
  }
}

function mapChecklistItem(
  input: { id: string; label: string; description?: string },
  required: boolean
): PreparedInputChecklistItem {
  return {
    id: input.id,
    label: input.label,
    description: input.description,
    required,
  };
}

function enrichChecklistForTool(
  toolId: string,
  handoff: AgentToolHandoff,
  goal: string
): PreparedInputChecklistItem[] {
  const cap = getToolCapabilityById(toolId);
  const required = handoff.requiredInputs.map((i) => mapChecklistItem(i, true));
  const optional = (handoff.optionalInputs.length
    ? handoff.optionalInputs
    : cap?.optionalInputs ?? []
  ).map((i) => mapChecklistItem(i, false));

  switch (toolId) {
    case "ai-creator":
      return [
        ...required,
        {
          id: "draft_status",
          label: "Character Draft prüfen",
          description: "Existiert ein vollständiger Draft für den AI-Influencer?",
          required: true,
        },
        {
          id: "handoff_ready",
          label: "Handoff-ready Status",
          description: "Nur vorbereiten — kein echtes Training oder Upload.",
          required: false,
        },
        {
          id: "upload_shell",
          label: "Upload-Shell-Status",
          description: "Status verstehen, ohne Upload auszuführen.",
          required: false,
        },
      ];
    case "img-to-video":
      return [
        {
          id: "start_image",
          label: "Startbild",
          description: "URL oder Galerie-Asset — Pflicht für Image-to-Video.",
          required: true,
        },
        {
          id: "motion_prompt",
          label: "Bewegungsbeschreibung",
          description: "Welche Bewegung soll aus dem Startbild entstehen?",
          required: true,
        },
        ...optional,
      ];
    case "text-to-video":
      return [
        {
          id: "scene_prompt",
          label: "Script / Szenenbeschreibung",
          description: "Kurzes Briefing für den Clip — kein Render in dieser Umgebung.",
          required: true,
        },
        {
          id: "style_look",
          label: "Stil / Look",
          description: "Optional: Stimmung, Setting oder Look-and-feel.",
          required: false,
        },
        ...optional.filter((i) => i.id !== "style_look"),
      ];
    case "viral-hook":
      return [
        {
          id: "audience",
          label: "Zielgruppe",
          description: goalMentionsVerticalFormat(goal)
            ? "Kurz halten — z.B. TikTok-Creator oder AI-Influencer-Fans."
            : "Für wen ist der Hook gedacht?",
          required: true,
        },
        {
          id: "topic",
          label: "Thema",
          description: handoff.originalGoal,
          required: true,
        },
        {
          id: "platform",
          label: "Plattform",
          description: goalMentionsVerticalFormat(goal)
            ? "TikTok / Reels / Shorts empfohlen."
            : "Wo soll der Hook eingesetzt werden?",
          required: true,
        },
      ];
    case "content-calendar":
      return [
        {
          id: "industry_brand",
          label: "Branche / Brand",
          description: "Worum geht es inhaltlich?",
          required: true,
        },
        {
          id: "timeframe",
          label: "Zeitraum",
          description: "z.B. 7 oder 30 Tage — nur Planung, kein Auto-Posting.",
          required: true,
        },
        {
          id: "platforms",
          label: "Plattformen",
          description: goalMentionsVerticalFormat(goal)
            ? "TikTok, Reels, Shorts priorisieren."
            : "Welche Kanäle sollen im Plan vorkommen?",
          required: true,
        },
      ];
    default:
      return [...required, ...optional];
  }
}

function resolveOutputExpectation(toolId: string, handoff: AgentToolHandoff): string {
  switch (toolId) {
    case "viral-hook":
      return "Hook-Varianten (Text), Psychologie-Hinweis — kein Galerie- oder Video-Output.";
    case "content-calendar":
      return "Kalender- und Ideenstruktur — kein automatisches Posting oder Rendering.";
    case "ai-creator":
      return handoff.outputs.join(", ");
    default:
      return handoff.outputs.join(", ");
  }
}

function resolveSafeCtaLabel(toolId: string): string {
  const cap = getToolCapabilityById(toolId);
  const label = getRecommendationCtaLabel(
    cap?.executionStatus ?? "provider_disabled"
  );
  if (isSafeCtaLabel(label)) return label;
  return "Eingaben prüfen";
}

export function buildAgentPreparedInputs(
  handoff: AgentToolHandoff
): AgentPreparedInputs {
  const toolId = handoff.selectedToolId;
  const goal = handoff.originalGoal;
  const recommendedAspectRatio = resolveRecommendedAspectRatio(
    goal,
    handoff.recommendedAspectRatio,
    toolId
  );

  const prepared: AgentPreparedInputs = {
    originalGoal: goal,
    toolId,
    recommendedAspectRatio,
    suggestedPrompt: buildSuggestedPrompt(goal, toolId),
    suggestedPromptPlaceholder: buildSuggestedPromptPlaceholder(toolId),
    inputChecklist: enrichChecklistForTool(toolId, handoff, goal),
    outputExpectation: resolveOutputExpectation(toolId, handoff),
    workflowStage: handoff.workflowStage,
    workflowStageLabel: handoff.workflowStageLabel,
    safeNextStep: handoff.nextStepSummary,
    disabledExecutionMessage: handoff.providerDisabledMessage,
    safeCtaLabel: resolveSafeCtaLabel(toolId),
  };

  if (!isPreparedInputsSafe(prepared)) {
    throw new Error("Unsafe prepared inputs rejected");
  }

  return prepared;
}

export function buildAgentPreparedInputsOrNull(
  handoff: AgentToolHandoff | null | undefined
): AgentPreparedInputs | null {
  if (!handoff) return null;
  try {
    return buildAgentPreparedInputs(handoff);
  } catch {
    return null;
  }
}

/** Apply non-destructive workspace hints (aspect ratio, prompt draft). */
export function applyPreparedInputsToWorkspaceState(
  prepared: AgentPreparedInputs,
  current: { prompt?: string; aspectRatio?: string }
): { prompt?: string; aspectRatio?: string } {
  const next: { prompt?: string; aspectRatio?: string } = {};

  if (prepared.recommendedAspectRatio === "9:16" && current.aspectRatio === "16:9") {
    next.aspectRatio = "9:16";
  }

  if (!current.prompt?.trim() && prepared.suggestedPrompt) {
    next.prompt = prepared.suggestedPrompt;
  }

  return next;
}

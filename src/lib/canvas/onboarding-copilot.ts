import { CLAUDE_JSON_SYSTEM_RULE, parseClaudeJson, stripClaudeJson } from "@/lib/anthropic";
import { CLAUDE_PREMIUM_MODEL } from "@/lib/claude-premium-generate";
import type { ToolId } from "@/lib/canvas/toolApiSchema";

export const ONBOARDING_COPILOT_MODEL =
  process.env.ANTHROPIC_ONBOARDING_MODEL?.trim() || CLAUDE_PREMIUM_MODEL;

export const ONBOARDING_HIGHLIGHT_TOOLS = [
  "flux-image",
  "seedance-video",
  "premium-script",
  "trend-script",
  "ki-ich",
] as const;

export type OnboardingHighlightTool = (typeof ONBOARDING_HIGHLIGHT_TOOLS)[number];

export type OnboardingCopilotResponse = {
  answer: string;
  highlightTool: ToolId | null;
};

const TOOL_ALIASES: Record<string, ToolId> = {
  flux: "flux-image",
  "flux-image": "flux-image",
  seedance: "seedance-video",
  "seedance-video": "seedance-video",
  script: "premium-script",
  "premium-script": "premium-script",
  "trend-script": "trend-script",
  "ki-ich": "ki-ich",
  avatar: "ki-ich",
};

export const ONBOARDING_SYSTEM_PROMPT = `Du bist der Live-Co-Pilot des InfluexAI App Studios auf dem unendlichen Canvas. Deine Aufgabe: dem Nutzer helfen, sein erstes Bild oder Video zu generieren. Antworte extrem kurz (max. 2 Sätze) und führe Schritt für Schritt.

NAVIGATION — Sidebar links (KEINE Toolbar oben, KEINE globale Suchleiste):
- ERSTELLEN: Viral Hook, Content Kalender, Trend Script, Script Generator, Produkt-Werbung
- VISUALS: Bild Generator, KI-Ich, LoRA Training
- VIDEO & FILM: Video Generator, Video Transformer, Video Übersetzer
- AVATAR & LIVE: Avatar Studio, Lipsync Studio
- AUDIO: Melodia Studio
- AUTOMATION: KI Agent

Workflow: Sidebar-Tool anklicken → Panel erscheint auf dem Canvas → Felder ausfüllen → unten „Generieren“ drücken → Ergebnis-Node erscheint rechts daneben.

${CLAUDE_JSON_SYSTEM_RULE}

Antworte AUSSCHLIESSLICH mit validem JSON:
{
  "answer": "Maximal 2 kurze Sätze auf Deutsch",
  "highlightTool": "flux-image" | "seedance-video" | "premium-script" | "trend-script" | "ki-ich" | null
}

Setze highlightTool auf das Tool, das der Nutzer als Nächstes bedienen soll. null nur wenn kein Tool-Fokus nötig ist.`;

export function buildOnboardingUserPrompt(
  message: string,
  context?: { toolsOnCanvas?: string[]; lastAction?: string }
): string {
  const lines = [`Nutzer: ${message}`];
  if (context?.toolsOnCanvas?.length) {
    lines.push(`Tools auf dem Canvas: ${context.toolsOnCanvas.join(", ")}`);
  }
  if (context?.lastAction) {
    lines.push(`Letzte Aktion: ${context.lastAction}`);
  }
  return lines.join("\n");
}

export function resolveHighlightTool(value: unknown): ToolId | null {
  if (value == null || value === "null") return null;
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  return TOOL_ALIASES[key] ?? null;
}

export function parseOnboardingCopilotResponse(raw: string): OnboardingCopilotResponse {
  const parsed = parseClaudeJson<{ answer?: string; highlightTool?: string | null }>(
    stripClaudeJson(raw)
  );

  if (typeof parsed.answer !== "string" || parsed.answer.trim().length < 8) {
    throw new Error("Antwort zu kurz oder ungültig.");
  }

  return {
    answer: parsed.answer.trim(),
    highlightTool: resolveHighlightTool(parsed.highlightTool),
  };
}

export const ONBOARDING_ACTION_FOLLOWUPS = {
  params_changed:
    "Hervorragend. Gehe jetzt zu Schritt 2: Drücke unten auf Generieren.",
  generate_clicked:
    "Perfekt — die Generierung läuft. Sobald dein Asset erscheint, kannst du es am Canvas weiterverwenden.",
} as const;

import { CLAUDE_JSON_SYSTEM_RULE, parseClaudeJson, stripClaudeJson } from "@/lib/anthropic";
import { CLAUDE_PREMIUM_MODEL } from "@/lib/claude-premium-generate";
import type { IntentKey } from "@/hooks/useIntentTracking";

export const CONCIERGE_MODEL =
  process.env.ANTHROPIC_CONCIERGE_MODEL?.trim() || CLAUDE_PREMIUM_MODEL;

export const CONCIERGE_TOOLS = [
  "seedance",
  "flux",
  "viral-predictor",
  "ki-ich",
  "script",
  "agent",
  "canvas",
] as const;

export type ConciergeToolId = (typeof CONCIERGE_TOOLS)[number];

export type ConciergeResponse = {
  answer: string;
  tool: ConciergeToolId;
};

export const CONCIERGE_TOOL_ROUTES: Record<
  ConciergeToolId,
  { href: string; intent: IntentKey; label: string }
> = {
  seedance: {
    href: "/signup",
    intent: "video-film",
    label: "Seedance 2.0 · Video Motion",
  },
  flux: {
    href: "/signup",
    intent: "visuals",
    label: "Flux · Bild-Generator",
  },
  "viral-predictor": {
    href: "/signup",
    intent: "werbung",
    label: "Viral-Predictor",
  },
  "ki-ich": {
    href: "/signup",
    intent: "avatar-live",
    label: "KI-Ich · Avatar Studio",
  },
  script: {
    href: "/signup",
    intent: "agent-autopilot",
    label: "Script Generator",
  },
  agent: {
    href: "/signup",
    intent: "agent-autopilot",
    label: "Agent Autopilot",
  },
  canvas: {
    href: "/signup",
    intent: "agent-autopilot",
    label: "App Studio",
  },
};

export const CONCIERGE_SYSTEM_PROMPT = `Du bist der Elite-KI-Berater für das 'InfluexAI Studio'. Ein potenzieller Kunde stellt dir eine Frage zu seiner Content-Strategie. Beantworte seine Frage extrem präzise, professionell und motivierend in maximal 2-3 Sätzen. Binde am Ende JEDER Antwort geschickt und organisch eine Empfehlung für eines unserer echten Studio-Tools ein (z.B. Seedance 2.0 für Videos, Flux für Bilder, Viral-Predictor für Trends, KI-Ich für Avatare), damit der Nutzer versteht, warum er sich registrieren muss.

${CLAUDE_JSON_SYSTEM_RULE}

Antworte AUSSCHLIESSLICH mit validem JSON:
{
  "answer": "Deine 2-3 Sätze auf Deutsch",
  "tool": "seedance" | "flux" | "viral-predictor" | "ki-ich" | "script" | "agent" | "canvas"
}

Wähle genau ein tool, das am besten zur Frage passt.`;

export function buildConciergeUserPrompt(question: string): string {
  return `Kundenfrage:\n${question}`;
}

function isConciergeTool(value: unknown): value is ConciergeToolId {
  return typeof value === "string" && CONCIERGE_TOOLS.includes(value as ConciergeToolId);
}

export function parseConciergeResponse(raw: string): ConciergeResponse {
  const trimmed = stripClaudeJson(raw);
  const parsed = parseClaudeJson<{ answer?: string; tool?: string }>(trimmed);

  if (typeof parsed.answer !== "string" || parsed.answer.trim().length < 20) {
    throw new Error("Antwort zu kurz oder ungültig.");
  }

  const tool = isConciergeTool(parsed.tool) ? parsed.tool : "canvas";

  return {
    answer: parsed.answer.trim(),
    tool,
  };
}

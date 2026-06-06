import { parseClaudeJson, CLAUDE_JSON_SYSTEM_RULE } from "@/lib/anthropic";

export const VIRAL_HOOK_SYSTEM_PROMPT = `Du bist ein viraler Short-Form Content Strategist. Analysiere YouTube-Videos und extrahiere Hook, Storytelling-Struktur und psychologische Trigger. ${CLAUDE_JSON_SYSTEM_RULE}`;

export const VIRAL_HOOK_CREDIT_COST = 3;

export type ExtractViralHookInput = {
  mode: "url" | "manual";
  youtubeUrl?: string;
  manualDescription?: string;
  userNiche?: string;
};

export type ViralHookResult = {
  hook: string;
  storytellingStructure: {
    problem: string;
    solution: string;
    cta: string;
  };
  whyViral: string;
  psychology: string;
  adaptedForNiche: string;
  nicheSuggestion: string;
  sourceTitle?: string;
};

export function buildViralHookUserPrompt(params: {
  title: string;
  description: string;
  channelTitle: string;
  manualDescription?: string;
  userNiche?: string;
  language: string;
}): string {
  const nicheHint = params.userNiche?.trim()
    ? `Passe die Version für die Nische an: ${params.userNiche.trim()}`
    : "Schlage eine passende Ziel-Nische vor und passe den Hook dafür an.";

  const sourceBlock = params.manualDescription?.trim()
    ? `Manuelle Beschreibung des Videos:\n${params.manualDescription.trim()}`
    : `YouTube Titel: ${params.title}\nKanal: ${params.channelTitle}\nBeschreibung:\n${params.description.slice(0, 1500)}`;

  return `Analysiere dieses virale Video und extrahiere die Storytelling-Mechanik.

${sourceBlock}

Sprache der Antwort: ${params.language}
${nicheHint}

JSON:
{
  "hook": "Erste 3 Sekunden — wörtlicher Hook-Vorschlag",
  "storytellingStructure": {
    "problem": "Problem-Setup",
    "solution": "Value / Story",
    "cta": "Call-to-Action"
  },
  "whyViral": "Warum ging das Video viral? (2-3 Sätze)",
  "psychology": "Welche psychologischen Trigger? (Neugier, FOMO, Contrarian, etc.)",
  "adaptedForNiche": "Deine angepasste Hook-Version für die Ziel-Nische",
  "nicheSuggestion": "Empfohlene Nische für Remix",
  "sourceTitle": "Original-Titel oder Kurztitel"
}`;
}

export function parseViralHookResult(raw: string): ViralHookResult {
  const parsed = parseClaudeJson<Record<string, unknown>>(raw);
  const structure = (parsed.storytellingStructure ??
    parsed.storytelling_structure ??
    {}) as Record<string, unknown>;

  const hook = String(parsed.hook ?? "").trim();
  if (!hook) throw new Error("Leerer Hook in der KI-Antwort.");

  return {
    hook,
    storytellingStructure: {
      problem: String(structure.problem ?? ""),
      solution: String(structure.solution ?? ""),
      cta: String(structure.cta ?? ""),
    },
    whyViral: String(parsed.whyViral ?? parsed.why_viral ?? ""),
    psychology: String(parsed.psychology ?? ""),
    adaptedForNiche: String(
      parsed.adaptedForNiche ?? parsed.adapted_for_niche ?? ""
    ),
    nicheSuggestion: String(
      parsed.nicheSuggestion ?? parsed.niche_suggestion ?? "Creator"
    ),
    sourceTitle: String(parsed.sourceTitle ?? parsed.source_title ?? ""),
  };
}

export function viralHookToScriptTopic(result: ViralHookResult): string {
  return `[HOOK] ${result.adaptedForNiche || result.hook}

[MAIN] Problem: ${result.storytellingStructure.problem}
Lösung: ${result.storytellingStructure.solution}

[CTA] ${result.storytellingStructure.cta}`.slice(0, 2000);
}

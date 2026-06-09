import {
  CLAUDE_JSON_SYSTEM_RULE,
  parseClaudeJson,
  stripClaudeJson,
} from "@/lib/anthropic";

/** 1 Credit pro Generierung — gleiches Pattern wie Thumbnail Concept. */
export const VIRAL_HOOK_EXTRACTOR_CREDIT_COST = 1;

export const VIRAL_HOOK_EXTRACTOR_SYSTEM_PROMPT = `Du bist ein viraler Short-Form Content Strategist für TikTok, YouTube Shorts und Instagram Reels.
Generiere scroll-stoppende Hooks für die ersten 3 Sekunden — variiert in Stil (Frage, Provokation, Story, Statistik, Contrarian, Pattern Interrupt).
Jeder Hook max. 15 Wörter, direkt sprechbar, ohne Anführungszeichen.
Antworte in der Sprache der User-Eingabe.
${CLAUDE_JSON_SYSTEM_RULE}`;

export function buildViralHookExtractorUserPrompt(
  input: string,
  qualityRetryHint?: string
): string {
  const base = `Generiere 6–8 virale Hooks für dieses Thema / diese Nische / dieses Transkript:

${input.trim()}

JSON:
{
  "hooks": ["Hook 1", "Hook 2", "Hook 3"]
}`;
  return qualityRetryHint ? `${base}\n\n${qualityRetryHint}` : base;
}

export function parseViralHookExtractorResult(raw: string): string[] {
  try {
    const parsed = parseClaudeJson<{ hooks?: unknown }>(raw);
    if (Array.isArray(parsed.hooks)) {
      const hooks = parsed.hooks
        .map((h) => String(h).trim())
        .filter((h) => h.length > 0);
      if (hooks.length) return hooks.slice(0, 12);
    }
  } catch {
    /* fallback below */
  }

  const text = stripClaudeJson(raw);
  const hooks = text
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^[\d]+[.)]\s*/, "")
        .replace(/^[-*•]\s*/, "")
        .replace(/^["']|["']$/g, "")
        .trim()
    )
    .filter((line) => line.length > 8 && line.length < 200);

  if (!hooks.length) {
    throw new Error("Keine Hooks in der KI-Antwort gefunden.");
  }

  return hooks.slice(0, 12);
}

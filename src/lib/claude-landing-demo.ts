import { CLAUDE_JSON_SYSTEM_RULE, parseClaudeJson, stripClaudeJson } from "@/lib/anthropic";
import { CLAUDE_PREMIUM_MODEL } from "@/lib/claude-premium-generate";

export const LANDING_DEMO_MODEL =
  process.env.ANTHROPIC_LANDING_DEMO_MODEL?.trim() || CLAUDE_PREMIUM_MODEL;

export const LANDING_DEMO_SYSTEM_PROMPT = `Du bist ein Elite-Viral-Stratege für TikTok, Reels und Shorts.
${CLAUDE_JSON_SYSTEM_RULE}

Antworte AUSSCHLIESSLICH mit:
{"idea":"..."}

Regeln für "idea":
- Deutsch, maximal 2 Sätze, unter 200 Zeichen
- Satz 1: starker Hook (Pattern-Interrupt)
- Satz 2: konkrete Video-Idee passend zur Nische
- Kein Markdown, keine Emojis außer optional einem am Anfang`;

export function buildLandingDemoUserPrompt(niche: string): string {
  return `Nische: ${niche}

Generiere JETZT eine virale Short-Video-Idee mit Hook für diese Nische. Trend-aware, 2026, scroll-stoppend.`;
}

export function parseLandingDemoIdea(raw: string): string {
  const trimmed = stripClaudeJson(raw);
  try {
    const parsed = parseClaudeJson<{ idea?: string }>(trimmed);
    if (typeof parsed.idea === "string" && parsed.idea.trim().length >= 12) {
      return parsed.idea.trim();
    }
  } catch {
    /* fall through */
  }

  const fallback = trimmed.replace(/^["']|["']$/g, "").trim();
  if (fallback.length >= 12) return fallback.slice(0, 220);
  throw new Error("Demo-Antwort ungültig.");
}

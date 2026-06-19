import { parseClaudeJson, CLAUDE_JSON_SYSTEM_RULE } from "@/lib/anthropic";

export const TREND_SCRIPT_SYSTEM_PROMPT = `Du bist ein viraler Short-Form Script Writer. Du verbindest aktuelle Trends mit Creator-Nischen und schreibst sofort umsetzbare Scripts mit [HOOK], [MAIN], [CTA]. ${CLAUDE_JSON_SYSTEM_RULE}`;

/** Aligned with /api/trend-script and credit-display SSOT. */
export { TREND_SCRIPT_TOOL_CREDIT_COST as TREND_SCRIPT_CREDIT_COST } from "@/lib/trend-script-tool";

export type GenerateTrendScriptInput = {
  trend: string;
  niche: string;
  platform: string;
  tone: string;
  language: "de" | "en";
};

export type TrendScriptResult = {
  trendAnalysis: {
    whyViral: string;
    audience: string;
    emotion: string;
  };
  nicheAdaptation: string;
  script: string;
  wordCount: number;
  estimatedSeconds: number;
};

export function buildTrendScriptUserPrompt(params: {
  trend: string;
  niche: string;
  platform: string;
  tone: string;
  language: string;
}): string {
  return `Analysiere den Trend und schreibe ein vollständiges Short-Form Script.

Trend / Keyword: ${params.trend}
Nische des Creators: ${params.niche}
Plattform: ${params.platform}
Ton: ${params.tone}
Sprache: ${params.language === "en" ? "Englisch" : "Deutsch"}

JSON:
{
  "trendAnalysis": {
    "whyViral": "Warum ist der Trend viral?",
    "audience": "Zielgruppe",
    "emotion": "Dominante Emotion"
  },
  "nicheAdaptation": "Wie der Trend zur Nische passt (2-3 Sätze)",
  "script": "Vollständiges Script mit Zeilen [HOOK], [MAIN], [CTA]",
  "wordCount": number,
  "estimatedSeconds": number
}`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function parseTrendScriptResult(raw: string): TrendScriptResult {
  const parsed = parseClaudeJson<Record<string, unknown>>(raw);
  const analysis = (parsed.trendAnalysis ??
    parsed.trend_analysis ??
    {}) as Record<string, unknown>;
  const script = String(parsed.script ?? "").trim();
  if (!script) throw new Error("Leeres Script in der KI-Antwort.");

  const wordCount =
    Number(parsed.wordCount ?? parsed.word_count) || countWords(script);
  const estimatedSeconds =
    Number(parsed.estimatedSeconds ?? parsed.estimated_seconds) ||
    Math.round(wordCount / 2.5);

  return {
    trendAnalysis: {
      whyViral: String(analysis.whyViral ?? analysis.why_viral ?? ""),
      audience: String(analysis.audience ?? ""),
      emotion: String(analysis.emotion ?? ""),
    },
    nicheAdaptation: String(
      parsed.nicheAdaptation ?? parsed.niche_adaptation ?? ""
    ),
    script,
    wordCount,
    estimatedSeconds,
  };
}

export function trendToThumbnailTopic(
  trend: string,
  niche: string,
  hookLine: string
): string {
  return `${trend} × ${niche}: ${hookLine}`.slice(0, 500);
}

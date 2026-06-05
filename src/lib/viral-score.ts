import {
  CLAUDE_JSON_SYSTEM_RULE,
  parseClaudeJson,
} from "@/lib/anthropic";

export const VIRAL_SCORE_CREDIT_COST = 2;

export const VIRAL_SCORE_SYSTEM_PROMPT = `Du bist ein YouTube Shorts Experte mit 10 Jahren Erfahrung.
Analysiere den gegebenen Content und bewerte ihn nach:
1. Hook Stärke (0-25): Ersten 3 Sekunden fesselnd?
2. Retention Potential (0-25): Bleibt Zuschauer bis Ende?
3. CTR Potential (0-25): Wird Thumbnail geklickt?
4. Trend Relevanz (0-25): Passt zu aktuellen Trends?

Antworte NUR als JSON:
{
  "total_score": number,
  "hook_score": number,
  "retention_score": number,
  "ctr_score": number,
  "trend_score": number,
  "strengths": string[],
  "improvements": string[],
  "improved_hook": string,
  "verdict": string
}
${CLAUDE_JSON_SYSTEM_RULE}`;

export const VIRAL_SCORE_LANGUAGE_OPTIONS = [
  { code: "de", label: "🇩🇪 Deutsch" },
  { code: "en", label: "🇬🇧 English" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "pt", label: "🇵🇹 Português" },
  { code: "tr", label: "🇹🇷 Türkçe" },
  { code: "ar", label: "🇸🇦 العربية" },
  { code: "el", label: "🇬🇷 Ελληνικά" },
] as const;

export type ViralScoreResult = {
  total_score: number;
  hook_score: number;
  retention_score: number;
  ctr_score: number;
  trend_score: number;
  strengths: string[];
  improvements: string[];
  improved_hook: string;
  verdict: string;
};

const LANG_LABELS: Record<string, string> = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português",
  tr: "Türkçe",
  ar: "العربية",
  el: "Ελληνικά",
};

export function normalizeViralScoreLanguage(lang?: string): string {
  const code = (lang ?? "de").trim().toLowerCase().slice(0, 2);
  return LANG_LABELS[code] ? code : "de";
}

export function buildViralScoreUserPrompt(input: {
  script: string;
  thumbnail_idea: string;
  niche: string;
  language: string;
}): string {
  const langCode = normalizeViralScoreLanguage(input.language);
  const langLabel = LANG_LABELS[langCode] ?? "Deutsch";

  return `Analysiere diesen YouTube Shorts Content. Antworte auf ${langLabel}.

Nische: ${input.niche.trim()}

Script:
${input.script.trim()}

Thumbnail-Idee:
${input.thumbnail_idea.trim()}`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  return items.length ? items : fallback;
}

export function parseViralScoreResult(raw: string): ViralScoreResult {
  const parsed = parseClaudeJson<Record<string, unknown>>(raw);

  const hook = clamp(Number(parsed.hook_score) || 0, 0, 25);
  const retention = clamp(Number(parsed.retention_score) || 0, 0, 25);
  const ctr = clamp(Number(parsed.ctr_score) || 0, 0, 25);
  const trend = clamp(Number(parsed.trend_score) || 0, 0, 25);
  const sum = hook + retention + ctr + trend;
  const total = clamp(
    Number(parsed.total_score) || sum,
    0,
    100
  );

  return {
    total_score: total,
    hook_score: hook,
    retention_score: retention,
    ctr_score: ctr,
    trend_score: trend,
    strengths: asStringArray(parsed.strengths, [
      "Starker Einstieg",
      "Klare Botschaft",
      "Passende Nische",
    ]),
    improvements: asStringArray(parsed.improvements, [
      "Hook schärfen",
      "Tempo erhöhen",
      "Thumbnail-Text kürzen",
    ]),
    improved_hook:
      typeof parsed.improved_hook === "string" && parsed.improved_hook.trim()
        ? parsed.improved_hook.trim()
        : "Starte mit einer Frage, die sofort Neugier weckt.",
    verdict:
      typeof parsed.verdict === "string" && parsed.verdict.trim()
        ? parsed.verdict.trim()
        : "Solides Fundament — mit Hook-Optimierung deutlich mehr Viral-Potenzial.",
  };
}

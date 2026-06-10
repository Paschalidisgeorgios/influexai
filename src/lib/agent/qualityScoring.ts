import { createAnthropicMessage } from "@/lib/anthropic";
import type { ContentScores, QualityDecision } from "./types";

const QUALITY_SCORER_MODEL = "claude-sonnet-4-5-20250929";

const QUALITY_SCORER_SYSTEM = `You are a strict quality evaluator for German-language social media content created for content creators. Score the given output from 0-100 based on: (1) Does it precisely fulfill the user's goal? (2) Is the German natural and idiomatic, not translated-sounding? (3) Is it specific and concrete instead of generic? (4) Does it fit the target platform's format and best practices? (5) Are hooks attention-grabbing within the first 3 words? Be harsh: generic AI-sounding content scores below 60. Respond ONLY with valid JSON, no markdown: {"score": number, "weaknesses": ["..."]}`;

export const QUALITY_RETRY_THRESHOLD = 70;

export type QualityScoreResult = {
  score: number;
  weaknesses: string[];
};

export function scoreTextContent(text: string): ContentScores {
  const t = text.toLowerCase();
  const claimRisk =
    /garantiert|spart.*€|sicher.*rendite|100%.*(gewinn|erfolg)|heilt|kuriert/i.test(
      t
    )
      ? "high"
      : "low";

  let brandFit = 75;
  if (text.length > 50 && text.length < 300) brandFit += 10;
  const ctaStrength = /kommentier|klick|folg|link|schreib|jetzt/i.test(t)
    ? 82
    : 55;
  const hookScore = /\?|—|\.\.\.|ich|du|stell dir vor/i.test(t) ? 88 : 65;
  const overallScore = Math.round((brandFit + ctaStrength + hookScore) / 3);
  return { brandFit, ctaStrength, hookScore, claimRisk, overallScore };
}

export function qualityDecision(scores: ContentScores): QualityDecision {
  const s = scores.overallScore ?? 0;
  if (scores.claimRisk === "high" || scores.legalRisk === "high")
    return "manual_review";
  if (s >= 90) return "accept";
  if (s >= 75) return "improve";
  return "regenerate";
}

function parseQualityScoreJson(raw: string): QualityScoreResult | null {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      score?: unknown;
      weaknesses?: unknown;
    };
    const score =
      typeof parsed.score === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.score)))
        : null;
    if (score == null) return null;
    const weaknesses = Array.isArray(parsed.weaknesses)
      ? parsed.weaknesses.map((w) => String(w).trim()).filter(Boolean)
      : [];
    return { score, weaknesses };
  } catch {
    return null;
  }
}

/** LLM quality gate for text tool outputs. Never throws — fallback score 100. */
export async function scoreOutput(
  toolName: string,
  userGoal: string,
  output: string
): Promise<QualityScoreResult> {
  const trimmedOutput = output.trim();
  if (!trimmedOutput) {
    return { score: 0, weaknesses: ["Empty output"] };
  }

  const user = `Tool: ${toolName}
User goal: ${userGoal.trim()}

Output to evaluate:
${trimmedOutput}`;

  try {
    const result = await createAnthropicMessage({
      model: QUALITY_SCORER_MODEL,
      maxTokens: 500,
      system: QUALITY_SCORER_SYSTEM,
      user,
    });

    if (!result.ok) {
      console.warn("[qualityScoring] scorer failed:", result.error);
      return { score: 100, weaknesses: [] };
    }

    const parsed = parseQualityScoreJson(result.text);
    if (!parsed) {
      console.warn("[qualityScoring] failed to parse scorer JSON");
      return { score: 100, weaknesses: [] };
    }

    return parsed;
  } catch (error) {
    console.warn("[qualityScoring] scorer error:", error);
    return { score: 100, weaknesses: [] };
  }
}

export function buildQualityRetryHint(weaknesses: string[]): string {
  const list =
    weaknesses.length > 0
      ? weaknesses.join("; ")
      : "zu generisch und wenig plattformspezifisch";
  return `Der vorherige Versuch hatte diese Schwächen: ${list}. Behebe sie vollständig. Sei konkreter, idiomatischer und plattformgerechter.`;
}

/** Shared quality gate: score + max 1 retry when score < 70. */
export { selectOutputWithQualityRetry as runWithQualityRetry };

export async function selectOutputWithQualityRetry<T>(params: {
  toolName: string;
  userGoal: string;
  toOutputText: (value: T) => string;
  generate: (retryHint?: string) => Promise<T>;
}): Promise<{ value: T; score: number; wasRetried: boolean }> {
  const first = await params.generate();
  const firstEval = await scoreOutput(
    params.toolName,
    params.userGoal,
    params.toOutputText(first)
  );
  console.log(
    "[quality]",
    params.toolName,
    "score:",
    firstEval.score,
    "retry:",
    false
  );

  if (firstEval.score >= QUALITY_RETRY_THRESHOLD) {
    return { value: first, score: firstEval.score, wasRetried: false };
  }

  const second = await params.generate(buildQualityRetryHint(firstEval.weaknesses));
  const secondEval = await scoreOutput(
    params.toolName,
    params.userGoal,
    params.toOutputText(second)
  );
  console.log(
    "[quality]",
    params.toolName,
    "score:",
    secondEval.score,
    "retry:",
    true
  );

  if (secondEval.score >= firstEval.score) {
    return { value: second, score: secondEval.score, wasRetried: true };
  }

  return { value: first, score: firstEval.score, wasRetried: true };
}

// TODO: Bild-QA anbinden (Anatomy, Hand/Finger, Face, Text Legibility)
// TODO: Video-QA anbinden (Scene Continuity, Face Consistency)
// Regel: Text/Logo NIE von Bild-KI generieren —
//   Motiv generieren, Text/Logo als echtes Overlay setzen

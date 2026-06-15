import type { AgentTrendInsight } from "./types";
import type { ViralPrediction } from "@/utils/viralPredictor";

export const SUBMIT_TREND_INSIGHT_TOOL = "submit_trend_insight" as const;

function clampScore(value: number): number {
  return Math.min(100, Math.max(1, Math.round(value)));
}

function normalizeKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    keywords.push(trimmed);
  }
  return keywords.slice(0, 8);
}

export function normalizeAgentTrendInsight(
  raw: unknown
): AgentTrendInsight | null {
  if (!raw || typeof raw !== "object") return null;

  const input = raw as Record<string, unknown>;
  const viralScore =
    typeof input.viralScore === "number"
      ? input.viralScore
      : typeof input.viralScore === "string"
        ? Number.parseFloat(input.viralScore)
        : Number.NaN;

  const detectedNiche =
    typeof input.detectedNiche === "string" ? input.detectedNiche.trim() : "";

  const htmlOrMarkdownOutput =
    typeof input.htmlOrMarkdownOutput === "string"
      ? input.htmlOrMarkdownOutput.trim()
      : "";

  const keywords = normalizeKeywords(input.keywords);

  if (
    !Number.isFinite(viralScore) ||
    !detectedNiche ||
    !htmlOrMarkdownOutput ||
    keywords.length === 0
  ) {
    return null;
  }

  return {
    viralScore: clampScore(viralScore),
    detectedNiche,
    keywords,
    htmlOrMarkdownOutput,
  };
}

export function agentTrendInsightToViralPrediction(
  insight: AgentTrendInsight
): ViralPrediction {
  return {
    score: insight.viralScore,
    matchedNiches: [insight.detectedNiche],
    suggestedKeywords: insight.keywords,
    matchedTrends: insight.keywords,
    breakdown: {
      base: 0,
      keywordMatches: 0,
      nicheBoost: 0,
      modifierBoost: 0,
      studioAlignment: 0,
    },
  };
}

import {
  CLAUDE_JSON_SYSTEM_RULE,
  parseClaudeJson,
} from "@/lib/anthropic";
import type { YouTubeChannelBundle } from "@/lib/youtube-channel";

export const COMPETITOR_ANALYSIS_CREDIT_COST = 5;

export const COMPETITOR_ANALYSIS_SYSTEM_PROMPT = `Du bist ein YouTube Stratege. Analysiere diese Kanal-Daten
und identifiziere: Top-Themen, Content-Gaps, beste Posting-Zeiten,
durchschnittliche Views, was funktioniert und was nicht.
Antworte NUR als JSON:
{
  "summary": "string",
  "avg_views": number,
  "posting_frequency": "string",
  "top_topics": string[],
  "content_gaps": string[],
  "best_performing_format": "string",
  "weaknesses": string[],
  "opportunities": string[]
}
${CLAUDE_JSON_SYSTEM_RULE}`;

export type CompetitorAnalysisResult = {
  summary: string;
  avg_views: number;
  posting_frequency: string;
  top_topics: string[];
  content_gaps: string[];
  best_performing_format: string;
  weaknesses: string[];
  opportunities: string[];
};

export type CompetitorAnalysisResponse = {
  channel: YouTubeChannelBundle["channel"];
  topVideos: YouTubeChannelBundle["topVideos"];
  analysis: CompetitorAnalysisResult;
};

function asStringArray(value: unknown, max = 6): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function parseCompetitorAnalysis(
  raw: string,
  bundle: YouTubeChannelBundle
): CompetitorAnalysisResult {
  const parsed = parseClaudeJson<Record<string, unknown>>(raw);

  return {
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : "Analyse abgeschlossen.",
    avg_views: Math.round(
      Number(parsed.avg_views) || bundle.computedAvgViews || 0
    ),
    posting_frequency:
      typeof parsed.posting_frequency === "string" &&
      parsed.posting_frequency.trim()
        ? parsed.posting_frequency.trim()
        : bundle.computedPostingFrequency,
    top_topics: asStringArray(parsed.top_topics, 8),
    content_gaps: asStringArray(parsed.content_gaps, 6),
    best_performing_format:
      typeof parsed.best_performing_format === "string"
        ? parsed.best_performing_format.trim()
        : "YouTube Shorts",
    weaknesses: asStringArray(parsed.weaknesses, 6),
    opportunities: asStringArray(parsed.opportunities, 6),
  };
}

export function buildCompetitorUserPrompt(bundle: YouTubeChannelBundle): string {
  const topList = bundle.topVideos
    .slice(0, 15)
    .map(
      (v, i) =>
        `${i + 1}. "${v.title}" — ${v.viewCount.toLocaleString("de-DE")} Views, ${v.publishedAt.slice(0, 10)}`
    )
    .join("\n");

  const recentList = bundle.recentVideos
    .slice(0, 10)
    .map(
      (v, i) =>
        `${i + 1}. "${v.title}" — ${v.publishedAt.slice(0, 10)}`
    )
    .join("\n");

  return `Kanal: ${bundle.channel.title}
Beschreibung: ${bundle.channel.description.slice(0, 800)}
Abonnenten: ${bundle.channel.subscriberCount.toLocaleString("de-DE")}
Gesamt-Views: ${bundle.channel.totalViews.toLocaleString("de-DE")}
Video-Anzahl: ${bundle.channel.videoCount}
Berechnete Ø Views (Top-50): ${bundle.computedAvgViews.toLocaleString("de-DE")}
Berechnete Posting-Frequenz: ${bundle.computedPostingFrequency}

Top Videos nach Views:
${topList || "(keine)"}

Neueste Videos:
${recentList || "(keine)"}

Analysiere auf Deutsch für einen Creator, der in derselben Nische konkurrieren will.`;
}

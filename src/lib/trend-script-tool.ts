import {
  CLAUDE_JSON_SYSTEM_RULE,
  parseClaudeJson,
  stripClaudeJson,
} from "@/lib/anthropic";
import type { TrendVideo } from "@/lib/youtube";

/** 3 Credits — YouTube-Quota + lange Script-Generierung. */
export const TREND_SCRIPT_TOOL_CREDIT_COST = 3;

export const TREND_SCRIPT_PLATFORMS = [
  "YouTube",
  "TikTok",
  "Reels",
] as const;

export type TrendScriptPlatform = (typeof TREND_SCRIPT_PLATFORMS)[number];

export const TREND_SCRIPT_REGIONS = [
  { id: "DE", label: "Deutschland (DE)" },
  { id: "US", label: "USA (US)" },
  { id: "UK", label: "UK" },
] as const;

export type TrendScriptRegion = (typeof TREND_SCRIPT_REGIONS)[number]["id"];

export type TrendScriptSource = {
  title: string;
  views: number;
};

export const TREND_SCRIPT_TOOL_SYSTEM_PROMPT = `Du bist ein viraler Short-Form Script Writer für Creator.
Analysiere aktuelle Trend-Videos und schreibe ein sofort umsetzbares Script für die gewählte Plattform.
Das Script braucht einen starken Hook (erste 3 Sekunden), klaren Story-Aufbau und CTA.
Nutze die Trend-Recherche als Inspiration — passe alles an Thema/Nische und Plattform an.
Antworte auf Deutsch, außer die Quellen sind klar englischsprachig und die Plattform US/UK.
${CLAUDE_JSON_SYSTEM_RULE}`;

export function formatTrendResearchBlock(trends: TrendVideo[]): string {
  return trends
    .slice(0, 8)
    .map((t, i) => {
      const viewsLabel = formatViewsCompact(t.views);
      return `${i + 1}. „${t.title}" (${viewsLabel} Views)\n   ${t.description.slice(0, 200)}`;
    })
    .join("\n\n");
}

export function formatViewsCompact(views: number): string {
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(views);
}

export function buildTrendScriptToolUserPrompt(params: {
  thema: string;
  plattform: string;
  trends: TrendVideo[];
}): string {
  const research = formatTrendResearchBlock(params.trends);

  return `Schreibe ein vollständiges Short-Form Video-Script basierend auf aktuellen Trends.

Thema / Nische: ${params.thema}
Plattform: ${params.plattform}

=== TREND-RECHERCHE (letzte 30 Tage, nach Views) ===
${research}

Leite Hook, Story und CTA aus den Mustern der Top-Videos ab. Script als Fließtext mit Zeilen [HOOK], [MAIN], [CTA].

JSON:
{
  "script": "Vollständiges Script mit [HOOK], [MAIN], [CTA]"
}`;
}

export function parseTrendScriptToolResult(raw: string): string {
  try {
    const parsed = parseClaudeJson<{ script?: unknown }>(raw);
    const script = String(parsed.script ?? "").trim();
    if (script) return script;
  } catch {
    /* fallback below */
  }

  const text = stripClaudeJson(raw).trim();
  if (text.length < 40) {
    throw new Error("Leeres Script in der KI-Antwort.");
  }
  return text;
}

export function trendVideosToSources(trends: TrendVideo[]): TrendScriptSource[] {
  return trends.slice(0, 8).map((t) => ({
    title: t.title,
    views: t.views,
  }));
}

export function isValidTrendScriptPlatform(
  value: string
): value is TrendScriptPlatform {
  return TREND_SCRIPT_PLATFORMS.includes(value as TrendScriptPlatform);
}

export function isValidTrendScriptRegion(
  value: string
): value is TrendScriptRegion {
  return TREND_SCRIPT_REGIONS.some((r) => r.id === value);
}

import {
  CLAUDE_JSON_SYSTEM_RULE,
  parseClaudeJson,
  stripClaudeJson,
} from "@/lib/anthropic";

/** 2 Credits pro Generierung — längere Kalender-Ausgabe. */
export const CONTENT_KALENDER_TOOL_CREDIT_COST = 2;

export const CONTENT_KALENDER_PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "LinkedIn",
] as const;

export type ContentKalenderPlatform =
  (typeof CONTENT_KALENDER_PLATFORMS)[number];

export const CONTENT_KALENDER_FREQUENCIES = [
  { id: "3x_woche", label: "3× / Woche" },
  { id: "5x_woche", label: "5× / Woche" },
  { id: "taeglich", label: "Täglich" },
] as const;

export type ContentKalenderFrequency =
  (typeof CONTENT_KALENDER_FREQUENCIES)[number]["id"];

export type ContentKalenderEntry = {
  tag: string;
  idee: string;
  format: string;
};

export const CONTENT_KALENDER_TOOL_SYSTEM_PROMPT = `Du bist ein Social-Media Content Strategist für Creator.
Erstelle einen strukturierten Content-Kalender mit konkreten, umsetzbaren Post-Ideen.
Jede Idee passt zur Nische und Plattform. Formate: Reel, Short, Carousel, Story, Post, Longform, Live, etc.
Antworte auf Deutsch.
${CLAUDE_JSON_SYSTEM_RULE}`;

function entryCountForFrequency(frequency: ContentKalenderFrequency): number {
  switch (frequency) {
    case "3x_woche":
      return 12;
    case "5x_woche":
      return 20;
    case "taeglich":
      return 28;
    default:
      return 12;
  }
}

function frequencyLabel(frequency: ContentKalenderFrequency): string {
  return (
    CONTENT_KALENDER_FREQUENCIES.find((f) => f.id === frequency)?.label ??
    frequency
  );
}

export function buildContentKalenderToolUserPrompt(
  params: {
    nische: string;
    plattform: string;
    frequenz: ContentKalenderFrequency;
  },
  qualityRetryHint?: string
): string {
  const count = entryCountForFrequency(params.frequenz);

  const base = `Erstelle einen 4-Wochen Content-Kalender.

Nische: ${params.nische}
Plattform: ${params.plattform}
Posting-Frequenz: ${frequencyLabel(params.frequenz)}

Generiere genau ${count} Einträge mit Tag (z.B. "Mo W1", "Di W2" oder "Tag 1"), Content-Idee (konkret, actionable) und Format (Reel, Carousel, etc.).

JSON:
{
  "entries": [
    { "tag": "Mo W1", "idee": "...", "format": "Reel" }
  ]
}`;
  return qualityRetryHint ? `${base}\n\n${qualityRetryHint}` : base;
}

export function parseContentKalenderToolResult(
  raw: string
): ContentKalenderEntry[] {
  try {
    const parsed = parseClaudeJson<{ entries?: unknown }>(raw);
    if (Array.isArray(parsed.entries)) {
      const entries = normalizeEntries(parsed.entries);
      if (entries.length) return entries;
    }
  } catch {
    /* fallback below */
  }

  const text = stripClaudeJson(raw);
  const lines = text.split(/\n+/).filter((l) => l.trim().length > 0);
  const entries: ContentKalenderEntry[] = [];

  for (const line of lines) {
    const parts = line.split(/\s*[|·|]\s*|\s{2,}/);
    if (parts.length >= 3) {
      entries.push({
        tag: parts[0].replace(/^[\d]+[.)]\s*/, "").trim(),
        idee: parts[1].trim(),
        format: parts[2].trim(),
      });
    } else if (parts.length === 2) {
      entries.push({
        tag: parts[0].trim(),
        idee: parts[1].trim(),
        format: "Post",
      });
    }
  }

  if (!entries.length) {
    throw new Error("Keine Kalender-Einträge in der KI-Antwort gefunden.");
  }

  return entries.slice(0, 30);
}

function normalizeEntries(raw: unknown[]): ContentKalenderEntry[] {
  const entries: ContentKalenderEntry[] = [];

  for (const item of raw) {
    const row = item as Record<string, unknown>;
    const idee = String(row.idee ?? row.idea ?? row.topic ?? "").trim();
    if (!idee) continue;
    entries.push({
      tag: String(row.tag ?? row.day ?? row.label ?? `Tag ${entries.length + 1}`),
      idee,
      format: String(row.format ?? row.type ?? "Post"),
    });
  }

  return entries;
}

export function contentKalenderToExportText(
  entries: ContentKalenderEntry[],
  meta?: { nische: string; plattform: string; frequenz: string }
): string {
  const header = meta
    ? `CONTENT KALENDER — ${meta.nische} · ${meta.plattform} · ${meta.frequenz}\n\n`
    : "CONTENT KALENDER\n\n";

  const rows = entries.map(
    (e) => `${e.tag}\t${e.idee}\t${e.format}`
  );

  return header + rows.join("\n");
}

export function isValidContentKalenderFrequency(
  value: string
): value is ContentKalenderFrequency {
  return CONTENT_KALENDER_FREQUENCIES.some((f) => f.id === value);
}

import { parseClaudeJson, CLAUDE_JSON_SYSTEM_RULE } from "@/lib/anthropic";

export const CONTENT_CALENDAR_SYSTEM_PROMPT = `Du bist ein Social-Media Content Strategist für Creator. Erstelle datenbasierte Content-Kalender mit viralen Hooks. ${CLAUDE_JSON_SYSTEM_RULE}`;

/** Aligned with /api/content-kalender and credit-display SSOT. */
export { CONTENT_KALENDER_TOOL_CREDIT_COST as CONTENT_CALENDAR_CREDIT_COST } from "@/lib/content-kalender-tool";

export type GenerateContentCalendarInput = {
  niche: string;
  platform: string;
  frequency: ContentCalendarFrequency;
  language: "de" | "en";
};

export type ContentCalendarDay = {
  day: number;
  dateLabel: string;
  topic: string;
  hook: string;
  format: string;
  bestPostingTime: string;
  hashtags: string[];
};

export type ContentCalendarResult = {
  days: ContentCalendarDay[];
  summary: string;
};

export type ContentCalendarFrequency = "daily" | "three_per_week" | "weekly";

export function postingSlotsForFrequency(
  frequency: ContentCalendarFrequency
): number {
  switch (frequency) {
    case "daily":
      return 30;
    case "three_per_week":
      return 12;
    case "weekly":
      return 4;
    default:
      return 30;
  }
}

export function buildContentCalendarUserPrompt(params: {
  niche: string;
  platform: string;
  frequency: ContentCalendarFrequency;
  language: string;
}): string {
  const slots = postingSlotsForFrequency(params.frequency);
  const freqLabel =
    params.frequency === "daily"
      ? "1× pro Tag (30 Posts)"
      : params.frequency === "three_per_week"
        ? "3× pro Woche (12 Posts über 30 Tage)"
        : "1× pro Woche (4 Posts über 30 Tage)";

  return `Erstelle einen 30-Tage Content-Kalender.

Nische: ${params.niche}
Plattform: ${params.platform}
Posting-Frequenz: ${freqLabel}
Sprache: ${params.language === "en" ? "Englisch" : "Deutsch"}

Generiere genau ${slots} Posting-Einträge verteilt über Tag 1–30 des Kalenders.
Jeder Eintrag braucht day (1-30), dateLabel (z.B. "Mo, 3. Jun"), topic, hook (erste 3 Sekunden), format (Short/Long/Reel), bestPostingTime, hashtags (Array, 3-5).

JSON:
{
  "summary": "Kurze Strategie-Zusammenfassung (1-2 Sätze)",
  "days": [
    {
      "day": 1,
      "dateLabel": "Mo, 3. Jun",
      "topic": "...",
      "hook": "...",
      "format": "Short",
      "bestPostingTime": "18:00–20:00",
      "hashtags": ["tag1", "tag2"]
    }
  ]
}`;
}

export function enrichCalendarDates(
  days: ContentCalendarDay[],
  startDate = new Date()
): ContentCalendarDay[] {
  const base = new Date(startDate);
  base.setHours(12, 0, 0, 0);

  return days.map((entry) => {
    const d = new Date(base);
    d.setDate(base.getDate() + Math.max(0, entry.day - 1));
    const dateLabel = d.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    return { ...entry, dateLabel: entry.dateLabel || dateLabel };
  });
}

export function parseContentCalendarResult(raw: string): ContentCalendarResult {
  const parsed = parseClaudeJson<Record<string, unknown>>(raw);
  const rawDays = parsed.days ?? parsed.entries ?? [];
  if (!Array.isArray(rawDays) || rawDays.length === 0) {
    throw new Error("Kalender konnte nicht gelesen werden.");
  }

  const days: ContentCalendarDay[] = [];
  for (const item of rawDays) {
    const row = item as Record<string, unknown>;
    const topic = String(row.topic ?? "").trim();
    if (!topic) continue;
    const tags = row.hashtags ?? row.tags ?? [];
    days.push({
      day: Number(row.day) || days.length + 1,
      dateLabel: String(row.dateLabel ?? row.date_label ?? ""),
      topic,
      hook: String(row.hook ?? ""),
      format: String(row.format ?? "Short"),
      bestPostingTime: String(
        row.bestPostingTime ?? row.best_posting_time ?? "18:00"
      ),
      hashtags: Array.isArray(tags)
        ? tags.slice(0, 8).map((t) => String(t).replace(/^#/, ""))
        : [],
    });
  }

  if (!days.length) throw new Error("Keine Kalender-Einträge erhalten.");

  return {
    days: enrichCalendarDates(days),
    summary: String(parsed.summary ?? ""),
  };
}

export function calendarToExportText(result: ContentCalendarResult): string {
  const lines = [
    "CONTENT KALENDER — 30 Tage",
    result.summary ? `\n${result.summary}\n` : "",
    ...result.days.map(
      (d) =>
        `Tag ${d.day} · ${d.dateLabel}\nThema: ${d.topic}\nHook: ${d.hook}\nFormat: ${d.format} · ${d.bestPostingTime}\nHashtags: ${d.hashtags.map((h) => `#${h}`).join(" ")}\n`
    ),
  ];
  return lines.join("\n").trim();
}

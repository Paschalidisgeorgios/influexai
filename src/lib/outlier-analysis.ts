import { CLAUDE_JSON_SYSTEM_RULE, parseClaudeJson } from "@/lib/anthropic";

export type ViralMechanism =
  | "curiosity_gap"
  | "contrarian"
  | "transformation"
  | "list"
  | "secret"
  | "controversy";

export type OutlierConcept = {
  title: string;
  thumbnailConcept: string;
  outlierScore: number;
  whyItWorked: [string, string, string];
  hook: string;
  viralMechanism: ViralMechanism;
};

const MECHANISMS: ViralMechanism[] = [
  "curiosity_gap",
  "contrarian",
  "transformation",
  "list",
  "secret",
  "controversy",
];

const LANGUAGE_LABELS: Record<string, string> = {
  de: "Deutsch",
  en: "Englisch",
  es: "Spanisch",
  fr: "Französisch",
  tr: "Türkisch",
  el: "Griechisch",
  ar: "Arabisch",
  pt: "Portugiesisch",
};

export function normalizeOutlierLanguage(language?: string): string {
  const code = language?.trim().toLowerCase() || "de";
  return LANGUAGE_LABELS[code] ? code : "de";
}

export function outlierLanguageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? LANGUAGE_LABELS.de;
}

export const OUTLIER_SYSTEM_PROMPT = `Du bist ein YouTube Viral Content Analyst. Outlier = Video mit 10x–100x normaler Kanal-Performance. ${CLAUDE_JSON_SYSTEM_RULE}`;

export function buildOutlierUserPrompt(params: {
  niche: string;
  period: string;
  platform: string;
  channelSize: string;
  language?: string;
}): string {
  const langCode = normalizeOutlierLanguage(params.language);
  const langLabel = outlierLanguageLabel(langCode);

  return `Nische: ${params.niche.trim()}
Zeitraum: ${params.period}
Plattform: ${params.platform}
Kanal-Größe: ${params.channelSize}
Sprache der Titel, Hooks und Beschreibungen: ${langLabel} (${langCode})

Generiere 6 realistische Outlier-Video-Konzepte für diese Nische.
Basiere sie auf echten Viral-Mustern (Curiosity Gap, Contrarian Takes, Transformation Stories, etc.)

JSON Format:
[{
  "title": string,
  "thumbnailConcept": string,
  "outlierScore": number,
  "whyItWorked": [string, string, string],
  "hook": string,
  "viralMechanism": "curiosity_gap"|"contrarian"|"transformation"|"list"|"secret"|"controversy"
}]`;
}

function splitWhyItWorkedBullets(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((w) => String(w).trim()).filter(Boolean);
  }
  if (typeof raw !== "string" || !raw.trim()) return [];

  const trimmed = raw.trim();
  let parts = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  if (parts.length < 2) {
    parts = trimmed
      .split(/\s*[,;•]\s+|\s+—\s+|\s+-\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 12);
  }

  if (parts.length === 1 && parts[0].length > 100) {
    const chunk = Math.ceil(parts[0].length / 3);
    parts = [
      parts[0].slice(0, chunk).trim(),
      parts[0].slice(chunk, chunk * 2).trim(),
      parts[0].slice(chunk * 2).trim(),
    ].filter(Boolean);
  }

  return parts;
}

function inferViralMechanism(raw: string): ViralMechanism {
  const s = raw.toLowerCase().trim();
  if (MECHANISMS.includes(s as ViralMechanism)) {
    return s as ViralMechanism;
  }
  if (s.includes("contrarian") || s.includes("gegen")) {
    return "contrarian";
  }
  if (s.includes("controvers") || s.includes("umstritt")) {
    return "controversy";
  }
  if (s.includes("transformation") || s.includes("before") || s.includes("nachher")) {
    return "transformation";
  }
  if (s.includes("list") || s.includes("liste") || s.includes("top ")) {
    return "list";
  }
  if (s.includes("secret") || s.includes("geheim")) {
    return "secret";
  }
  if (s.includes("curiosity") || s.includes("gap") || s.includes("neugier")) {
    return "curiosity_gap";
  }
  return "curiosity_gap";
}

export function parseOutlierConcepts(raw: string): OutlierConcept[] {
  const parsed = parseClaudeJson<unknown>(raw);
  const wrapped = parsed as
    | {
        outliers?: unknown;
        results?: unknown;
        data?: unknown;
      }
    | unknown[];
  const list = Array.isArray(wrapped)
    ? wrapped
    : ((wrapped as { outliers?: unknown }).outliers ??
      (wrapped as { results?: unknown }).results ??
      (wrapped as { data?: unknown }).data);
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("Ungültiges JSON-Format");
  }

  return list.slice(0, 6).map((item, i) => {
    const row = item as Record<string, unknown>;
    const whyBullets = splitWhyItWorkedBullets(
      row.whyItWorked ?? row.why_it_worked
    );
    const whyItWorked: [string, string, string] = [
      whyBullets[0] ?? "Starker Hook in den ersten Sekunden.",
      whyBullets[1] ?? "Hohe emotionale oder praktische Relevanz.",
      whyBullets[2] ?? "Thumbnail und Titel erzeugen Klick-Drang.",
    ];
    const mechanismRaw = String(
      row.viralMechanism ?? row.viral_mechanism ?? ""
    );
    const viralMechanism = inferViralMechanism(mechanismRaw);
    const score = Math.min(
      10,
      Math.max(1, Number(row.outlierScore ?? row.outlier_score) || 7)
    );

    return {
      title: String(row.title ?? `Outlier ${i + 1}`),
      thumbnailConcept: String(
        row.thumbnailConcept ?? row.thumbnail_concept ?? ""
      ),
      outlierScore: score,
      whyItWorked,
      hook: String(row.hook ?? ""),
      viralMechanism,
    };
  });
}

export function outlierResultsSaveErrorMessage(code?: string): string {
  if (code === "42P01" || code === "PGRST205") {
    return "Speichern vorübergehend nicht möglich. Bitte später erneut versuchen.";
  }
  return "Speichern in der Gallery fehlgeschlagen.";
}

import {
  createAnthropicMessage,
  parseClaudeJson,
  SCRIPT_GENERATOR_MODEL,
  stripClaudeJson,
} from "@/lib/anthropic";

export const AGENT_CLAUDE_MODEL = SCRIPT_GENERATOR_MODEL;

export type ClaudeToolError = { error: string; fallback: null };

export type ViralHookItem = { hook: string; type: string };

export type TrendScriptResult = {
  hook: string;
  script: string[];
  cta: string;
  duration: string;
};

export type ContentKalenderDay = {
  day: number;
  date: string;
  topic: string;
  format: string;
  hook: string;
  caption: string;
};

export type ProductAdResult = {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  hashtags: string[];
};

export type FullCampaignStep = {
  day: number;
  type: "hook" | "video" | "image" | "kalender";
  title: string;
  content: string;
  caption: string;
  hashtags: string[];
  posting_time: string;
  platform: string;
};

export type FullCampaignResult = {
  title: string;
  strategy: string;
  steps: FullCampaignStep[];
  expectedReach: string;
  tips: string[];
};

export function isToolError<T>(value: T | ClaudeToolError): value is ClaudeToolError {
  return (
    value != null &&
    typeof value === "object" &&
    "error" in value &&
    "fallback" in value
  );
}

async function callClaudeJson<T>(params: {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<T | ClaudeToolError> {
  try {
    const result = await createAnthropicMessage({
      model: AGENT_CLAUDE_MODEL,
      maxTokens: params.maxTokens ?? 2000,
      temperature: params.temperature ?? 0.8,
      system: "Antworte NUR mit validem JSON. Kein Markdown, keine Erklärungen.",
      user: params.prompt,
    });

    if (!result.ok) {
      return { error: result.error, fallback: null };
    }

    const parsed = parseClaudeJson<T>(stripClaudeJson(result.text));
    return parsed;
  } catch (err) {
    const message = err instanceof Error ? err.message : "JSON-Parsing fehlgeschlagen";
    return { error: message, fallback: null };
  }
}

export async function runViralHookClaude(params: {
  input: string;
  platform: string;
  nische: string;
}): Promise<ViralHookItem[] | ClaudeToolError> {
  const prompt = `Du bist ein viraler Content-Stratege.
Erstelle 10 virale Hooks für das Thema: ${params.input}
Plattform: ${params.platform}. Nische: ${params.nische}.
Gib NUR ein JSON-Array zurück: [{hook: string, type: string}]`;

  const result = await callClaudeJson<ViralHookItem[]>({
    prompt,
    maxTokens: 2000,
    temperature: 0.8,
  });

  if (isToolError(result)) return result;
  if (!Array.isArray(result) || result.length === 0) {
    return { error: "Keine Hooks generiert", fallback: null };
  }
  return result.filter((item) => item?.hook?.trim());
}

export async function runTrendScriptClaude(params: {
  thema: string;
  plattform: string;
  region?: string;
}): Promise<TrendScriptResult | ClaudeToolError> {
  const region = params.region ?? "DE";
  const prompt = `Du bist ein viraler Video-Skript-Autor.
Erstelle ein komplettes Video-Skript für: ${params.thema}
Plattform: ${params.plattform}, Region: ${region}
Gib NUR JSON zurück: {hook: string, script: string[], cta: string, duration: string}`;

  const result = await callClaudeJson<TrendScriptResult>({
    prompt,
    maxTokens: 2000,
    temperature: 0.8,
  });

  if (isToolError(result)) return result;
  if (!result.hook || !Array.isArray(result.script)) {
    return { error: "Ungültiges Skript-Format", fallback: null };
  }
  return result;
}

export async function runContentKalenderClaude(params: {
  nische: string;
  plattform: string;
  frequenz: string;
}): Promise<ContentKalenderDay[] | ClaudeToolError> {
  const prompt = `Du bist ein Content-Stratege.
Erstelle einen 30-Tage Content-Kalender.
Nische: ${params.nische}, Plattform: ${params.plattform}, Frequenz: ${params.frequenz}
Gib NUR ein JSON-Array zurück mit 30 Einträgen:
[{day: number, date: string, topic: string, format: string, hook: string, caption: string}]`;

  const result = await callClaudeJson<ContentKalenderDay[]>({
    prompt,
    maxTokens: 2000,
    temperature: 0.5,
  });

  if (isToolError(result)) return result;
  if (!Array.isArray(result) || result.length === 0) {
    return { error: "Kein Kalender generiert", fallback: null };
  }
  return result;
}

export async function runProductAdClaude(params: {
  produkt: string;
  zielgruppe: string;
  plattform: string;
}): Promise<ProductAdResult | ClaudeToolError> {
  const prompt = `Du bist ein Werbetexter.
Erstelle überzeugende Werbetexte für: ${params.produkt}
Zielgruppe: ${params.zielgruppe}, Plattform: ${params.plattform}
Gib NUR JSON zurück: {headline: string, subheadline: string, body: string, cta: string, hashtags: string[]}`;

  const result = await callClaudeJson<ProductAdResult>({
    prompt,
    maxTokens: 2000,
    temperature: 0.8,
  });

  if (isToolError(result)) return result;
  if (!result.headline || !result.body) {
    return { error: "Ungültiges Werbe-Format", fallback: null };
  }
  return result;
}

export async function generateFullCampaignClaude(params: {
  creatorDNA: string;
  nische: string;
  plattform: string;
  ziel: string;
  duration: number;
}): Promise<FullCampaignResult | ClaudeToolError> {
  const prompt = `Du bist ein KI-Marketing-Stratege für deutschsprachige Creator und Brands.
Erstelle eine vollständige Content-Kampagne.

Creator DNA: ${params.creatorDNA}
Nische: ${params.nische}
Plattform: ${params.plattform}
Ziel: ${params.ziel}
Dauer: ${params.duration} Tage

Gib NUR ein JSON-Objekt zurück:
{
  title: string,
  strategy: string,
  steps: [
    {
      day: number,
      type: 'hook' | 'video' | 'image' | 'kalender',
      title: string,
      content: string,
      caption: string,
      hashtags: string[],
      posting_time: string,
      platform: string
    }
  ],
  expectedReach: string,
  tips: string[]
}`;

  try {
    const result = await createAnthropicMessage({
      model: AGENT_CLAUDE_MODEL,
      maxTokens: 3000,
      temperature: 0.5,
      system: "Antworte NUR mit validem JSON. Kein Markdown, keine Erklärungen.",
      user: prompt,
    });

    if (!result.ok) {
      return { error: result.error, fallback: null };
    }

    const parsed = parseClaudeJson<FullCampaignResult>(stripClaudeJson(result.text));
    if (!parsed.title || !Array.isArray(parsed.steps)) {
      return { error: "Ungültiges Kampagnen-Format", fallback: null };
    }
    return parsed;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kampagne konnte nicht generiert werden";
    return { error: message, fallback: null };
  }
}

export function productAdToDisplayText(ad: ProductAdResult): string {
  const tags = ad.hashtags?.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ") ?? "";
  return [ad.headline, ad.subheadline, ad.body, ad.cta, tags].filter(Boolean).join("\n\n");
}

export function trendScriptToDisplayText(script: TrendScriptResult): string {
  const lines = [
    `[HOOK]\n${script.hook}`,
    `[MAIN]\n${script.script.join("\n")}`,
    `[CTA]\n${script.cta}`,
    script.duration ? `Dauer: ${script.duration}` : "",
  ];
  return lines.filter(Boolean).join("\n\n");
}

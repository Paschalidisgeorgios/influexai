import currentTrends from "@/config/currentTrends.json";

export type TrendKeyword = {
  term: string;
  weight: number;
  tags?: string[];
};

export type ViralNiche = {
  id: string;
  label: string;
  aliases: string[];
  boost: number;
  tags?: string[];
};

export type BoostModifier = {
  term: string;
  weight: number;
  aliases?: string[];
};

export type CurrentTrendsData = {
  updated: string;
  trending_keywords: TrendKeyword[];
  viral_niches: ViralNiche[];
  boost_modifiers: BoostModifier[];
};

export type StudioContext = {
  nische?: string;
  zielgruppe?: string;
  plattformen?: string[];
  tonalitaet?: string;
};

export type ViralPredictionBreakdown = {
  base: number;
  keywordMatches: number;
  nicheBoost: number;
  modifierBoost: number;
  studioAlignment: number;
};

export type ViralPrediction = {
  score: number;
  matchedTrends: string[];
  matchedNiches: string[];
  suggestedKeywords: string[];
  breakdown: ViralPredictionBreakdown;
};

const TRENDS = currentTrends as CurrentTrendsData;

const NICHE_HIT_BOOST = 25;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Word-boundary or substring match (handles POV, UGC, hyphenated terms). */
export function termMatchesInText(term: string, text: string): boolean {
  const nTerm = normalize(term);
  const nText = normalize(text);
  if (!nTerm || !nText) return false;

  if (nText.includes(nTerm)) return true;

  const pattern = new RegExp(
    `(^|[\\s,.;:!?/\\\\|\\-–—'"([{])${escapeRegExp(nTerm)}([\\s,.;:!?/\\\\|\\-–—'")\\]}]|$)`,
    "i"
  );
  return pattern.test(text);
}

function collectSearchableText(prompt: string, studio: StudioContext): string {
  return [
    prompt,
    studio.nische ?? "",
    studio.zielgruppe ?? "",
    studio.tonalitaet ?? "",
    ...(studio.plattformen ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function scoreKeywordMatches(prompt: string, keywords: TrendKeyword[]): {
  points: number;
  matched: string[];
} {
  let points = 0;
  const matched: string[] = [];

  for (const kw of keywords) {
    if (termMatchesInText(kw.term, prompt)) {
      points += kw.weight;
      matched.push(kw.term);
    }
  }

  return { points: Math.min(points, 28), matched };
}

function scoreModifierMatches(prompt: string, modifiers: BoostModifier[]): {
  points: number;
  matched: string[];
} {
  let points = 0;
  const matched: string[] = [];

  for (const mod of modifiers) {
    const terms = [mod.term, ...(mod.aliases ?? [])];
    if (terms.some((t) => termMatchesInText(t, prompt))) {
      points += mod.weight;
      matched.push(mod.term);
    }
  }

  return { points: Math.min(points, 18), matched };
}

function scoreNicheMatches(
  prompt: string,
  studio: StudioContext,
  niches: ViralNiche[]
): { points: number; matched: string[]; hitNiche: ViralNiche | null } {
  const corpus = collectSearchableText(prompt, studio);
  const matched: string[] = [];
  let points = 0;
  let hitNiche: ViralNiche | null = null;

  for (const niche of niches) {
    const terms = [niche.label, niche.id.replace(/-/g, " "), ...niche.aliases];
    const hit = terms.some((t) => termMatchesInText(t, corpus));

    if (hit) {
      matched.push(niche.label);
      if (!hitNiche || niche.boost > hitNiche.boost) {
        hitNiche = niche;
      }
    }
  }

  if (hitNiche) {
    points = NICHE_HIT_BOOST;
  }

  return { points, matched, hitNiche };
}

function scoreStudioAlignment(prompt: string, studio: StudioContext, hitNiche: ViralNiche | null): number {
  let points = 0;
  const nPrompt = normalize(prompt);

  if (studio.nische && termMatchesInText(studio.nische, prompt)) {
    points += 6;
  }

  if (studio.zielgruppe && termMatchesInText(studio.zielgruppe, prompt)) {
    points += 4;
  }

  if (hitNiche && studio.nische) {
    const studioNiche = normalize(studio.nische);
    const nicheTerms = [hitNiche.label, ...hitNiche.aliases].map(normalize);
    if (nicheTerms.some((t) => studioNiche.includes(t) || t.includes(studioNiche))) {
      points += 8;
    }
  }

  if (nPrompt.length >= 24) points += 4;
  if (nPrompt.length >= 80) points += 4;

  return Math.min(points, 16);
}

function relevanceScore(term: string, prompt: string, studio: StudioContext, outputType?: string): number {
  let score = 0;
  const corpus = collectSearchableText(prompt, studio);

  if (termMatchesInText(term, corpus)) return -1;

  const trend = TRENDS.trending_keywords.find((k) => normalize(k.term) === normalize(term));
  if (trend?.tags && outputType) {
    const map: Record<string, string[]> = {
      video: ["video", "film", "shorts", "reels", "tiktok"],
      image: ["visuals", "aesthetic", "mood", "neon"],
      text: ["hooks", "storytelling", "narrative"],
    };
    const tags = map[outputType] ?? [];
    if (trend.tags.some((t) => tags.includes(t))) score += 4;
  }

  if (studio.nische) {
    const nNiche = normalize(studio.nische);
    for (const niche of TRENDS.viral_niches) {
      if (normalize(niche.label) === normalize(term) || niche.aliases.some((a) => normalize(a) === normalize(term))) {
        if (niche.aliases.some((a) => termMatchesInText(a, studio.nische!)) || termMatchesInText(niche.label, studio.nische!)) {
          score += 6;
        }
      }
    }
    if (termMatchesInText(term, studio.nische)) score += 3;
  }

  score += trend?.weight ?? 3;
  return score;
}

export function suggestTrendKeywords(
  prompt: string,
  studio: StudioContext,
  options?: { limit?: number; outputType?: string }
): string[] {
  const limit = options?.limit ?? 3;
  const outputType = options?.outputType;

  const pool: string[] = [
    ...TRENDS.trending_keywords.map((k) => k.term),
    ...TRENDS.boost_modifiers.map((m) => m.term),
  ];

  const ranked = pool
    .map((term) => ({ term, score: relevanceScore(term, prompt, studio, outputType) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  const unique: string[] = [];
  for (const { term } of ranked) {
    if (!unique.includes(term)) unique.push(term);
    if (unique.length >= limit) break;
  }

  return unique;
}

export function computeViralPrediction(
  prompt: string,
  studio: StudioContext = {},
  options?: { outputType?: string; keywordLimit?: number }
): ViralPrediction {
  const trimmed = prompt.trim();
  const base = trimmed.length > 0 ? 32 : 18;

  const keywordResult = scoreKeywordMatches(trimmed, TRENDS.trending_keywords);
  const modifierResult = scoreModifierMatches(trimmed, TRENDS.boost_modifiers);
  const nicheResult = scoreNicheMatches(trimmed, studio, TRENDS.viral_niches);
  const studioAlignment = scoreStudioAlignment(trimmed, studio, nicheResult.hitNiche);

  const raw =
    base +
    keywordResult.points +
    modifierResult.points +
    nicheResult.points +
    studioAlignment;

  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const matchedTrends = [...keywordResult.matched, ...modifierResult.matched];
  const suggestedKeywords = suggestTrendKeywords(trimmed, studio, {
    limit: options?.keywordLimit ?? 3,
    outputType: options?.outputType,
  });

  return {
    score,
    matchedTrends,
    matchedNiches: nicheResult.matched,
    suggestedKeywords,
    breakdown: {
      base,
      keywordMatches: keywordResult.points,
      nicheBoost: nicheResult.points,
      modifierBoost: modifierResult.points,
      studioAlignment,
    },
  };
}

export function appendKeywordToPrompt(prompt: string, keyword: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return keyword;
  if (termMatchesInText(keyword, trimmed)) return trimmed;
  return `${trimmed}, ${keyword}`;
}

export function getPrimaryPromptParamKey(
  params: { key: string; type: string }[]
): string | null {
  const priority = ["prompt", "input", "thema", "topic", "beschreibung", "description"];
  for (const key of priority) {
    if (params.some((p) => p.key === key)) return key;
  }
  const textarea = params.find((p) => p.type === "textarea");
  return textarea?.key ?? params.find((p) => p.type === "string")?.key ?? null;
}

export function buildPromptFromParams(
  values: Record<string, unknown>,
  paramDefs: { key: string; type: string }[]
): string {
  const primaryKey = getPrimaryPromptParamKey(paramDefs);
  if (primaryKey && typeof values[primaryKey] === "string") {
    return values[primaryKey] as string;
  }

  return paramDefs
    .filter((p) => p.type === "textarea" || p.type === "string")
    .map((p) => values[p.key])
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join(" ");
}

export function getTrendsMeta(): Pick<CurrentTrendsData, "updated"> {
  return { updated: TRENDS.updated };
}

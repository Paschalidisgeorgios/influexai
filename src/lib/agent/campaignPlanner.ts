import { createAnthropicMessage, parseClaudeJson } from "@/lib/anthropic";
import type { ContentKalenderPlatform } from "@/lib/content-kalender-tool";
import type { TrendScriptPlatform } from "@/lib/trend-script-tool";
import type { ProductAdPlatform } from "@/lib/product-ad-config";
import {
  formatCreatorProfileForPrompt,
  type CreatorProfile,
} from "./creatorMemory";
import type {
  BrandDNA,
  CampaignGoal,
  CampaignMode,
  CampaignPlatform,
  CampaignTone,
  ContentItem,
} from "./types";

/** Real campaign execution — credits charged per tool run. */
export const CAMPAIGN_AUTOPILOT_IS_PREVIEW = false;

export const CAMPAIGN_PREVIEW_CREDITS = 0;

const PLANNER_MODEL = "claude-sonnet-4-5-20250929";

export type CampaignPlanStep = {
  reihenfolge: number;
  tool:
    | "viral-hook"
    | "content-kalender"
    | "trend-script"
    | "product-ad"
    | "image-generator";
  input: Record<string, unknown>;
  begruendung: string;
  contentType?: ContentItem["type"];
  platform?: CampaignPlatform;
};

const PLANNER_SYSTEM = `Du bist Campaign Planner für InfluexAI. Erstelle einen strukturierten Ausführungsplan als JSON.
Verfügbare Tools: viral-hook (input: {input}), content-kalender (input: {nische, plattform, frequenz}), trend-script (input: {thema, plattform, region}), product-ad (input: {productName, productDescription, audience, platform, style, language, ctaText}), image-generator (input: {prompt}).
Antworte NUR mit JSON: {"steps":[{"reihenfolge":1,"tool":"...","input":{...},"begruendung":"...","contentType":"reel|post|ad|visual_briefing|...","platform":"tiktok|instagram|..."}]}`;

const ENRICH_SYSTEM = `Du bist Social-Media-Stratege. Ergänze Kampagnen-Content-Items mit Caption, Hashtags und Posting-Zeit.
Antworte NUR mit JSON:
{"items":[{"id":"...","content":"Kerninhalt/Briefing","caption":"fertige Caption","hashtags":["#..."],"posting_time":"HH:MM"}]}
Regeln: Deutsch, plattformgerecht, posting_time realistisch (z.B. 18:30), 5-12 Hashtags pro Item.`;

export const CAMPAIGN_SPECS: Record<
  CampaignMode,
  {
    days: number;
    reels: number;
    carousels: number;
    stories: number;
    posts: number;
    ads: number;
    visualBriefings: number;
    estimatedCredits: number;
    label: string;
  }
> = {
  sprint: {
    days: 3,
    reels: 1,
    carousels: 1,
    stories: 1,
    posts: 3,
    ads: 0,
    visualBriefings: 2,
    estimatedCredits: 38,
    label: "2–3 Tage",
  },
  weekly: {
    days: 7,
    reels: 3,
    carousels: 2,
    stories: 2,
    posts: 5,
    ads: 1,
    visualBriefings: 3,
    estimatedCredits: 81,
    label: "7 Tage",
  },
  monthly: {
    days: 30,
    reels: 12,
    carousels: 8,
    stories: 6,
    posts: 20,
    ads: 4,
    visualBriefings: 10,
    estimatedCredits: 293,
    label: "30 Tage",
  },
  product_launch: {
    days: 14,
    reels: 6,
    carousels: 4,
    stories: 4,
    posts: 10,
    ads: 6,
    visualBriefings: 6,
    estimatedCredits: 197,
    label: "Produktkampagne",
  },
};

export const CAMPAIGN_STEPS = [
  "Briefing auswerten",
  "Brand-Kontext ableiten",
  "Kampagnenplan erstellen",
  "Content-Kalender generieren",
  "Hooks formulieren",
  "Scripts schreiben",
  "Visuals erstellen",
  "Qualität prüfen",
  "Captions ergänzen",
  "Struktur finalisieren",
  "Credits abrechnen",
  "Kampagnenpaket bereitstellen",
] as const;

function mapToKalenderPlatform(p: CampaignPlatform): ContentKalenderPlatform {
  if (p === "instagram") return "Instagram";
  if (p === "linkedin") return "LinkedIn";
  if (p === "youtube_shorts") return "YouTube";
  return "TikTok";
}

function mapToTrendPlatform(p: CampaignPlatform): TrendScriptPlatform {
  if (p === "instagram") return "Reels";
  if (p === "youtube_shorts") return "YouTube";
  return "TikTok";
}

function mapToAdPlatform(p: CampaignPlatform): ProductAdPlatform {
  if (p === "instagram") return "instagram";
  if (p === "youtube_shorts") return "youtube";
  return "tiktok";
}

function buildFallbackPlan(params: {
  prompt: string;
  mode: CampaignMode;
  platforms: CampaignPlatform[];
}): CampaignPlanStep[] {
  const platform = params.platforms[0] ?? "tiktok";
  const spec = CAMPAIGN_SPECS[params.mode];
  const steps: CampaignPlanStep[] = [];
  let order = 1;

  steps.push({
    reihenfolge: order++,
    tool: "content-kalender",
    input: {
      nische: params.prompt.slice(0, 80),
      plattform: mapToKalenderPlatform(platform),
      frequenz: spec.days <= 7 ? "5x_woche" : "3x_woche",
    },
    begruendung: "Content-Kalender als Basis",
    contentType: "post",
    platform,
  });

  steps.push({
    reihenfolge: order++,
    tool: "viral-hook",
    input: { input: params.prompt },
    begruendung: "Hooks für Reels",
    contentType: "reel",
    platform,
  });

  for (let i = 0; i < Math.min(spec.reels, 3); i++) {
    steps.push({
      reihenfolge: order++,
      tool: "trend-script",
      input: {
        thema: params.prompt,
        plattform: mapToTrendPlatform(platform),
        region: "DE",
      },
      begruendung: `Reel-Script ${i + 1}`,
      contentType: "reel",
      platform,
    });
  }

  for (let i = 0; i < Math.min(spec.visualBriefings, 2); i++) {
    steps.push({
      reihenfolge: order++,
      tool: "image-generator",
      input: { prompt: `${params.prompt} — Visual ${i + 1}` },
      begruendung: `Visual ${i + 1}`,
      contentType: "visual_briefing",
      platform,
    });
  }

  if (spec.ads > 0) {
    steps.push({
      reihenfolge: order++,
      tool: "product-ad",
      input: {
        productName: params.prompt.slice(0, 60),
        productDescription: params.prompt,
        audience: "Zielgruppe",
        platform: mapToAdPlatform(platform),
        style: "lifestyle",
        language: "de",
        ctaText: "Jetzt entdecken",
      },
      begruendung: "Werbespot-Script",
      contentType: "ad",
      platform,
    });
  }

  return steps;
}

export async function generateCampaignPlan(params: {
  prompt: string;
  mode: CampaignMode;
  platforms: CampaignPlatform[];
  goal: CampaignGoal;
  tone: CampaignTone;
  creatorDNA?: CreatorProfile | null;
}): Promise<CampaignPlanStep[]> {
  const spec = CAMPAIGN_SPECS[params.mode];
  const creatorContext = formatCreatorProfileForPrompt(params.creatorDNA ?? null);
  const user = `${creatorContext ? `${creatorContext}\n\n` : ""}Kampagnenziel: ${params.prompt}
Modus: ${params.mode} (${spec.label})
Plattformen: ${params.platforms.join(", ")}
Ziel: ${params.goal}
Ton: ${params.tone}
Lieferumfang: ${spec.reels} Reels, ${spec.posts} Posts, ${spec.ads} Ads, ${spec.visualBriefings} Visuals, ${spec.carousels} Carousels, ${spec.stories} Stories.
Erstelle 6–14 Schritte mit passenden Tools und konkreten Inputs auf Deutsch.`;

  const result = await createAnthropicMessage({
    model: PLANNER_MODEL,
    maxTokens: 4096,
    system: PLANNER_SYSTEM,
    user,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  try {
    const parsed = parseClaudeJson<{ steps?: CampaignPlanStep[] }>(result.text);
    const steps = (parsed.steps ?? [])
      .filter((s) => s.tool && s.reihenfolge)
      .sort((a, b) => a.reihenfolge - b.reihenfolge);
    if (steps.length > 0) return steps;
  } catch {
    // fallback below
  }

  return buildFallbackPlan(params);
}

export async function enrichCampaignItemsWithMeta(params: {
  prompt: string;
  goal: CampaignGoal;
  tone: CampaignTone;
  platforms: CampaignPlatform[];
  mode: CampaignMode;
  creatorDNA?: CreatorProfile | null;
  items: ContentItem[];
}): Promise<ContentItem[]> {
  if (params.items.length === 0) return params.items;

  const creatorContext = formatCreatorProfileForPrompt(params.creatorDNA ?? null);
  const itemSummary = params.items.map((item) => ({
    id: item.id,
    type: item.type,
    platform: item.platform,
    day: item.day,
    title: item.title,
    hook: item.hook,
    script: item.script?.slice(0, 400),
    caption: item.caption,
    visualBriefing: item.visualBriefing,
  }));

  const user = `${creatorContext ? `${creatorContext}\n\n` : ""}Kampagne: ${params.prompt}
Ziel: ${params.goal}
Ton: ${params.tone}
Plattformen: ${params.platforms.join(", ")}
Modus: ${params.mode}

Items:
${JSON.stringify(itemSummary, null, 2)}

Ergänze jedes Item mit content, caption, hashtags und posting_time.`;

  const result = await createAnthropicMessage({
    model: PLANNER_MODEL,
    maxTokens: 4096,
    system: ENRICH_SYSTEM,
    user,
  });

  if (!result.ok) {
    console.warn("[campaignPlanner] enrich failed:", result.error);
    return params.items;
  }

  try {
    const parsed = parseClaudeJson<{
      items?: Array<{
        id?: string;
        content?: string;
        caption?: string;
        hashtags?: string[];
        posting_time?: string;
      }>;
    }>(result.text);

    const byId = new Map(
      (parsed.items ?? [])
        .filter((row) => row.id)
        .map((row) => [row.id as string, row])
    );

    return params.items.map((item) => {
      const meta = byId.get(item.id);
      if (!meta) return item;
      return {
        ...item,
        content: meta.content ?? item.content ?? item.hook ?? item.script,
        caption: meta.caption ?? item.caption,
        hashtags: meta.hashtags?.length ? meta.hashtags : item.hashtags,
        postingTime: meta.posting_time ?? item.postingTime,
      };
    });
  } catch {
    return params.items;
  }
}

export function inferBrandDNA(prompt: string): {
  dna: Partial<BrandDNA>;
  assumptions: string[];
} {
  const assumptions: string[] = [];
  const p = prompt.toLowerCase();

  let industry = "Allgemein";
  if (/immobil|real estate|eigentu/i.test(p)) industry = "Immobilien";
  else if (/finance|finanz|steuer|invest/i.test(p)) industry = "Finance / SaaS";
  else if (/beauty|kosmetik|skincare/i.test(p)) industry = "Beauty";
  else if (/tech|software|app|saas/i.test(p)) industry = "Tech / SaaS";
  else assumptions.push("Branche nicht erkannt — Allgemein angenommen");

  let tone: CampaignTone = "modern";
  if (/seriös|vertrauens|professional/i.test(p)) tone = "trustworthy";
  else if (/frech|bold|provokat/i.test(p)) tone = "bold";
  else if (/direkt/i.test(p)) tone = "direct";
  else assumptions.push("Ton nicht erkannt — Modern angenommen");

  if (assumptions.length === 0)
    assumptions.push("Alle Annahmen aus Prompt abgeleitet");

  return {
    dna: {
      industry,
      toneOfVoice: tone,
      forbiddenClaims: [],
      forbiddenWords: [],
      requiredDisclaimers: [],
      legalSensitivity: "low",
    },
    assumptions,
  };
}

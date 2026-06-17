/** Mock intent routing — design-preview only, no API */

import { detectFluxUltraExplicit } from "./studio-engine-registry";

export type PreviewIntent =
  | "lora_training"
  | "image_generation"
  | "ai_influencer"
  | "product_visual"
  | "image_upscale"
  | "video_upscale"
  | "image_to_video"
  | "hook_generation"
  | "campaign_planning"
  | "asset_reuse"
  | "unknown";

export type PreviewPlatform =
  | "instagram_reel"
  | "instagram_feed"
  | "youtube_thumbnail"
  | "youtube_shorts"
  | "linkedin_post"
  | "website_hero"
  | null;

export type PreviewFormat = "9:16" | "4:5" | "1:1" | "16:9" | "wide";

const IMAGE_KEYWORDS = [
  "bild",
  "visual",
  "foto",
  "sunset",
  "ad",
  "post",
  "image",
  "photo",
  "picture",
  "erstelle ein bild",
  "mach ein bild",
];

const AI_INFLUENCER_KEYWORDS = [
  "ai influencer",
  "influencer",
  "avatar",
  "creator persona",
  "virtuelle person",
  "ki influencer",
  "person erstellen",
  "model erstellen",
  "portrait",
  "fashion creator",
  "beauty creator",
  "creatorin",
  "virtuell",
  "virtuelle creator",
];

const PRODUCT_VISUAL_KEYWORDS = [
  "produktbild",
  "produktfoto",
  "product visual",
  "produkt",
  "kampagnenbild",
  "werbebild",
  "ad visual",
  "kampagnenvisual",
  "packshot",
  "product shot",
];

const VIDEO_KEYWORDS = [
  "video",
  "reel",
  "motion",
  "bewegen",
  "animieren",
  "clip",
  "animate",
  "tiktok",
  "zu video",
  "mach daraus ein video",
  "daraus ein video",
];
const HOOK_KEYWORDS = ["hook", "hooks", "caption", "text", "headline", "schreib mir"];
const CAMPAIGN_KEYWORDS = [
  "kampagne",
  "campaign",
  "content plan",
  "starte kampagne",
  "plan",
  "ideen",
  "calendar",
  "kalender",
];
const ASSET_KEYWORDS = [
  "galerie",
  "asset",
  "variante",
  "bearbeiten",
  "remix",
  "gallery",
  "reuse",
  "dieses bild",
  "daraus",
];

const IMAGE_UPSCALE_KEYWORDS = [
  "upscale",
  "hochskalieren",
  "verbessern",
  "schärfer machen",
  "bild verbessern",
  "topaz bild",
  "topaz image",
  "bild upscalen",
  "schärfer",
  "schärfe",
  "qualität verbessern",
];

const VIDEO_UPSCALE_KEYWORDS = [
  "video upscalen",
  "video verbessern",
  "topaz video",
  "video schärfer",
  "hochskalieren video",
  "bessere qualität",
  "export in besserer qualität",
  "video upscale",
  "motion verbessern",
];

const LORA_TRAINING_KEYWORDS = [
  "lora",
  "training",
  "trainieren",
  "modell trainieren",
  "influencer trainieren",
  "ki influencer trainieren",
  "persona trainieren",
  "style trainieren",
  "brand look trainieren",
  "eigenes modell",
  "character consistency",
  "wiedererkennbarer look",
  "trainiere",
  "trainings",
];

const PLATFORM_RULES: { platform: PreviewPlatform; format: PreviewFormat; keywords: string[] }[] = [
  { platform: "instagram_reel", format: "9:16", keywords: ["instagram reel", "reel", "tiktok", "9:16"] },
  { platform: "instagram_feed", format: "4:5", keywords: ["instagram feed", "instagram post", "feed", "4:5"] },
  { platform: "youtube_thumbnail", format: "16:9", keywords: ["youtube thumbnail", "thumbnail", "16:9"] },
  { platform: "youtube_shorts", format: "9:16", keywords: ["youtube shorts", "shorts"] },
  { platform: "linkedin_post", format: "1:1", keywords: ["linkedin"] },
  { platform: "website_hero", format: "wide", keywords: ["website", "hero", "landing"] },
];

const INFLUENCER_STYLE_HINTS = [
  "beauty",
  "fashion",
  "fitness",
  "business",
  "lifestyle",
  "cinematic",
] as const;

function extractInfluencerStyle(input: string): string {
  const q = input.toLowerCase();
  for (const style of INFLUENCER_STYLE_HINTS) {
    if (q.includes(style)) return style;
  }
  return "lifestyle";
}

export function detectPreviewIntent(input: string): PreviewIntent {
  const q = input.toLowerCase().trim();
  if (!q) return "unknown";

  const scores: Record<Exclude<PreviewIntent, "unknown">, number> = {
    image_generation: 0,
    ai_influencer: 0,
    product_visual: 0,
    lora_training: 0,
    image_upscale: 0,
    video_upscale: 0,
    image_to_video: 0,
    hook_generation: 0,
    campaign_planning: 0,
    asset_reuse: 0,
  };

  for (const w of IMAGE_KEYWORDS) if (q.includes(w)) scores.image_generation += 1;
  for (const w of AI_INFLUENCER_KEYWORDS) if (q.includes(w)) scores.ai_influencer += 1;
  for (const w of PRODUCT_VISUAL_KEYWORDS) if (q.includes(w)) scores.product_visual += 1;
  for (const w of LORA_TRAINING_KEYWORDS) if (q.includes(w)) scores.lora_training += 1;
  for (const w of IMAGE_UPSCALE_KEYWORDS) if (q.includes(w)) scores.image_upscale += 1;
  for (const w of VIDEO_UPSCALE_KEYWORDS) if (q.includes(w)) scores.video_upscale += 1;
  for (const w of VIDEO_KEYWORDS) if (q.includes(w)) scores.image_to_video += 1;
  for (const w of HOOK_KEYWORDS) if (q.includes(w)) scores.hook_generation += 1;
  for (const w of CAMPAIGN_KEYWORDS) if (q.includes(w)) scores.campaign_planning += 1;
  for (const w of ASSET_KEYWORDS) if (q.includes(w)) scores.asset_reuse += 1;

  if (q.includes("ai influencer") || q.includes("ki influencer")) scores.ai_influencer += 4;
  if (q.includes("virtuelle person") || q.includes("creator persona")) scores.ai_influencer += 3;
  if (q.includes("realistisches portrait") || q.includes("portrait einer")) scores.ai_influencer += 3;
  if (q.includes("produktbild") || q.includes("produktfoto")) scores.product_visual += 4;
  if (q.includes("kampagnenbild") || q.includes("werbebild")) scores.product_visual += 3;
  if (q.includes("product visual")) scores.product_visual += 3;

  if (q.includes("lora")) scores.lora_training += 5;
  if (q.includes("trainiere") || q.includes("trainieren")) scores.lora_training += 4;
  if (q.includes("ki influencer trainieren") || q.includes("influencer trainieren")) {
    scores.lora_training += 6;
  }
  if (q.includes("persona trainieren") || q.includes("brand look trainieren")) {
    scores.lora_training += 5;
  }
  if (q.includes("eigenes modell")) scores.lora_training += 5;
  if (q.includes("wiedererkennbar")) scores.lora_training += 3;

  if (
    (q.includes("trainiere") || q.includes("trainieren") || q.includes("training")) &&
    (q.includes("influencer") || q.includes("persona") || q.includes("brand") || q.includes("lora"))
  ) {
    scores.lora_training += 4;
    scores.ai_influencer -= 1;
  }

  if (q.includes("verwandel") && q.includes("video")) scores.image_to_video += 2;
  if (q.includes("mach daraus") && q.includes("video")) scores.image_to_video += 3;
  if (q.includes("variant")) scores.asset_reuse += 2;
  if (q.includes("hooks für")) scores.hook_generation += 3;
  if (q.includes("starte kampagne")) scores.campaign_planning += 3;

  if (q.includes("topaz bild") || q.includes("topaz image")) scores.image_upscale += 5;
  if (q.includes("topaz video")) scores.video_upscale += 5;
  if (q.includes("bild upscalen") || q.includes("bild verbessern")) scores.image_upscale += 4;
  if (q.includes("video upscalen") || q.includes("video verbessern")) scores.video_upscale += 4;
  if (q.includes("schärfer machen") || q.includes("mach das bild schärfer")) {
    scores.image_upscale += 5;
    scores.image_generation -= 1;
  }
  if (q.includes("upscale das video") || q.includes("upscale video")) scores.video_upscale += 5;
  if (q.includes("export in besserer qualität")) scores.video_upscale += 4;

  const hasVideoSignal = VIDEO_KEYWORDS.some((w) => q.includes(w));
  const hasImageSignal =
    q.includes("bild") || q.includes("image") || q.includes("foto") || q.includes("photo");

  if (hasVideoSignal && (q.includes("upscale") || q.includes("verbessern") || q.includes("qualität"))) {
    scores.video_upscale += 3;
    scores.image_upscale -= 1;
  }
  if (hasImageSignal && !hasVideoSignal && (q.includes("upscale") || q.includes("verbessern"))) {
    scores.image_upscale += 3;
    scores.video_upscale -= 1;
  }
  if (q.includes("bessere qualität") && hasVideoSignal) scores.video_upscale += 3;
  if (q.includes("bessere qualität") && hasImageSignal && !hasVideoSignal) scores.image_upscale += 2;

  if (detectFluxUltraExplicit(q) && !VIDEO_KEYWORDS.some((w) => q.includes(w))) {
    if (scores.product_visual === 0 && scores.ai_influencer === 0) {
      scores.image_generation += 2;
    }
  }

  const ranked = (Object.entries(scores) as [Exclude<PreviewIntent, "unknown">, number][]).sort(
    (a, b) => b[1] - a[1]
  );

  if (!ranked[0] || ranked[0][1] === 0) return "unknown";
  return ranked[0][0];
}

export function detectPreviewPlatform(input: string): {
  platform: PreviewPlatform;
  format: PreviewFormat | null;
} {
  const q = input.toLowerCase();
  for (const rule of PLATFORM_RULES) {
    if (rule.keywords.some((k) => q.includes(k))) {
      return { platform: rule.platform, format: rule.format };
    }
  }
  if (q.includes("instagram") && !q.includes("reel")) {
    return { platform: "instagram_feed", format: "4:5" };
  }
  if (q.includes("instagram") && q.includes("reel")) {
    return { platform: "instagram_reel", format: "9:16" };
  }
  if (q.includes("youtube") && !q.includes("shorts")) {
    return { platform: "youtube_thumbnail", format: "16:9" };
  }
  return { platform: null, format: null };
}

export function buildOptimizedPrompt(input: string, intent: PreviewIntent): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const base = trimmed.replace(/\s+/g, " ");
  const q = base.toLowerCase();

  switch (intent) {
    case "ai_influencer": {
      const style = extractInfluencerStyle(q);
      const platform = q.includes("instagram") ? "Instagram" : "social media";
      return `High-end editorial portrait of a virtual ${style} creator for ${platform}, realistic skin texture, premium studio lighting, fashion campaign aesthetic, clean background, sharp facial details, natural expression, cinematic composition, social-media-ready visual.`;
    }
    case "product_visual":
      return `Premium product photography, ${base}, editorial campaign lighting, sharp macro detail, clean composition, luxury brand visual, studio-grade capture, commercial advertising quality, natural shadows, high-end campaign asset.`;
    case "lora_training":
      return `LoRA training brief, ${base}, reusable persona or brand style, consistent visual identity, prepared for reference upload and consent review.`;
    case "image_generation":
      if (q.includes("sunset")) {
        return "Golden hour sunset over mountains, cinematic photography, high detail, warm tones, editorial campaign quality";
      }
      if (detectFluxUltraExplicit(q) || q.includes("portrait") || q.includes("premium")) {
        return `Premium campaign visual, ${base}, photorealistic detail, editorial lighting, clean composition, high-end brand photography, social-ready export`;
      }
      return `Premium campaign visual, ${base}, clean composition, brand-safe lighting, high detail, social-ready export`;
    case "image_to_video":
      return `Cinematic product motion, ${base}, smooth camera move, short-form vertical video, natural lighting`;
    case "hook_generation":
      return `Scroll-stopping hooks for social campaign, ${base}, platform-native tone, direct audience address`;
    case "campaign_planning":
      return `Campaign content plan, ${base}, platform-aware hooks, clear audience angle, actionable post ideas`;
    case "asset_reuse":
      return `Asset variation pipeline, ${base}, preserve brand identity, generate remix-ready outputs`;
    case "image_upscale":
      return `Image upscale pipeline, ${base}, preserve detail, export-ready sharpening, Topaz post-production refinement`;
    case "video_upscale":
      return `Video upscale pipeline, ${base}, motion detail recovery, export-ready quality, Topaz post-production refinement`;
    default:
      return `Production brief, ${base}, structured for InfluexAI workflow routing`;
  }
}

export function workflowLabelFor(intent: PreviewIntent, lang: "de" | "en"): string {
  const de: Partial<Record<PreviewIntent, string>> = {
    ai_influencer: "AI Influencer Visual",
    product_visual: "Produktvisual",
    lora_training: "LoRA Training",
    image_generation: "Bild erstellen",
    image_upscale: "Bild verbessern",
    image_to_video: "Bild zu Video",
    video_upscale: "Video verbessern",
  };
  const en: Partial<Record<PreviewIntent, string>> = {
    ai_influencer: "AI Influencer Visual",
    product_visual: "Product visual",
    lora_training: "LoRA Training",
    image_generation: "Create image",
    image_upscale: "Improve image",
    image_to_video: "Image to video",
    video_upscale: "Improve video",
  };
  return (lang === "de" ? de : en)[intent] ?? intentLabelFor(intent, lang);
}

export function intentLabelFor(intent: PreviewIntent, lang: "de" | "en"): string {
  const de: Record<PreviewIntent, string> = {
    image_generation: "Bild erstellen",
    ai_influencer: "AI Influencer",
    product_visual: "Produktvisual",
    lora_training: "LoRA Training",
    image_upscale: "Bild verbessern",
    image_to_video: "Bild zu Video",
    video_upscale: "Video verbessern",
    hook_generation: "Hooks schreiben",
    campaign_planning: "Kampagne planen",
    asset_reuse: "Asset weiterverwenden",
    unknown: "Produktion vorbereiten",
  };
  const en: Record<PreviewIntent, string> = {
    image_generation: "Create image",
    ai_influencer: "AI Influencer",
    product_visual: "Product visual",
    lora_training: "LoRA Training",
    image_upscale: "Improve image",
    image_to_video: "Image to video",
    video_upscale: "Improve video",
    hook_generation: "Write hooks",
    campaign_planning: "Plan campaign",
    asset_reuse: "Reuse asset",
    unknown: "Prepare production",
  };
  return (lang === "de" ? de : en)[intent];
}

export function needsPlatformAsk(
  input: string,
  intent: PreviewIntent,
  platform: PreviewPlatform
): boolean {
  if (
    intent === "unknown" ||
    intent === "campaign_planning" ||
    intent === "hook_generation" ||
    intent === "asset_reuse" ||
    intent === "lora_training" ||
    intent === "image_upscale" ||
    intent === "video_upscale"
  ) {
    return false;
  }
  if (input.trim().length < 8) return false;
  return !platform;
}

export function postGenerationAgentHint(
  intent: PreviewIntent,
  lang: "de" | "en",
  hasImageContext: boolean,
  hasVideoContext: boolean
): string | null {
  const de = lang === "de";

  if (
    intent === "image_upscale" ||
    intent === "video_upscale" ||
    intent === "lora_training" ||
    intent === "hook_generation" ||
    intent === "campaign_planning"
  ) {
    return null;
  }

  if (
    intent === "image_generation" ||
    intent === "ai_influencer" ||
    intent === "product_visual"
  ) {
    return de
      ? "Soll ich das Bild noch für Export oder Ads verbessern? Wenn du willst, schärfe ich das Ergebnis noch mit Upscale nach."
      : "Want me to polish this for export or ads? I can sharpen the result with Upscale next.";
  }

  if (intent === "image_to_video" || hasVideoContext) {
    return de
      ? "Soll ich das Video noch in höherer Qualität ausgeben? Ich kann das Ergebnis jetzt mit einer Upscale-Pipeline veredeln."
      : "Should I export this video in higher quality? I can refine the result with an upscale pipeline now.";
  }

  return null;
}

export { engineLabelForIntent } from "./studio-engine-registry";

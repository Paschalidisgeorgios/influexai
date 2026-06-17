/** Mock intent routing — design-preview only, no API */

export type PreviewIntent =
  | "image_generation"
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
  "produktbild",
  "sunset",
  "ad",
  "post",
  "image",
  "photo",
  "picture",
  "erstelle ein bild",
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

const PLATFORM_RULES: { platform: PreviewPlatform; format: PreviewFormat; keywords: string[] }[] = [
  { platform: "instagram_reel", format: "9:16", keywords: ["instagram reel", "reel", "tiktok", "9:16"] },
  { platform: "instagram_feed", format: "4:5", keywords: ["instagram feed", "instagram post", "feed", "4:5"] },
  { platform: "youtube_thumbnail", format: "16:9", keywords: ["youtube thumbnail", "thumbnail", "16:9"] },
  { platform: "youtube_shorts", format: "9:16", keywords: ["youtube shorts", "shorts"] },
  { platform: "linkedin_post", format: "1:1", keywords: ["linkedin"] },
  { platform: "website_hero", format: "wide", keywords: ["website", "hero", "landing"] },
];

export function detectPreviewIntent(input: string): PreviewIntent {
  const q = input.toLowerCase().trim();
  if (!q) return "unknown";

  const scores: Record<Exclude<PreviewIntent, "unknown">, number> = {
    image_generation: 0,
    image_to_video: 0,
    hook_generation: 0,
    campaign_planning: 0,
    asset_reuse: 0,
  };

  for (const w of IMAGE_KEYWORDS) if (q.includes(w)) scores.image_generation += 1;
  for (const w of VIDEO_KEYWORDS) if (q.includes(w)) scores.image_to_video += 1;
  for (const w of HOOK_KEYWORDS) if (q.includes(w)) scores.hook_generation += 1;
  for (const w of CAMPAIGN_KEYWORDS) if (q.includes(w)) scores.campaign_planning += 1;
  for (const w of ASSET_KEYWORDS) if (q.includes(w)) scores.asset_reuse += 1;

  if (q.includes("verwandel") && q.includes("video")) scores.image_to_video += 2;
  if (q.includes("variant")) scores.asset_reuse += 2;
  if (q.includes("hooks für")) scores.hook_generation += 3;
  if (q.includes("starte kampagne")) scores.campaign_planning += 3;

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
  if (q.includes("youtube") && !q.includes("shorts")) {
    return { platform: "youtube_thumbnail", format: "16:9" };
  }
  return { platform: null, format: null };
}

export function buildOptimizedPrompt(input: string, intent: PreviewIntent): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const base = trimmed.replace(/\s+/g, " ");

  switch (intent) {
    case "image_generation":
      if (base.toLowerCase().includes("sunset")) {
        return "Golden hour sunset over mountains, cinematic photography, high detail, warm tones, editorial campaign quality";
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
    default:
      return `Production brief, ${base}, structured for InfluexAI workflow routing`;
  }
}

export function engineLabelForIntent(intent: PreviewIntent): string {
  switch (intent) {
    case "image_generation":
      return "InfluexAI Image Engine";
    case "image_to_video":
      return "InfluexAI Motion Engine";
    case "hook_generation":
    case "campaign_planning":
      return "InfluexAI Campaign Engine";
    case "asset_reuse":
      return "InfluexAI Asset Engine";
    default:
      return "InfluexAI Production Engine";
  }
}

export function intentLabelFor(intent: PreviewIntent, lang: "de" | "en"): string {
  const de: Record<PreviewIntent, string> = {
    image_generation: "Bild erstellen",
    image_to_video: "Bild zu Video",
    hook_generation: "Hooks schreiben",
    campaign_planning: "Kampagne planen",
    asset_reuse: "Asset weiterverwenden",
    unknown: "Produktion vorbereiten",
  };
  const en: Record<PreviewIntent, string> = {
    image_generation: "Create image",
    image_to_video: "Image to video",
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
  if (intent === "unknown" || intent === "campaign_planning" || intent === "hook_generation") {
    return false;
  }
  if (input.trim().length < 8) return false;
  return !platform;
}

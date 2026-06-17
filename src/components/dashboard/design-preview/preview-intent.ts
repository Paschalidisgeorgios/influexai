/** Mock intent routing — design-preview only, no API */

export type PreviewIntent =
  | "image_generation"
  | "image_to_video"
  | "campaign_planning"
  | "asset_reuse"
  | "unknown";

export type PreviewPlatform =
  | "instagram_reel"
  | "instagram_feed"
  | "youtube_thumbnail"
  | "linkedin_post"
  | "website_hero"
  | null;

export type PreviewFormat = "9:16" | "4:5" | "1:1" | "16:9" | "wide";

const IMAGE_KEYWORDS = ["bild", "visual", "foto", "produktbild", "ad", "post", "image", "photo", "picture"];
const VIDEO_KEYWORDS = ["video", "reel", "motion", "bewegen", "clip", "animate", "tiktok"];
const CAMPAIGN_KEYWORDS = ["kampagne", "hooks", "content", "plan", "ideen", "campaign", "calendar", "kalender"];
const ASSET_KEYWORDS = ["galerie", "asset", "variante", "bearbeiten", "remix", "gallery", "reuse"];

const PLATFORM_RULES: { platform: PreviewPlatform; format: PreviewFormat; keywords: string[] }[] = [
  { platform: "instagram_reel", format: "9:16", keywords: ["instagram reel", "reel", "tiktok", "9:16"] },
  { platform: "instagram_feed", format: "4:5", keywords: ["instagram feed", "instagram post", "feed", "4:5"] },
  { platform: "youtube_thumbnail", format: "16:9", keywords: ["youtube", "thumbnail", "16:9"] },
  { platform: "linkedin_post", format: "1:1", keywords: ["linkedin"] },
  { platform: "website_hero", format: "wide", keywords: ["website", "hero", "landing"] },
];

export function detectPreviewIntent(input: string): PreviewIntent {
  const q = input.toLowerCase().trim();
  if (!q) return "unknown";

  const scores: Record<PreviewIntent, number> = {
    image_generation: 0,
    image_to_video: 0,
    campaign_planning: 0,
    asset_reuse: 0,
    unknown: 0,
  };

  for (const w of IMAGE_KEYWORDS) if (q.includes(w)) scores.image_generation += 1;
  for (const w of VIDEO_KEYWORDS) if (q.includes(w)) scores.image_to_video += 1;
  for (const w of CAMPAIGN_KEYWORDS) if (q.includes(w)) scores.campaign_planning += 1;
  for (const w of ASSET_KEYWORDS) if (q.includes(w)) scores.asset_reuse += 1;

  if (q.includes("verwandel") && q.includes("video")) scores.image_to_video += 2;
  if (q.includes("variant")) scores.asset_reuse += 2;

  const ranked = (Object.entries(scores) as [PreviewIntent, number][])
    .filter(([k]) => k !== "unknown")
    .sort((a, b) => b[1] - a[1]);

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
  return { platform: null, format: null };
}

export function buildOptimizedPrompt(input: string, intent: PreviewIntent): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const base = trimmed.replace(/\s+/g, " ");

  switch (intent) {
    case "image_generation":
      return `Premium campaign visual, ${base}, clean composition, brand-safe lighting, high detail, social-ready export`;
    case "image_to_video":
      return `Cinematic product motion, ${base}, smooth camera move, short-form vertical video, natural lighting`;
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
    case "campaign_planning":
      return "InfluexAI Campaign Engine";
    case "asset_reuse":
      return "InfluexAI Asset Engine";
    default:
      return "InfluexAI Production Engine";
  }
}

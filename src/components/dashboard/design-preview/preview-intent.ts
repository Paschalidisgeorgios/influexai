/**
 * MOCK intent routing — /dashboard/design-preview only.
 * Keyword-based; no API calls.
 */

export type PreviewIntentId =
  | "image_generation"
  | "image_to_video"
  | "campaign_planning"
  | "asset_reuse"
  | "unknown";

export type PreviewPlatformHint = {
  platform: string;
  format: string;
  formatLabel: string;
};

const IMAGE_KW =
  /\b(bild|visual|foto|produktbild|image|photo|picture|thumbnail|mockup|instagram feed|feed post|\bad\b|\bpost\b)\b/i;
const VIDEO_KW =
  /\b(video|reel|motion|beweg|animier|clip|shorts|tiktok|seque)\b/i;
const CAMPAIGN_KW =
  /\b(kampagne|campaign|hooks?|content|plan|ideen|calendar|kalender|strateg)\b/i;
const ASSET_KW =
  /\b(galerie|gallery|asset|variante|variant|remix|bearbeit|reuse|wiederverwend|speicher)\b/i;

const PLATFORM_RULES: Array<{
  pattern: RegExp;
  platform: string;
  format: string;
  formatLabel: string;
}> = [
  { pattern: /\b(instagram reel|reels|tiktok|shorts|9:16)\b/i, platform: "Instagram Reel / TikTok", format: "9:16", formatLabel: "9:16 Hochformat" },
  { pattern: /\b(instagram feed|feed post|4:5)\b/i, platform: "Instagram Feed", format: "4:5", formatLabel: "4:5 Hochformat" },
  { pattern: /\b(instagram)\b/i, platform: "Instagram", format: "4:5", formatLabel: "4:5 Hochformat" },
  { pattern: /\b(youtube thumbnail|youtube|16:9)\b/i, platform: "YouTube Thumbnail", format: "16:9", formatLabel: "16:9 Querformat" },
  { pattern: /\b(linkedin)\b/i, platform: "LinkedIn Post", format: "1:1", formatLabel: "1:1 Quadrat" },
  { pattern: /\b(website hero|landing|hero banner|wide)\b/i, platform: "Website Hero", format: "16:9", formatLabel: "16:9 Wide" },
];

export function detectPlatform(text: string): PreviewPlatformHint | null {
  for (const rule of PLATFORM_RULES) {
    if (rule.pattern.test(text)) {
      return {
        platform: rule.platform,
        format: rule.format,
        formatLabel: rule.formatLabel,
      };
    }
  }
  return null;
}

export function detectPreviewIntent(text: string): {
  intent: PreviewIntentId;
  platform: PreviewPlatformHint | null;
  needsPlatform: boolean;
} {
  const trimmed = text.trim();
  if (!trimmed) {
    return { intent: "unknown", platform: null, needsPlatform: false };
  }

  const platform = detectPlatform(trimmed);

  let intent: PreviewIntentId = "unknown";
  if (ASSET_KW.test(trimmed) && !IMAGE_KW.test(trimmed) && !VIDEO_KW.test(trimmed)) {
    intent = "asset_reuse";
  } else if (VIDEO_KW.test(trimmed) || /\b(verwandel|turn.*video|image to video)\b/i.test(trimmed)) {
    intent = "image_to_video";
  } else if (IMAGE_KW.test(trimmed)) {
    intent = "image_generation";
  } else if (CAMPAIGN_KW.test(trimmed)) {
    intent = "campaign_planning";
  }

  const visualIntent =
    intent === "image_generation" || intent === "image_to_video";
  const needsPlatform = visualIntent && !platform;

  return { intent, platform, needsPlatform };
}

/** Mock English production prompt — UI preview only */
export function optimizeProductionPrompt(text: string, intent: PreviewIntentId): string {
  const base = text.trim();
  if (!base) return "";

  const platform = detectPlatform(base);
  const platformSuffix = platform
    ? ` Optimized for ${platform.platform} (${platform.format}).`
    : "";

  switch (intent) {
    case "image_generation":
      return `Premium campaign visual, ${base}. Clean composition, brand-safe lighting, high detail product photography style.${platformSuffix}`;
    case "image_to_video":
      return `Cinematic motion draft from reference frame. ${base}. Smooth camera motion, social-ready pacing.${platformSuffix}`;
    case "campaign_planning":
      return `Campaign structure and hook directions for: ${base}. Audience-aware angles, platform-native content plan.`;
    case "asset_reuse":
      return `Asset variant pipeline for: ${base}. Preserve brand look, generate reusable derivatives.`;
    default:
      return `Production brief: ${base}.${platformSuffix}`;
  }
}

export function engineLabelForIntent(intent: PreviewIntentId): string {
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

export const INTENT_LABELS: Record<PreviewIntentId, string> = {
  image_generation: "Bild erstellen",
  image_to_video: "Video erstellen",
  campaign_planning: "Kampagne planen",
  asset_reuse: "Asset wiederverwenden",
  unknown: "Produktion starten",
};

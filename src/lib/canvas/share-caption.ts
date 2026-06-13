import type { ShareMediaType, SharePlatform } from "./share-platforms";

const PLATFORM_TAGS: Record<SharePlatform, string[]> = {
  tiktok: ["#fyp", "#foryou", "#viral", "#tiktokdeutschland", "#creator"],
  instagram: ["#reels", "#reelsinstagram", "#instagood", "#viralreels", "#contentcreator"],
  youtube: ["#shorts", "#youtubeshorts", "#viral", "#subscribe", "#creator"],
};

const MEDIA_TAGS: Record<ShareMediaType, string[]> = {
  video: ["#ai", "#aivideo", "#trending"],
  image: ["#aiart", "#aigenerated", "#visualcontent"],
};

const STOP_WORDS = new Set([
  "der",
  "die",
  "das",
  "und",
  "mit",
  "für",
  "ein",
  "eine",
  "the",
  "and",
  "with",
  "for",
  "a",
  "an",
  "in",
  "on",
  "im",
  "am",
  "zu",
  "von",
]);

function keywordHashtags(prompt: string, max = 3): string[] {
  const words = prompt
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

  const unique = [...new Set(words)].slice(0, max);
  return unique.map((w) => `#${w.replace(/-/g, "")}`);
}

/** Builds a platform-aware caption from the generation prompt. */
export function buildShareCaption(
  prompt: string,
  mediaType: ShareMediaType,
  platform: SharePlatform
): string {
  const trimmed = prompt.trim();
  const hook = trimmed
    ? trimmed.length > 200
      ? `${trimmed.slice(0, 197).trim()}…`
      : trimmed
    : mediaType === "video"
      ? "Neues KI-Video aus dem Studio ✨"
      : "Neues KI-Bild aus dem Studio ✨";

  const tags = [
    ...keywordHashtags(trimmed),
    ...MEDIA_TAGS[mediaType].slice(0, 2),
    ...PLATFORM_TAGS[platform].slice(0, 4),
  ];

  const uniqueTags = [...new Set(tags)].slice(0, 8);
  return `${hook}\n\n${uniqueTags.join(" ")}`;
}

/** Default caption when no platform is selected yet (uses TikTok tag mix). */
export function buildDefaultShareCaption(
  prompt: string,
  mediaType: ShareMediaType
): string {
  return buildShareCaption(prompt, mediaType, "tiktok");
}

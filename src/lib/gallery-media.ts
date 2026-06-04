const AKOOL_JOB_PREFIX = "akool-job:";

const IMAGE_URL_HINT =
  /\.(jpe?g|png|webp|gif|avif)(\?|$)/i;
const VIDEO_URL_HINT =
  /\.(mp4|webm|mov|m3u8)(\?|$)/i;

export function isHttpMediaUrl(value: string): boolean {
  const t = value.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

export function resolveGenerationMediaUrls(
  type: string,
  prompt: string
): { imageUrl: string | null; videoUrl: string | null } {
  const trimmed = prompt.trim();
  if (!trimmed) return { imageUrl: null, videoUrl: null };

  if (trimmed.startsWith(AKOOL_JOB_PREFIX)) {
    return { imageUrl: null, videoUrl: null };
  }

  if (!isHttpMediaUrl(trimmed)) {
    return { imageUrl: null, videoUrl: null };
  }

  const lower = trimmed.toLowerCase();
  const t = type.toLowerCase();

  if (
    t.includes("ki-ich") ||
    t.includes("produkt") ||
    lower.includes("fal.media") ||
    IMAGE_URL_HINT.test(trimmed)
  ) {
    return { imageUrl: trimmed, videoUrl: null };
  }

  if (
    t.includes("live-creator") ||
    t.includes("video") ||
    VIDEO_URL_HINT.test(trimmed) ||
    lower.includes("akool")
  ) {
    return { imageUrl: null, videoUrl: trimmed };
  }

  if (VIDEO_URL_HINT.test(trimmed)) {
    return { imageUrl: null, videoUrl: trimmed };
  }
  if (IMAGE_URL_HINT.test(trimmed) || lower.includes("fal.")) {
    return { imageUrl: trimmed, videoUrl: null };
  }

  return { imageUrl: null, videoUrl: trimmed };
}

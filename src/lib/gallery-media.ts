import { parseGenerationAssetResult } from "@/lib/generation-asset-types";
import { GENERATED_ASSETS_BUCKET } from "@/lib/generation-assets";
import type { GalleryItem } from "@/lib/gallery-types";

export const AKOOL_JOB_PREFIX = "akool-job:";

const IMAGE_URL_HINT = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i;
const VIDEO_URL_HINT = /\.(mp4|webm|mov|m3u8)(\?|$)/i;

export function isHttpMediaUrl(value: string): boolean {
  const t = value.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

export function isInvalidMediaToken(value: string | undefined | null): boolean {
  if (!value?.trim()) return true;
  const trimmed = value.trim();
  if (trimmed.startsWith(AKOOL_JOB_PREFIX)) return true;
  if (trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return true;
  }
  return false;
}

export function resolveStorageMediaUrl(
  ref: string | undefined | null,
  getPublicUrl: (bucket: string, path: string) => string,
  bucket = GENERATED_ASSETS_BUCKET
): string | null {
  if (isInvalidMediaToken(ref)) return null;

  const trimmed = ref!.trim();

  if (trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("/api/")) {
    return trimmed;
  }

  if (trimmed.startsWith("http://")) {
    return null;
  }

  return getPublicUrl(bucket, trimmed);
}

function isImageGenerationType(type: string): boolean {
  const t = type.toLowerCase();
  return (
    t.includes("ki-ich") ||
    t === "ki-ich" ||
    t.includes("produkt") ||
    t.includes("image-generator") ||
    t === "image"
  );
}

function isVideoGenerationType(type: string): boolean {
  const t = type.toLowerCase();
  return (
    t.includes("live-creator") ||
    t.includes("video-remix") ||
    t.includes("voice") ||
    t.includes("stimme") ||
    t === "product_ad" ||
    t === "seedance" ||
    (t.includes("video") && !t.includes("remix"))
  );
}

function resolveLegacyPromptHttpUrl(
  type: string,
  prompt: string
): { imageUrl: string | null; videoUrl: string | null } {
  const trimmed = prompt.trim();
  if (isInvalidMediaToken(trimmed) || !isHttpMediaUrl(trimmed)) {
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
    t === "product_ad" ||
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

  return { imageUrl: null, videoUrl: null };
}

export function resolveGenerationMediaUrls(params: {
  type: string;
  prompt: string;
  generationId: string;
  result: unknown;
  getPublicUrl: (bucket: string, path: string) => string;
}): { imageUrl: string | null; videoUrl: string | null } {
  const { type, prompt, generationId, result, getPublicUrl } = params;
  const asset = parseGenerationAssetResult(result);
  const legacy = resolveLegacyPromptHttpUrl(type, prompt);

  let imageUrl: string | null = null;
  let videoUrl: string | null = null;

  if (isImageGenerationType(type)) {
    const storagePath =
      asset?.previewPath ??
      asset?.finalPath ??
      asset?.sourcePath ??
      asset?.upscaledPath;

    if (storagePath) {
      imageUrl =
        resolveStorageMediaUrl(storagePath, getPublicUrl) ??
        `/api/generated-image/${generationId}?variant=${
          asset?.previewPath ? "preview" : "final"
        }`;
    } else {
      imageUrl = legacy.imageUrl;
    }
  }

  if (isVideoGenerationType(type)) {
    const t = type.toLowerCase();

    if (asset?.finalPath) {
      videoUrl =
        resolveStorageMediaUrl(asset.finalPath, getPublicUrl) ??
        (t === "product_ad" || t === "seedance"
          ? `/api/generated-video/${generationId}`
          : null);
    }

    if (!videoUrl) {
      videoUrl = legacy.videoUrl;
    }
  }

  if (imageUrl && isInvalidMediaToken(imageUrl)) imageUrl = null;
  if (videoUrl && isInvalidMediaToken(videoUrl)) videoUrl = null;

  return { imageUrl, videoUrl };
}

export type { GalleryMediaItem } from "@/lib/gallery-media-client";
export {
  collectGalleryMedia,
  galleryItemMediaKey,
  galleryItemToMedia,
} from "@/lib/gallery-media-client";

import { fal } from "@fal-ai/client";
import { enhanceImagePrompt } from "@/lib/ai/imagePromptEnhancer";
import {
  getPlatformImageDimensions,
  resolveImagePlatformId,
  resolveImageStyleId,
  type ImagePlatformId,
  type ImageStyleId,
} from "@/lib/ai/imageStylePresets";
import { configureFalClient, getFalKey, parseFalError } from "@/lib/fal-image";

/** fal.ai Seedream 4.5 edit — image-to-image with reference URLs (docs: image_urls, max 10 used). */
export const SEEDREAM_V45_EDIT_MODEL = "fal-ai/bytedance/seedream/v4.5/edit";

const SEEDREAM_MAX_IMAGE_URLS = 10;
const SEEDREAM_MIN_EDGE_PX = 1920;

export type CharacterImageResult =
  | {
      ok: true;
      url: string;
      model: string;
      width?: number;
      height?: number;
      enhancedPrompt: string;
      styleId: ImageStyleId;
      platform: ImagePlatformId;
      referenceCount: number;
    }
  | { ok: false; error: string };

type SeedreamOutput = {
  data?: { images?: Array<{ url?: string; width?: number; height?: number }> };
  images?: Array<{ url?: string; width?: number; height?: number }>;
};

/** Seedream requires width/height ≥ 1920px per axis or sufficient total pixels. */
export function resolveSeedreamImageSize(platformId: ImagePlatformId): {
  width: number;
  height: number;
} {
  const { width, height } = getPlatformImageDimensions(platformId);
  if (width >= SEEDREAM_MIN_EDGE_PX && height >= SEEDREAM_MIN_EDGE_PX) {
    return { width, height };
  }
  const scale = SEEDREAM_MIN_EDGE_PX / Math.min(width, height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function buildSeedreamCharacterPrompt(enhancedPrompt: string, refCount: number): string {
  const figureRef =
    refCount === 1
      ? "Figure 1"
      : `Figure 1 through Figure ${Math.min(refCount, SEEDREAM_MAX_IMAGE_URLS)}`;
  return `Keep the exact same person as in ${figureRef} (identical face, hair, body type, skin tone). ${enhancedPrompt}`;
}

function extractSeedreamImage(result: unknown): {
  url: string;
  width?: number;
  height?: number;
} | null {
  const r = result as SeedreamOutput;
  const img = r.data?.images?.[0] ?? r.images?.[0];
  if (!img?.url) return null;
  return { url: img.url, width: img.width, height: img.height };
}

export async function generateCharacterImage(options: {
  referenceImageUrls: string[];
  userPrompt: string;
  styleId?: ImageStyleId | string;
  platform?: ImagePlatformId | string;
}): Promise<CharacterImageResult> {
  const referenceImageUrls = options.referenceImageUrls.filter(Boolean);
  const userPrompt = options.userPrompt.trim();
  const styleId = resolveImageStyleId(options.styleId);
  const platform = resolveImagePlatformId(options.platform);

  if (!userPrompt) {
    return { ok: false, error: "Bitte gib eine Szenenbeschreibung ein." };
  }
  if (referenceImageUrls.length === 0) {
    return {
      ok: false,
      error: "Mindestens ein Referenzbild erforderlich.",
    };
  }

  configureFalClient();
  if (!getFalKey()) {
    return {
      ok: false,
      error: "Charakter-Generierung ist nicht konfiguriert (FAL_KEY fehlt).",
    };
  }

  const imageUrls =
    referenceImageUrls.length > SEEDREAM_MAX_IMAGE_URLS
      ? referenceImageUrls.slice(-SEEDREAM_MAX_IMAGE_URLS)
      : referenceImageUrls;

  if (referenceImageUrls.length > SEEDREAM_MAX_IMAGE_URLS) {
    console.warn(
      `[character-gen] ${referenceImageUrls.length} refs supplied; Seedream uses last ${SEEDREAM_MAX_IMAGE_URLS}`
    );
  }

  const image_size = resolveSeedreamImageSize(platform);

  let enhanced;
  try {
    enhanced = await enhanceImagePrompt(userPrompt, {
      styleId,
      platform,
      characterMode: true,
    });
  } catch (error) {
    console.error("[character-gen] prompt enhancement failed:", error);
    return {
      ok: false,
      error: "Prompt konnte nicht optimiert werden.",
    };
  }

  const fullPrompt = buildSeedreamCharacterPrompt(enhanced.prompt, imageUrls.length);

  console.log("[character-gen]", SEEDREAM_V45_EDIT_MODEL, imageUrls.length, styleId, {
    image_size,
    prompt: fullPrompt,
  });

  try {
    const result = (await fal.subscribe(SEEDREAM_V45_EDIT_MODEL, {
      input: {
        prompt: fullPrompt,
        image_urls: imageUrls,
        image_size,
        num_images: 1,
        max_images: 1,
        enable_safety_checker: true,
      },
      logs: false,
    })) as SeedreamOutput;

    const parsed = extractSeedreamImage(result);
    if (!parsed) {
      return {
        ok: false,
        error: "Seedream lieferte kein Bild — bitte andere Referenzen oder Prompt versuchen.",
      };
    }

    return {
      ok: true,
      url: parsed.url,
      model: SEEDREAM_V45_EDIT_MODEL,
      width: parsed.width ?? image_size.width,
      height: parsed.height ?? image_size.height,
      enhancedPrompt: fullPrompt,
      styleId,
      platform,
      referenceCount: imageUrls.length,
    };
  } catch (error) {
    console.error("[character-gen] fal error:", error);
    return {
      ok: false,
      error: parseFalError(error),
    };
  }
}

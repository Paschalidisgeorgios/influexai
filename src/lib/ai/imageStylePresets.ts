export type ImageStyleId = "authentic" | "editorial" | "cinematic" | "product";

export type ImagePlatformId =
  | "tiktok_reels"
  | "instagram_feed"
  | "youtube_thumbnail"
  | "universal";

export type ImageStylePreset = {
  id: ImageStyleId;
  labelDE: string;
  /** Short lay-friendly subtitle shown under style chips in the UI. */
  subtitleDE: string;
  descriptor: string;
};

export type PlatformFormat = {
  id: ImagePlatformId;
  labelDE: string;
  width: number;
  height: number;
  aspectLabel: string;
};

export const IMAGE_STYLE_PRESETS: readonly ImageStylePreset[] = [
  {
    id: "authentic",
    labelDE: "Authentisch / UGC",
    subtitleDE: "Wie selbst fotografiert",
    descriptor:
      "natural lifestyle photography, shot on a modern smartphone in good daylight, tack sharp focus on the subject, crisp details, realistic skin with visible natural texture, no retouching, true-to-life colors, clean composition, authentic everyday moment",
  },
  {
    id: "editorial",
    labelDE: "Editorial",
    subtitleDE: "Wie ein Magazin",
    descriptor:
      "professional editorial photography, 85mm lens at f/2.0, soft directional studio light, natural skin texture preserved, subtle color grading, magazine quality",
  },
  {
    id: "cinematic",
    labelDE: "Cinematisch",
    subtitleDE: "Wie ein Filmposter",
    descriptor:
      "cinematic still frame, anamorphic lens look, shallow depth of field, dramatic motivated lighting, very subtle fine film grain, teal-orange color grade kept subtle",
  },
  {
    id: "product",
    labelDE: "Produkt",
    subtitleDE: "Für Produktfotos",
    descriptor:
      "commercial product photography, clean controlled studio lighting, sharp focus on product, realistic materials and reflections, minimal styled background",
  },
] as const;

export const PLATFORM_FORMATS: readonly PlatformFormat[] = [
  {
    id: "tiktok_reels",
    labelDE: "TikTok / Reels",
    width: 1080,
    height: 1920,
    aspectLabel: "9:16",
  },
  {
    id: "instagram_feed",
    labelDE: "Instagram Feed",
    width: 1080,
    height: 1350,
    aspectLabel: "4:5",
  },
  {
    id: "youtube_thumbnail",
    labelDE: "Thumbnail",
    width: 1920,
    height: 1080,
    aspectLabel: "16:9",
  },
  {
    id: "universal",
    labelDE: "Quadrat",
    width: 1080,
    height: 1080,
    aspectLabel: "1:1",
  },
] as const;

export const DEFAULT_IMAGE_STYLE_ID: ImageStyleId = "authentic";
export const DEFAULT_IMAGE_PLATFORM_ID: ImagePlatformId = "tiktok_reels";

const STYLE_IDS = new Set<string>(IMAGE_STYLE_PRESETS.map((p) => p.id));
const PLATFORM_IDS = new Set<string>(PLATFORM_FORMATS.map((p) => p.id));

export function resolveImageStyleId(styleId?: string | null): ImageStyleId {
  if (styleId && STYLE_IDS.has(styleId)) return styleId as ImageStyleId;
  return DEFAULT_IMAGE_STYLE_ID;
}

export function resolveImagePlatformId(
  platform?: string | null
): ImagePlatformId {
  if (platform && PLATFORM_IDS.has(platform)) {
    return platform as ImagePlatformId;
  }
  return DEFAULT_IMAGE_PLATFORM_ID;
}

export function getStylePreset(styleId?: string | null): ImageStylePreset {
  return (
    IMAGE_STYLE_PRESETS.find((p) => p.id === styleId) ?? IMAGE_STYLE_PRESETS[0]
  );
}

export function getPlatformFormat(platformId?: string | null): PlatformFormat {
  return (
    PLATFORM_FORMATS.find((p) => p.id === platformId) ?? PLATFORM_FORMATS[0]
  );
}

export function getPlatformImageDimensions(platformId?: string | null): {
  width: number;
  height: number;
} {
  const format = getPlatformFormat(platformId);
  return { width: format.width, height: format.height };
}

/** Closest fal preset for legacy fallback when custom dimensions are used. */
export function platformToFalImageSize(
  platformId: ImagePlatformId
): "square_hd" | "portrait_4_3" | "portrait_16_9" | "landscape_16_9" {
  switch (platformId) {
    case "tiktok_reels":
      return "portrait_16_9";
    case "instagram_feed":
      return "portrait_4_3";
    case "youtube_thumbnail":
      return "landscape_16_9";
    case "universal":
      return "square_hd";
  }
}

/** Infer style + platform from agent / chat user goal text. */
export function inferImageStyleAndPlatform(prompt: string): {
  styleId: ImageStyleId;
  platform: ImagePlatformId;
} {
  const text = prompt.toLowerCase();

  if (/produkt|product.?ad|packshot|werbung|commercial|e-?commerce|marke\b/.test(text)) {
    return { styleId: "product", platform: "tiktok_reels" };
  }
  if (/editorial|magazin|magazine|lookbook|fashion shoot/.test(text)) {
    return { styleId: "editorial", platform: "instagram_feed" };
  }
  if (/cinematic|film still|filmisch|anamorphic|movie frame/.test(text)) {
    return { styleId: "cinematic", platform: "youtube_thumbnail" };
  }
  if (/youtube|thumbnail|vorschaubild/.test(text)) {
    return { styleId: "authentic", platform: "youtube_thumbnail" };
  }
  if (/instagram|feed\b|4:5|4x5/.test(text) && !/tiktok|reels|shorts/.test(text)) {
    return { styleId: "authentic", platform: "instagram_feed" };
  }
  if (/tiktok|reels|shorts|ugc|vertical video/.test(text)) {
    return { styleId: "authentic", platform: "tiktok_reels" };
  }
  if (/quadrat|square|1:1|1x1/.test(text)) {
    return { styleId: "authentic", platform: "universal" };
  }

  return { styleId: DEFAULT_IMAGE_STYLE_ID, platform: DEFAULT_IMAGE_PLATFORM_ID };
}

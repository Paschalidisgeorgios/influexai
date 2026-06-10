/**
 * Central prompts and defaults for fal.ai image generation.
 * Bild Generator: QUALITY_PROMPT_PREFIX + CATEGORY_PROMPTS[category] + user prompt,
 * NEGATIVE_PROMPT, flux/dev (1 credit) vs flux-pro (3 credits), clarity-upscaler (2 credits).
 */

export const NEGATIVE_PROMPT = `
blurry, out of focus, low quality, low resolution, 
pixelated, jpeg artifacts, compression artifacts,
bad anatomy, bad proportions, deformed, mutated,
extra limbs, missing limbs, floating limbs,
bad hands, extra fingers, missing fingers, fused fingers,
ugly, disfigured, malformed, distorted face,
text errors, gibberish text, wrong text, blurry text,
watermark, signature, logo, username, artist name,
cropped, cut off, out of frame,
oversaturated, overexposed, underexposed,
draft, sketch, unfinished, amateur,
noise, grain, film grain,
duplicate, clone, multiple people (unless requested),
bad composition, cluttered background
`
  .trim()
  .replace(/\n/g, ", ");

export const QUALITY_PROMPT_PREFIX = `
masterpiece, best quality, ultra high resolution, 
8K, photorealistic, hyperrealistic, 
sharp focus, perfect lighting, cinematic,
professional photography, studio quality,
`
  .trim()
  .replace(/\n/g, ", ");

export type ImageGenerationFeature =
  | "portrait"
  | "thumbnail"
  | "product"
  | "faceSwap"
  | "generic";

const FEATURE_NEGATIVE_EXTRAS: Record<ImageGenerationFeature, string> = {
  portrait: `
cartoon, anime, illustration, painting, drawing,
bad skin, skin blemishes, acne, bad teeth,
crossed eyes, lazy eye, asymmetric face,
neon lights, neon colors, rgb color grading, rgb lighting,
color leaks, color artifacts, lens flare, bokeh artifacts,
plastic skin, unrealistic skin
`
    .trim()
    .replace(/\n/g, ", "),
  thumbnail: `
boring composition, centered subject only,
no contrast, flat lighting, stock photo look,
dull colors, low contrast, generic stock photo
`
    .trim()
    .replace(/\n/g, ", "),
  product: `
fake product, wrong brand, distorted product,
bad product placement, floating objects,
people, hands, distorted packaging
`
    .trim()
    .replace(/\n/g, ", "),
  faceSwap: `
double face, ghost face, transparent face,
misaligned features, uncanny valley,
blended edges, face seam, duplicate face
`
    .trim()
    .replace(/\n/g, ", "),
  generic: "",
};

/** Scene-specific negatives for KI-Ich (portrait in arbitrary scenes). */
export const PORTRAIT_SCENE_NEGATIVE = `
neon lights, neon colors, rgb color grading, rgb lighting,
color leaks, lens flare, bokeh artifacts, overexposed, underexposed,
blur, cartoon, anime, illustration, painting, plastic skin
`
  .trim()
  .replace(/\n/g, ", ");

function normalizePromptBlock(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export const CATEGORY_PROMPTS = {
  portrait: {
    label: "Portrait",
    prefix: normalizePromptBlock(`
      professional portrait photography, beautiful person,
      perfect skin, natural lighting, bokeh background,
      high-end fashion, editorial style, sharp eyes,
      detailed hair, cinematic color grading,
    `),
    negative_extra: normalizePromptBlock(`
      bad skin, acne, blemishes, bad teeth,
      crossed eyes, asymmetric face, double chin,
      cartoon, anime, illustration, painting,
    `),
  },
  creator: {
    label: "Content Creator",
    prefix: normalizePromptBlock(`
      content creator aesthetic, ring light setup,
      modern home studio, dark moody background,
      neon accent lighting, professional camera setup,
      lifestyle photography, authentic moment,
      cinematic dark atmosphere, green or purple accent light,
    `),
    negative_extra: normalizePromptBlock(`
      boring, flat lighting, stock photo,
      corporate look, office setting, white background,
    `),
  },
  cinematic: {
    label: "Cinematic",
    prefix: normalizePromptBlock(`
      cinematic photography, movie still,
      dramatic lighting, film grain subtle,
      anamorphic lens flare, depth of field,
      color graded, professional cinematography,
      IMAX quality, atmospheric, moody,
    `),
    negative_extra: normalizePromptBlock(`
      flat, boring, amateur, snapshot,
      phone camera quality, overexposed, underexposed,
    `),
  },
  product: {
    label: "Produkt",
    prefix: normalizePromptBlock(`
      professional product photography,
      studio lighting, clean background,
      commercial photography, sharp details,
      perfect reflections, luxury feel,
      advertising quality, 8K product shot,
    `),
    negative_extra: normalizePromptBlock(`
      floating, distorted product,
      wrong proportions, bad placement,
      dirty background, amateur lighting,
    `),
  },
  thumbnail: {
    label: "Thumbnail",
    prefix: normalizePromptBlock(`
      YouTube thumbnail style, high contrast,
      bold colors, eye-catching composition,
      dramatic expression, bright accent colors,
      clickbait aesthetic but professional,
      rule of thirds, strong focal point,
    `),
    negative_extra: normalizePromptBlock(`
      boring, low contrast,
      cluttered, text overlapping face,
      dark and muddy, low energy,
    `),
  },
  avatar: {
    label: "KI Avatar",
    prefix: normalizePromptBlock(`
      digital avatar, hyperrealistic human,
      perfect symmetrical face, studio lighting,
      professional headshot, clean background,
      sharp focus on face, photorealistic skin texture,
      professional appearance,
    `),
    negative_extra: normalizePromptBlock(`
      uncanny valley, robot look,
      CGI obvious, plastic skin, dead eyes,
      asymmetric, distorted features,
    `),
  },
  background: {
    label: "Hintergrund",
    prefix: normalizePromptBlock(`
      abstract background, professional studio backdrop,
      gradient, bokeh, atmospheric,
      no people, clean composition,
      suitable for video background,
    `),
    negative_extra: normalizePromptBlock(`
      people, faces, text, logos,
      cluttered, busy pattern, ugly colors,
    `),
  },
  lifestyle: {
    label: "Lifestyle",
    prefix: normalizePromptBlock(`
      lifestyle photography, authentic moment,
      natural light, candid feel but professional,
      aspirational lifestyle, modern urban setting,
      warm tones or dark moody aesthetic,
      editorial magazine quality,
    `),
    negative_extra: normalizePromptBlock(`
      staged, fake, stock photo look,
      corporate, boring, white background,
      bad composition,
    `),
  },
  viral: {
    label: "Viral Content",
    prefix: normalizePromptBlock(`
      viral social media aesthetic,
      bold and dramatic, high energy,
      trending visual style,
      eye-catching colors, strong emotion,
      scroll-stopping image,
      Gen Z aesthetic, raw and authentic,
    `),
    negative_extra: normalizePromptBlock(`
      boring, generic,
      corporate stock photo, low energy,
      forgettable composition,
    `),
  },
  darknoir: {
    label: "Dark Noir",
    prefix: normalizePromptBlock(`
      dark noir aesthetic, black background,
      neon green or acid yellow accent lighting,
      high contrast, dramatic shadows,
      cinematic dark mood, mysterious atmosphere,
      professional photography, urban nightlife feel,
    `),
    negative_extra: normalizePromptBlock(`
      bright, cheerful, colorful,
      white background, flat lighting, daytime,
    `),
  },
} as const;

export type ImageCategoryKey = keyof typeof CATEGORY_PROMPTS;

export const IMAGE_CATEGORY_KEYS = Object.keys(
  CATEGORY_PROMPTS
) as ImageCategoryKey[];

export type FalImageSize =
  | "square_hd"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9";

export const VALID_FAL_IMAGE_SIZES: FalImageSize[] = [
  "square_hd",
  "portrait_4_3",
  "portrait_16_9",
  "landscape_4_3",
  "landscape_16_9",
];

export function buildCategoryPrompt(
  category: ImageCategoryKey,
  userPrompt: string
): string {
  const cat = CATEGORY_PROMPTS[category];
  return `${QUALITY_PROMPT_PREFIX}${cat.prefix}, ${userPrompt.trim()}`;
}

export function buildCategoryNegativePrompt(category: ImageCategoryKey): string {
  const cat = CATEGORY_PROMPTS[category];
  return `${NEGATIVE_PROMPT}${cat.negative_extra}`;
}

/** UI format chips → fal image_size */
export function uiFormatToImageSize(
  format: "1:1" | "16:9" | "9:16" | "4:3"
): FalImageSize {
  switch (format) {
    case "1:1":
      return "square_hd";
    case "9:16":
      return "portrait_16_9";
    case "4:3":
      return "landscape_4_3";
    default:
      return "landscape_16_9";
  }
}

export const FAL_IMAGE_MODELS = {
  FLUX_PULID: "fal-ai/flux-pulid",
  /** Bild Generator — FLUX.2 [pro] (primary) */
  FLUX_2_PRO: "fal-ai/flux-2-pro",
  /** Bild Generator high-res fallback */
  FLUX_PRO_T2I: "fal-ai/flux-pro",
  /** FLUX Pro v1.1 (product, thumbnail pages). */
  FLUX_PRO: "fal-ai/flux-pro/v1.1",
  /** Bild Generator standard fallback */
  FLUX_DEV: "fal-ai/flux/dev",
  CLARITY_UPSCALER: "fal-ai/clarity-upscaler",
} as const;

/** fal-ai/flux-2-pro custom sizes — short edge ≥ 1080px */
export function resolveFlux2ProImageSize(
  imageSize: FalImageSize
): { width: number; height: number } {
  switch (imageSize) {
    case "square_hd":
      return { width: 1080, height: 1080 };
    case "portrait_16_9":
      return { width: 1080, height: 1920 };
    case "landscape_16_9":
      return { width: 1920, height: 1080 };
    case "portrait_4_3":
      return { width: 1080, height: 1440 };
    case "landscape_4_3":
      return { width: 1440, height: 1080 };
    default:
      return { width: 1920, height: 1080 };
  }
}

export const TEXT_TO_IMAGE_STYLE_SUFFIX: Record<string, string> = {
  realistic: "photorealistic, natural lighting, highly detailed, realistic",
  cinematic: "cinematic lighting, dramatic atmosphere, film still, widescreen",
  portrait: "portrait photography, shallow depth of field, face in focus",
  product: "product photography, studio lighting, clean background, commercial",
};

export function styleToImageFeature(style: string): ImageGenerationFeature {
  if (style === "portrait") return "portrait";
  if (style === "product") return "product";
  if (style === "cinematic") return "thumbnail";
  return "generic";
}

export function aspectRatioToImageSize(
  aspectRatio: string
): "landscape_16_9" | "portrait_16_9" | "square_hd" {
  if (aspectRatio === "9:16") return "portrait_16_9";
  if (aspectRatio === "1:1") return "square_hd";
  return "landscape_16_9";
}

export const IMAGE_GEN_DEFAULTS = {
  preview: {
    num_inference_steps: 30,
    guidance_scale: 4,
  },
  final: {
    num_inference_steps: 40,
    guidance_scale: 4,
  },
  fluxDev: {
    num_inference_steps: 30,
    guidance_scale: 7.5,
  },
  textToImage: {
    num_inference_steps: 28,
    guidance_scale: 7.5,
  },
  textToImageHighRes: {
    num_inference_steps: 40,
    guidance_scale: 7.5,
  },
  upscale: {
    upscale_factor: 2,
    creativity: 0.25,
    resemblance: 0.9,
    guidance_scale: 4,
    num_inference_steps: 18,
  },
} as const;

function joinPromptParts(parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(", ");
}

export function buildNegativePrompt(
  feature: ImageGenerationFeature = "generic",
  extra?: string
): string {
  return joinPromptParts([
    NEGATIVE_PROMPT,
    FEATURE_NEGATIVE_EXTRAS[feature],
    extra ?? "",
  ]);
}

/** Extra negatives for Kling product video ads (image-to-video). */
export const PRODUCT_VIDEO_NEGATIVE_EXTRA = `
blurry product, distorted product, wrong colors,
floating objects, bad product placement,
text errors, watermark, low quality packaging
`
  .trim()
  .replace(/\n/g, ", ");

export function buildProductVideoNegativePrompt(): string {
  return buildNegativePrompt("product", PRODUCT_VIDEO_NEGATIVE_EXTRA);
}

export function buildPositivePrompt(
  userPrompt: string,
  feature: ImageGenerationFeature = "generic"
): string {
  const trimmed = userPrompt.trim();
  if (!trimmed) return QUALITY_PROMPT_PREFIX;
  return joinPromptParts([QUALITY_PROMPT_PREFIX, trimmed]);
}

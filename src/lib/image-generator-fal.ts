import { fal } from "@fal-ai/client";
import {
  FLUX_ULTRA_MODEL,
  resolveFluxUltraAspectRatio,
} from "@/lib/ai/imagePromptEnhancer";
import {
  buildCategoryNegativePrompt,
  buildCategoryPrompt,
  buildNegativePrompt,
  buildPositivePrompt,
  FAL_IMAGE_MODELS,
  IMAGE_GEN_DEFAULTS,
  isKreaModel,
  resolveFlux2ProImageSize,
  type FalImageSize,
  type ImageCategoryKey,
} from "@/lib/generation-config";

type FalImagesOutput = {
  data?: {
    images?: Array<{ url?: string; width?: number; height?: number }>;
    image?: { url?: string };
  };
  images?: Array<{ url?: string; width?: number; height?: number }>;
  image?: { url?: string };
};

export type CategoryImageResult = {
  url: string;
  model: string;
  width?: number;
  height?: number;
};

function extractImageResult(result: unknown): CategoryImageResult | null {
  const r = result as FalImagesOutput & {
    data?: { images?: Array<{ url?: string; width?: number; height?: number }> };
  };
  const img =
    r.data?.images?.[0] ??
    r.images?.[0] ??
    (r.data?.image?.url ? { url: r.data.image.url } : null) ??
    (r.image?.url ? { url: r.image.url } : null);
  if (!img?.url) return null;
  return {
    url: img.url,
    model: "",
    width: img.width,
    height: img.height,
  };
}

/** flux-pro/v1.1-ultra has no negative_prompt field — legacy fallbacks use it separately. */
async function subscribeFalImage(
  model: string,
  input: Record<string, unknown>
): Promise<FalImagesOutput> {
  return (await fal.subscribe(model, {
    input,
    logs: false,
  })) as FalImagesOutput;
}

/** flux-pro/v1.1-ultra — see https://fal.ai/models/fal-ai/flux-pro/v1.1-ultra/api */
async function generateWithFluxUltra(options: {
  fullPrompt: string;
  negativePrompt: string;
  imageSize: FalImageSize;
  imageDimensions?: { width: number; height: number };
  seed?: number;
}): Promise<CategoryImageResult> {
  const dims =
    options.imageDimensions ?? resolveFlux2ProImageSize(options.imageSize);
  const aspect_ratio = resolveFluxUltraAspectRatio(dims.width, dims.height);

  // fal.ai flux-pro/v1.1-ultra Input: aspect_ratio, num_images, output_format, raw,
  // safety_tolerance (1–6). No num_inference_steps / guidance_scale / enable_safety_checker
  // on this endpoint — those belong to flux-pro (non-ultra) schemas.
  const input = {
    prompt: options.fullPrompt,
    aspect_ratio,
    num_images: 1,
    output_format: "jpeg" as const,
    raw: false,
    safety_tolerance: "2" as const,
    ...(options.seed != null ? { seed: options.seed } : {}),
  };

  console.log("[image-gen] fal model:", FLUX_ULTRA_MODEL);
  console.log("[image-gen] fal aspect_ratio:", aspect_ratio);
  console.log("[image-gen] fal target dimensions:", dims);
  console.log("[image-gen] fal prompt:", options.fullPrompt);
  console.log(
    "[image-gen] fal negative_prompt: (omitted for flux-pro/v1.1-ultra)",
    options.negativePrompt ? "[present for legacy fallback]" : "[none]"
  );

  const result = await subscribeFalImage(FLUX_ULTRA_MODEL, input);
  const parsed = extractImageResult(result);
  if (!parsed) throw new Error("Kein Bild in der API-Antwort");
  return {
    ...parsed,
    model: FLUX_ULTRA_MODEL,
    width: parsed.width ?? dims.width,
    height: parsed.height ?? dims.height,
  };
}

async function generateWithLegacyModel(options: {
  fullPrompt: string;
  negativePrompt: string;
  imageSize: FalImageSize;
  imageDimensions?: { width: number; height: number };
  highRes: boolean;
  seed?: number;
}): Promise<CategoryImageResult> {
  const resolvedImageSize =
    options.imageDimensions ?? options.imageSize;

  if (options.highRes) {
    const proInput = {
      prompt: options.fullPrompt,
      negative_prompt: options.negativePrompt,
      image_size: resolvedImageSize,
      num_inference_steps: IMAGE_GEN_DEFAULTS.textToImageHighRes.num_inference_steps,
      guidance_scale: IMAGE_GEN_DEFAULTS.textToImageHighRes.guidance_scale,
      num_images: 1,
      safety_tolerance: "2" as const,
      output_format: "jpeg" as const,
      ...(options.seed != null ? { seed: options.seed } : {}),
    };

    console.log("[image-gen] fal model (fallback):", FAL_IMAGE_MODELS.FLUX_PRO_T2I);
    console.log("[image-gen] fal image_size:", options.imageSize);

    const result = await subscribeFalImage(
      FAL_IMAGE_MODELS.FLUX_PRO_T2I,
      proInput as Record<string, unknown>
    );
    const parsed = extractImageResult(result);
    if (!parsed) throw new Error("Kein Bild in der API-Antwort");
    return { ...parsed, model: FAL_IMAGE_MODELS.FLUX_PRO_T2I };
  }

  const devInput = {
    prompt: options.fullPrompt,
    negative_prompt: options.negativePrompt,
    image_size: resolvedImageSize,
    num_inference_steps: IMAGE_GEN_DEFAULTS.textToImage.num_inference_steps,
    guidance_scale: IMAGE_GEN_DEFAULTS.textToImage.guidance_scale,
    num_images: 1,
    enable_safety_checker: true,
    output_format: "jpeg" as const,
    ...(options.seed != null ? { seed: options.seed } : {}),
  };

  console.log("[image-gen] fal model (fallback):", FAL_IMAGE_MODELS.FLUX_DEV);
  console.log("[image-gen] fal image_size:", options.imageSize);

  const result = await subscribeFalImage(
    FAL_IMAGE_MODELS.FLUX_DEV,
    devInput as Record<string, unknown>
  );
  const parsed = extractImageResult(result);
  if (!parsed) throw new Error("Kein Bild in der API-Antwort");
  return { ...parsed, model: FAL_IMAGE_MODELS.FLUX_DEV };
}

/**
 * Normalises an aspect_ratio string to one of the values the Krea API accepts.
 * Krea accepts: 1:1, 4:3, 3:2, 16:9, 2.35:1, 4:5, 2:3, 9:16
 * We pass through exact matches; everything else falls back to 1:1.
 */
function resolveKreaAspectRatio(imageSize: FalImageSize): string {
  const KREA_VALID = new Set([
    "1:1",
    "4:3",
    "3:2",
    "16:9",
    "2.35:1",
    "4:5",
    "2:3",
    "9:16",
  ]);

  // Map fal FalImageSize strings (portrait_16_9 etc.) → Krea aspect ratios
  const FAL_TO_KREA: Record<string, string> = {
    portrait_16_9: "9:16",
    landscape_16_9: "16:9",
    square_hd: "1:1",
    square: "1:1",
    portrait_4_3: "4:3",
    landscape_4_3: "4:3",
  };

  if (KREA_VALID.has(imageSize)) return imageSize;
  return FAL_TO_KREA[imageSize] ?? "1:1";
}

async function generateWithKrea(options: {
  fullPrompt: string;
  modelId: string;
  imageSize: FalImageSize;
  seed?: number;
}): Promise<CategoryImageResult> {
  const aspectRatio = resolveKreaAspectRatio(options.imageSize);

  console.log("[image-gen] krea model:", options.modelId);
  console.log("[image-gen] krea aspect_ratio:", aspectRatio);
  console.log("[image-gen] krea prompt:", options.fullPrompt);

  const input: Record<string, unknown> = {
    prompt: options.fullPrompt,
    aspect_ratio: aspectRatio,
    // resolution: "1K",  // currently the only supported value — Krea default
  };
  if (options.seed != null) {
    input.seed = options.seed;
  }

  const result = await subscribeFalImage(options.modelId, input);
  const parsed = extractImageResult(result);
  if (!parsed) throw new Error("Kein Bild in der Krea-API-Antwort");
  return { ...parsed, model: options.modelId };
}

export async function generateCategoryImage(options: {
  prompt: string;
  modelId?: string;
  category: ImageCategoryKey;
  imageSize: FalImageSize;
  imageDimensions?: { width: number; height: number };
  highRes: boolean;
  seed?: number;
  /** When set, sent to fal.ai as-is (skips buildCategoryPrompt). */
  falPrompt?: string;
  negativePrompt?: string;
}): Promise<CategoryImageResult> {
  const fullPrompt =
    options.falPrompt ?? buildCategoryPrompt(options.category, options.prompt);
  const negativePrompt =
    options.negativePrompt ?? buildCategoryNegativePrompt(options.category);

  const modelId = options.modelId ?? FAL_IMAGE_MODELS.KREA_2_LARGE;

  if (isKreaModel(modelId)) {
    try {
      return await generateWithKrea({
        fullPrompt,
        modelId,
        imageSize: options.imageSize,
        seed: options.seed,
      });
    } catch (error) {
      console.log("[image-fallback] Krea failed, falling back to Flux 1.1 Pro Ultra:", error);
      return generateWithFluxUltra({
        fullPrompt,
        negativePrompt,
        imageSize: options.imageSize,
        imageDimensions: options.imageDimensions,
        seed: options.seed,
      });
    }
  }

  try {
    return await generateWithFluxUltra({
      fullPrompt,
      negativePrompt,
      imageSize: options.imageSize,
      imageDimensions: options.imageDimensions,
      seed: options.seed,
    });
  } catch (error) {
    console.log("[image-fallback]", error);
    return generateWithLegacyModel({
      fullPrompt,
      negativePrompt,
      imageSize: options.imageSize,
      imageDimensions: options.imageDimensions,
      highRes: options.highRes,
      seed: options.seed,
    });
  }
}

export async function upscaleGeneratorImage(imageUrl: string): Promise<string> {
  const result = (await fal.subscribe(FAL_IMAGE_MODELS.CLARITY_UPSCALER, {
    input: {
      image_url: imageUrl,
      prompt: buildPositivePrompt("sharp detail, preserve identity", "generic"),
      negative_prompt: buildNegativePrompt("generic"),
      upscale_factor: IMAGE_GEN_DEFAULTS.upscale.upscale_factor,
      creativity: IMAGE_GEN_DEFAULTS.upscale.creativity,
      resemblance: IMAGE_GEN_DEFAULTS.upscale.resemblance,
      enable_safety_checker: true,
    },
    logs: false,
  })) as FalImagesOutput;

  const parsed = extractImageResult(result);
  if (!parsed) throw new Error("Upscale lieferte kein Bild");
  return parsed.url;
}

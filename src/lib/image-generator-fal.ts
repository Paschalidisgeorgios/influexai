import { fal } from "@fal-ai/client";
import {
  buildCategoryNegativePrompt,
  buildCategoryPrompt,
  buildNegativePrompt,
  buildPositivePrompt,
  FAL_IMAGE_MODELS,
  IMAGE_GEN_DEFAULTS,
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

/** flux-2-pro has no negative_prompt API field — omit it (fallback models use it separately). */
async function subscribeFalImage(
  model: string,
  input: Record<string, unknown>
): Promise<FalImagesOutput> {
  return (await fal.subscribe(model, {
    input,
    logs: false,
  })) as FalImagesOutput;
}

async function generateWithFlux2Pro(options: {
  fullPrompt: string;
  negativePrompt: string;
  imageSize: FalImageSize;
  imageDimensions?: { width: number; height: number };
  seed?: number;
}): Promise<CategoryImageResult> {
  const image_size =
    options.imageDimensions ?? resolveFlux2ProImageSize(options.imageSize);

  console.log("[image-gen] fal model:", FAL_IMAGE_MODELS.FLUX_2_PRO);
  console.log("[image-gen] fal image_size:", image_size);
  console.log("[image-gen] fal prompt:", options.fullPrompt);
  console.log(
    "[image-gen] fal negative_prompt: (omitted for flux-2-pro)",
    options.negativePrompt ? "[present for fallback]" : "[none]"
  );

  const input = {
    prompt: options.fullPrompt,
    image_size,
    safety_tolerance: "2" as const,
    enable_safety_checker: true,
    output_format: "jpeg" as const,
    ...(options.seed != null ? { seed: options.seed } : {}),
  };

  const result = await subscribeFalImage(FAL_IMAGE_MODELS.FLUX_2_PRO, input);
  const parsed = extractImageResult(result);
  if (!parsed) throw new Error("Kein Bild in der API-Antwort");
  return {
    ...parsed,
    model: FAL_IMAGE_MODELS.FLUX_2_PRO,
    width: parsed.width ?? image_size.width,
    height: parsed.height ?? image_size.height,
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

export async function generateCategoryImage(options: {
  prompt: string;
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

  try {
    return await generateWithFlux2Pro({
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

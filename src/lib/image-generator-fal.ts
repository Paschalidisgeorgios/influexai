import { fal } from "@fal-ai/client";
import {
  buildCategoryNegativePrompt,
  buildCategoryPrompt,
  FAL_IMAGE_MODELS,
  IMAGE_GEN_DEFAULTS,
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

export async function generateCategoryImage(options: {
  prompt: string;
  category: ImageCategoryKey;
  imageSize: FalImageSize;
  highRes: boolean;
  seed?: number;
}): Promise<CategoryImageResult> {
  const fullPrompt = buildCategoryPrompt(options.category, options.prompt);
  const negativePrompt = buildCategoryNegativePrompt(options.category);

  if (options.highRes) {
    const proInput = {
      prompt: fullPrompt,
      negative_prompt: negativePrompt,
      image_size: options.imageSize,
      num_inference_steps: IMAGE_GEN_DEFAULTS.textToImageHighRes.num_inference_steps,
      guidance_scale: IMAGE_GEN_DEFAULTS.textToImageHighRes.guidance_scale,
      num_images: 1,
      safety_tolerance: "2" as const,
      output_format: "jpeg" as const,
      ...(options.seed != null ? { seed: options.seed } : {}),
    };

    const result = (await fal.subscribe(FAL_IMAGE_MODELS.FLUX_PRO_T2I, {
      input: proInput as typeof proInput & { prompt: string },
      logs: false,
    })) as FalImagesOutput;

    const parsed = extractImageResult(result);
    if (!parsed) throw new Error("Kein Bild in der API-Antwort");
    return { ...parsed, model: FAL_IMAGE_MODELS.FLUX_PRO_T2I };
  }

  const devInput = {
    prompt: fullPrompt,
    negative_prompt: negativePrompt,
    image_size: options.imageSize,
    num_inference_steps: IMAGE_GEN_DEFAULTS.textToImage.num_inference_steps,
    guidance_scale: IMAGE_GEN_DEFAULTS.textToImage.guidance_scale,
    num_images: 1,
    enable_safety_checker: true,
    output_format: "jpeg" as const,
    ...(options.seed != null ? { seed: options.seed } : {}),
  };

  const result = (await fal.subscribe(FAL_IMAGE_MODELS.FLUX_DEV, {
    // fal client types omit negative_prompt; API accepts it
    input: devInput as typeof devInput & { prompt: string },
    logs: false,
  })) as FalImagesOutput;

  const parsed = extractImageResult(result);
  if (!parsed) throw new Error("Kein Bild in der API-Antwort");
  return { ...parsed, model: FAL_IMAGE_MODELS.FLUX_DEV };
}

export async function upscaleGeneratorImage(imageUrl: string): Promise<string> {
  const { NEGATIVE_PROMPT } = await import("@/lib/generation-config");
  const result = (await fal.subscribe(FAL_IMAGE_MODELS.CLARITY_UPSCALER, {
    input: {
      image_url: imageUrl,
      upscale_factor: IMAGE_GEN_DEFAULTS.upscale.upscale_factor,
      creativity: IMAGE_GEN_DEFAULTS.upscale.creativity,
      resemblance: IMAGE_GEN_DEFAULTS.upscale.resemblance,
      negative_prompt: NEGATIVE_PROMPT,
      enable_safety_checker: true,
    },
    logs: false,
  })) as FalImagesOutput;

  const parsed = extractImageResult(result);
  if (!parsed) throw new Error("Upscale lieferte kein Bild");
  return parsed.url;
}

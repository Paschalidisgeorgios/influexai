import { fal } from "@fal-ai/client";
import {
  aspectRatioToImageSize,
  buildNegativePrompt,
  buildPositivePrompt,
  FAL_IMAGE_MODELS,
  IMAGE_GEN_DEFAULTS,
  PORTRAIT_SCENE_NEGATIVE,
  styleToImageFeature,
  TEXT_TO_IMAGE_STYLE_SUFFIX,
  type ImageGenerationFeature,
} from "@/lib/generation-config";

export type FalImageMode = "preview" | "final";

type FalImagesOutput = {
  data?: {
    images?: Array<{ url?: string }>;
    image?: { url?: string };
  };
  images?: Array<{ url?: string }>;
  image?: { url?: string };
};

export function getFalKey(): string | undefined {
  return process.env.FAL_API_KEY ?? process.env.FAL_KEY;
}

export function configureFalClient(): void {
  const key = getFalKey();
  if (key) fal.config({ credentials: key });
}

export function buildKiIchPrompt(userDescription: string): string {
  return buildPositivePrompt(
    [
      userDescription,
      "professional headshot",
      "natural lighting",
      "clean background",
      "natural skin texture",
      "natural skin tones",
      "professional photography",
    ].join(", "),
    "portrait"
  );
}

export function buildKiIchNegativePrompt(): string {
  return buildNegativePrompt("portrait", PORTRAIT_SCENE_NEGATIVE);
}

export function buildProductPrompt(productName: string, style: string): string {
  return buildPositivePrompt(
    [
      `professional product photography of ${productName}`,
      style,
      "clean white or gradient background",
      "studio lighting",
      "sharp product detail",
      "commercial photography",
      "centered composition",
      "no people",
    ].join(", "),
    "product"
  );
}

export function buildProductNegativePrompt(): string {
  return buildNegativePrompt("product");
}

export function buildThumbnailPrompt(concept: string): string {
  return buildPositivePrompt(
    [
      concept,
      "YouTube thumbnail style",
      "high contrast",
      "bold composition",
      "click-worthy",
      "dramatic lighting",
      "vivid colors",
    ].join(", "),
    "thumbnail"
  );
}

export function buildThumbnailNegativePrompt(): string {
  return buildNegativePrompt("thumbnail");
}

function extractImageUrl(result: unknown): string | null {
  const r = result as FalImagesOutput & {
    data?: { images?: Array<{ url?: string }>; image?: { url?: string } };
  };
  return (
    r.data?.images?.[0]?.url ??
    r.data?.image?.url ??
    r.images?.[0]?.url ??
    r.image?.url ??
    null
  );
}

export function parseFalError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Bildgenerierung fehlgeschlagen";

  const lower = message.toLowerCase();
  if (lower.includes("quota") || lower.includes("rate limit")) {
    return "API-Limit erreicht. Bitte versuche es später.";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "Generation hat zu lange gedauert. Nochmal versuchen?";
  }
  if (lower.includes("unauthorized") || lower.includes("api key")) {
    return "Bild-Generierung ist gerade nicht verfügbar.";
  }
  return "Bildgenerierung fehlgeschlagen. Bitte erneut versuchen.";
}

/** AI upscale for high-res output (2×, preserves identity). */
export async function upscaleImageClarity(
  imageUrl: string,
  options?: { prompt?: string; feature?: ImageGenerationFeature }
): Promise<string> {
  const feature = options?.feature ?? "generic";
  const result = (await fal.subscribe(FAL_IMAGE_MODELS.CLARITY_UPSCALER, {
    input: {
      image_url: imageUrl,
      prompt: options?.prompt ?? buildPositivePrompt("sharp detail", feature),
      negative_prompt: buildNegativePrompt(feature),
      upscale_factor: IMAGE_GEN_DEFAULTS.upscale.upscale_factor,
      creativity: IMAGE_GEN_DEFAULTS.upscale.creativity,
      resemblance: IMAGE_GEN_DEFAULTS.upscale.resemblance,
      guidance_scale: IMAGE_GEN_DEFAULTS.upscale.guidance_scale,
      num_inference_steps: IMAGE_GEN_DEFAULTS.upscale.num_inference_steps,
      enable_safety_checker: true,
    },
    logs: false,
  })) as FalImagesOutput;

  const url = extractImageUrl(result);
  if (!url) {
    throw new Error("Upscale lieferte kein Bild");
  }
  return url;
}

export type TextToImageStyle =
  | "realistic"
  | "cinematic"
  | "portrait"
  | "product"
  | string;

/** Text-to-image for Bild Generator (`fal-ai/flux-pro`). */
export async function generateTextToImage(options: {
  prompt: string;
  style: TextToImageStyle;
  aspectRatio: string;
  highQuality?: boolean;
}): Promise<string> {
  const styleKey = options.style in TEXT_TO_IMAGE_STYLE_SUFFIX
    ? options.style
    : "realistic";
  const feature = styleToImageFeature(styleKey);
  const styleSuffix = TEXT_TO_IMAGE_STYLE_SUFFIX[styleKey] ?? "";
  const userPrompt = [styleSuffix, options.prompt.trim()].filter(Boolean).join(", ");
  const fullPrompt = buildPositivePrompt(userPrompt, feature);
  const imageSize = aspectRatioToImageSize(options.aspectRatio);
  const steps = options.highQuality
    ? IMAGE_GEN_DEFAULTS.final.num_inference_steps
    : IMAGE_GEN_DEFAULTS.textToImage.num_inference_steps;

  const t2iInput = {
    prompt: fullPrompt,
    negative_prompt: buildNegativePrompt(feature),
    image_size: imageSize,
    num_inference_steps: steps,
    guidance_scale: IMAGE_GEN_DEFAULTS.textToImage.guidance_scale,
    num_images: 1,
    output_format: "jpeg" as const,
    safety_tolerance: "2" as const,
  };

  const result = (await fal.subscribe(FAL_IMAGE_MODELS.FLUX_PRO_T2I, {
    input: t2iInput as typeof t2iInput & { prompt: string },
    logs: false,
  })) as FalImagesOutput;

  let url = extractImageUrl(result);
  if (!url) {
    throw new Error("Kein Bild in der API-Antwort");
  }

  if (options.highQuality) {
    url = await upscaleImageClarity(url, {
      feature,
      prompt: fullPrompt,
    });
  }

  return url;
}

/** Text-to-image via FLUX Pro v1.1 (product, thumbnail, generic). */
export async function generateFluxProImage(options: {
  prompt: string;
  negativePrompt?: string;
  feature?: ImageGenerationFeature;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3";
  imageSize?: "landscape_16_9" | "portrait_16_9" | "square_hd";
}): Promise<string> {
  const feature = options.feature ?? "generic";
  const proInput = {
    prompt: buildPositivePrompt(options.prompt, feature),
    negative_prompt: options.negativePrompt ?? buildNegativePrompt(feature),
    ...(options.imageSize
      ? { image_size: options.imageSize }
      : { aspect_ratio: options.aspectRatio ?? "16:9" }),
    num_images: 1,
    output_format: "jpeg" as const,
    safety_tolerance: "2" as const,
    enhance_prompt: true,
  };

  const result = (await fal.subscribe(FAL_IMAGE_MODELS.FLUX_PRO, {
    input: proInput as typeof proInput & { prompt: string },
    logs: false,
  })) as FalImagesOutput;

  const url = extractImageUrl(result);
  if (!url) {
    throw new Error("Kein Bild in der API-Antwort");
  }
  return url;
}

/** FLUX Dev text-to-image (supports steps + guidance; quality via positive prompt). */
export async function generateFluxDevImage(options: {
  prompt: string;
  feature?: ImageGenerationFeature;
  imageSize?: "landscape_16_9" | "portrait_16_9" | "portrait_4_3";
  steps?: number;
}): Promise<string> {
  const feature = options.feature ?? "generic";
  const devInput = {
    prompt: buildPositivePrompt(options.prompt, feature),
    negative_prompt: buildNegativePrompt(feature),
    image_size: options.imageSize ?? "landscape_16_9",
    num_inference_steps:
      options.steps ?? IMAGE_GEN_DEFAULTS.fluxDev.num_inference_steps,
    guidance_scale: IMAGE_GEN_DEFAULTS.fluxDev.guidance_scale,
    num_images: 1,
    enable_safety_checker: true,
    output_format: "jpeg" as const,
  };

  const result = (await fal.subscribe(FAL_IMAGE_MODELS.FLUX_DEV, {
    input: devInput as typeof devInput & { prompt: string },
    logs: false,
  })) as FalImagesOutput;

  const url = extractImageUrl(result);
  if (!url) {
    throw new Error("Kein Bild in der API-Antwort");
  }
  return url;
}

/** Face-preserving portrait with Flux PuLID. */
export async function generateKiIchPortrait(
  referenceImageUrl: string,
  scene: string,
  mode: FalImageMode = "final"
): Promise<string> {
  const isFinal = mode === "final";
  const steps = isFinal
    ? IMAGE_GEN_DEFAULTS.final.num_inference_steps
    : IMAGE_GEN_DEFAULTS.preview.num_inference_steps;

  const result = (await fal.subscribe(FAL_IMAGE_MODELS.FLUX_PULID, {
    input: {
      prompt: buildKiIchPrompt(scene),
      reference_image_url: referenceImageUrl,
      negative_prompt: buildKiIchNegativePrompt(),
      image_size: isFinal
        ? { width: 1536, height: 2048 }
        : "portrait_4_3",
      num_inference_steps: steps,
      guidance_scale: isFinal
        ? IMAGE_GEN_DEFAULTS.final.guidance_scale
        : IMAGE_GEN_DEFAULTS.preview.guidance_scale,
      id_weight: isFinal ? 1 : 0.85,
      enable_safety_checker: true,
    },
    logs: false,
  })) as FalImagesOutput;

  let url = extractImageUrl(result);
  if (!url) {
    throw new Error("Kein Bild in der API-Antwort");
  }

  if (isFinal) {
    url = await upscaleImageClarity(url, {
      feature: "portrait",
      prompt: buildKiIchPrompt(scene),
    });
  }

  return url;
}

export async function uploadDataUrlToFal(imageUrl: string): Promise<string> {
  const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const blob = new Blob([buffer], { type: "image/jpeg" });
  const file = new File([blob], "face.jpg", { type: "image/jpeg" });
  return fal.storage.upload(file);
}

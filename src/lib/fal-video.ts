import { fal } from "@fal-ai/client";
import { buildProductVideoNegativePrompt } from "@/lib/generation-config";
import { KLING_PRODUCT_VIDEO_MODEL } from "@/lib/product-ad-config";
import { configureFalClient, getFalKey, parseFalError } from "@/lib/fal-image";

type KlingVideoOutput = {
  data?: { video?: { url?: string } };
  video?: { url?: string };
};

function extractVideoUrl(result: unknown): string | null {
  const r = result as KlingVideoOutput;
  return r.data?.video?.url ?? r.video?.url ?? null;
}

export type GenerateProductVideoOptions = {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  duration?: "5" | "10";
  aspectRatio?: "9:16" | "16:9" | "1:1";
  cfgScale?: number;
};

export async function generateKlingProductVideo(
  options: GenerateProductVideoOptions
): Promise<{ videoUrl: string; model: string }> {
  configureFalClient();
  if (!getFalKey()) {
    throw new Error("Video generation is not configured (API key missing).");
  }

  try {
    const result = await fal.subscribe(KLING_PRODUCT_VIDEO_MODEL, {
      input: {
        prompt: options.prompt,
        image_url: options.imageUrl,
        negative_prompt:
          options.negativePrompt ?? buildProductVideoNegativePrompt(),
        duration: options.duration ?? "5",
        aspect_ratio: options.aspectRatio ?? "9:16",
        cfg_scale: options.cfgScale ?? 0.5,
      },
      logs: false,
    });

    const videoUrl = extractVideoUrl(result);
    if (!videoUrl) {
      throw new Error("No video URL in API response");
    }

    return { videoUrl, model: KLING_PRODUCT_VIDEO_MODEL };
  } catch (error) {
    throw new Error(parseFalError(error));
  }
}

export { parseFalError as parseFalVideoError };

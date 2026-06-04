import { fal } from "@fal-ai/client";

const FLUX_PULID = "fal-ai/flux-pulid";

export type FalImageMode = "preview" | "final";

type FalImagesOutput = {
  data?: {
    images?: Array<{ url?: string }>;
  };
  images?: Array<{ url?: string }>;
};

export function getFalKey(): string | undefined {
  return process.env.FAL_API_KEY ?? process.env.FAL_KEY;
}

export function configureFalClient(): void {
  const key = getFalKey();
  if (key) fal.config({ credentials: key });
}

export function buildKiIchPrompt(userDescription: string): string {
  return [
    userDescription,
    "professional headshot",
    "natural lighting",
    "sharp focus",
    "photorealistic",
    "clean background",
    "8k quality",
    "no filters",
    "natural skin texture",
    "professional photography",
    "natural skin tones",
    "studio lighting",
  ].join(", ");
}

export function buildKiIchNegativePrompt(): string {
  return [
    "neon lights",
    "neon colors",
    "rgb color grading",
    "rgb lighting",
    "color leaks",
    "color artifacts",
    "lens flare",
    "bokeh artifacts",
    "noise",
    "grain",
    "overexposed",
    "underexposed",
    "blur",
    "cartoon",
    "anime",
    "illustration",
    "painting",
    "unrealistic skin",
    "plastic skin",
    "deformed",
    "bad anatomy",
    "extra limbs",
    "bad hands",
    "watermark",
    "text overlay",
    "logo",
    "distorted face",
  ].join(", ");
}

export function buildProductPrompt(productName: string, style: string): string {
  return [
    `professional product photography of ${productName}`,
    style,
    "clean white or gradient background",
    "studio lighting",
    "sharp product detail",
    "commercial photography",
    "8k resolution",
    "no people",
    "centered composition",
  ].join(", ");
}

export function buildProductNegativePrompt(): string {
  return [
    "neon colors",
    "color artifacts",
    "noise",
    "blur",
    "people",
    "hands",
    "watermark",
    "text",
    "logo",
    "distorted",
    "low quality",
  ].join(", ");
}

function extractImageUrl(result: unknown): string | null {
  const r = result as FalImagesOutput & {
    data?: { images?: Array<{ url?: string }> };
  };
  return r.data?.images?.[0]?.url ?? r.images?.[0]?.url ?? null;
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
    return "FAL API Key fehlt oder ist ungültig.";
  }
  return "Bildgenerierung fehlgeschlagen. Bitte erneut versuchen.";
}

/** Face-preserving portrait with Flux PuLID (replaces InstantID). */
export async function generateKiIchPortrait(
  referenceImageUrl: string,
  scene: string,
  mode: FalImageMode = "final"
): Promise<string> {
  const steps = mode === "preview" ? 14 : 20;

  const result = (await fal.subscribe(FLUX_PULID, {
    input: {
      prompt: buildKiIchPrompt(scene),
      reference_image_url: referenceImageUrl,
      negative_prompt: buildKiIchNegativePrompt(),
      image_size: "portrait_4_3",
      num_inference_steps: steps,
      guidance_scale: 3.5,
      id_weight: mode === "preview" ? 0.85 : 1,
    },
    logs: false,
  })) as FalImagesOutput;

  const url = extractImageUrl(result);
  if (!url) {
    throw new Error("Kein Bild in der API-Antwort");
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

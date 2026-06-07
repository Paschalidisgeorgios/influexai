import { fal } from "@fal-ai/client";
import {
  buildNegativePrompt,
  QUALITY_PROMPT_PREFIX,
} from "@/lib/generation-config";
import {
  FAL_LORA_MODELS,
  type LoraModelType,
  trainingFalEndpoint,
} from "@/lib/lora-config";
import { configureFalClient, getFalKey } from "@/lib/fal-image";

export function getLoraWebhookUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://influexaicreator.com");
  return `${base}/api/lora/webhook`;
}

type FalQueueSubmitResult = { request_id: string };

type FalQueueStatus = {
  status?: string;
  logs?: Array<{ message?: string }>;
  response?: unknown;
  error?: string;
};

export function extractLoraFileUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;

  const candidates = [
    data.diffusers_lora_file,
    data.lora_file,
    data.model_file,
    data.output,
  ];

  for (const c of candidates) {
    if (c && typeof c === "object" && "url" in c) {
      const url = (c as { url?: string }).url;
      if (url) return url;
    }
    if (typeof c === "string" && c.startsWith("http")) return c;
  }

  return null;
}

export function parseTrainingProgress(
  logs: Array<{ message?: string }> | undefined,
  steps: number
): number {
  if (!logs?.length || steps <= 0) return 0;
  const joined = logs.map((l) => l.message ?? "").join("\n");
  const match =
    joined.match(/(\d+)\s*\/\s*(\d+)/) ??
    joined.match(/step\s*(\d+)/i) ??
    joined.match(/(\d+)\s*of\s*(\d+)/i);
  if (!match) return 0;
  const current = parseInt(match[1], 10);
  const total = match[2] ? parseInt(match[2], 10) : steps;
  if (!Number.isFinite(current) || total <= 0) return 0;
  return Math.min(99, Math.round((current / total) * 100));
}

export async function submitLoraTraining(options: {
  type: LoraModelType;
  zipUrl: string;
  triggerWord: string;
  steps: number;
  isStyle: boolean;
  webhookUrl?: string;
}): Promise<{ requestId: string; endpoint: string }> {
  configureFalClient();
  if (!getFalKey()) {
    throw new Error(
      "LoRA training is not configured (FAL_API_KEY or FAL_KEY missing)."
    );
  }

  const endpoint = trainingFalEndpoint(options.type);
  const webhookUrl = options.webhookUrl ?? getLoraWebhookUrl();

  if (options.type === "portrait") {
    const { request_id } = (await fal.queue.submit(endpoint, {
      input: {
        images_data_url: options.zipUrl,
        trigger_phrase: options.triggerWord,
        steps: options.steps,
      },
      webhookUrl,
    })) as FalQueueSubmitResult;
    return { requestId: request_id, endpoint };
  }

  const { request_id } = (await fal.queue.submit(endpoint, {
    input: {
      images_data_url: options.zipUrl,
      trigger_word: options.triggerWord,
      is_style: options.isStyle,
      steps: options.steps,
    },
    webhookUrl,
  })) as FalQueueSubmitResult;

  return { requestId: request_id, endpoint };
}

export async function getLoraQueueStatus(
  endpoint: string,
  requestId: string
): Promise<FalQueueStatus> {
  configureFalClient();
  return (await fal.queue.status(endpoint, {
    requestId,
    logs: true,
  })) as FalQueueStatus;
}

export async function generateWithLora(options: {
  prompt: string;
  loraUrl: string;
  triggerWord: string;
  loraScale?: number;
  imageSize?: "portrait_16_9" | "landscape_16_9" | "square_hd";
  steps?: number;
}): Promise<{ url: string; width?: number; height?: number }> {
  configureFalClient();
  if (!getFalKey()) {
    throw new Error("LoRA generation is not configured.");
  }

  const fullPrompt = [
    QUALITY_PROMPT_PREFIX,
    options.prompt.trim(),
    options.triggerWord,
  ]
    .filter(Boolean)
    .join(", ");

  const result = (await fal.subscribe(FAL_LORA_MODELS.INFERENCE, {
    input: {
      prompt: fullPrompt,
      loras: [{ path: options.loraUrl, scale: options.loraScale ?? 0.9 }],
      negative_prompt: buildNegativePrompt("generic"),
      image_size: options.imageSize ?? "portrait_16_9",
      num_inference_steps: options.steps ?? 35,
      num_images: 1,
      enable_safety_checker: true,
    } as Record<string, unknown> & { prompt: string; loras: { path: string; scale: number }[] },
    logs: false,
  })) as {
    data?: { images?: Array<{ url?: string; width?: number; height?: number }> };
    images?: Array<{ url?: string; width?: number; height?: number }>;
  };

  const img =
    result.data?.images?.[0] ??
    result.images?.[0];
  if (!img?.url) {
    throw new Error("No image in LoRA generation response");
  }
  return { url: img.url, width: img.width, height: img.height };
}

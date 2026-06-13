import type { ToolApiDefinition, ToolOutputType } from "./toolApiSchema";
import {
  CanvasGenerationError,
  type CanvasApiErrorCode,
} from "./canvas-api-errors";

export type CanvasGenerationResult = {
  text?: string;
  url?: string;
  previewUrl?: string;
  data?: unknown;
};

const DEFAULT_TIMEOUT_MS = 120_000;

function mapHttpError(status: number, body: Record<string, unknown>): CanvasGenerationError {
  const raw =
    (typeof body.error === "string" && body.error) ||
    (typeof body.message === "string" && body.message) ||
    "";

  let code: CanvasApiErrorCode = "provider_error";
  if (status === 401 || status === 403) code = "unauthorized";
  else if (status === 402 || /credit|guthaben/i.test(raw)) code = "insufficient_credits";
  else if (status === 429) code = "rate_limit";
  else if (status >= 500) code = "provider_error";

  const creditsRefunded = code !== "insufficient_credits" && code !== "unauthorized";

  return new CanvasGenerationError(
    raw || `API-Fehler (${status})`,
    code,
    { status, creditsRefunded }
  );
}

function buildRequestBody(
  tool: ToolApiDefinition,
  params: Record<string, unknown>
): Record<string, unknown> {
  switch (tool.id) {
    case "flux-image":
      return {
        prompt: params.prompt,
        aspectRatio: params.aspect_ratio ?? "9:16",
        styleId: params.style_preset ?? "ugc",
        platform: "tiktok",
      };
    case "seedance-video": {
      const images = params.images_list;
      const imageUrl = Array.isArray(images) ? images[0] : undefined;
      return {
        prompt: params.prompt,
        imageUrl,
        duration: params.duration ?? 8,
        generate_audio: params.generate_audio ?? true,
      };
    }
    case "viral-hook":
      return { input: params.input ?? params.prompt ?? params.topic };
    case "trend-script":
      return {
        topic: params.topic ?? params.prompt,
        plattform: params.plattform ?? "TikTok",
      };
    default:
      return { ...params };
  }
}

function parseApiResponse(
  tool: ToolApiDefinition,
  body: Record<string, unknown>
): CanvasGenerationResult {
  const generationId =
    typeof body.generationId === "string"
      ? body.generationId
      : typeof body.generation_id === "string"
        ? body.generation_id
        : undefined;

  const videoUrl =
    typeof body.videoUrl === "string"
      ? body.videoUrl
      : typeof body.video_url === "string"
        ? body.video_url
        : undefined;

  const imageUrl =
    typeof body.imageUrl === "string"
      ? body.imageUrl
      : typeof body.image_url === "string"
        ? body.image_url
        : undefined;

  const url =
    videoUrl ??
    imageUrl ??
    (generationId && tool.outputType === "video"
      ? `/api/generated-video/${generationId}`
      : generationId && tool.outputType === "image"
        ? `/api/generated-image/${generationId}?variant=final`
        : undefined);

  const previewUrl =
    generationId && tool.outputType === "image"
      ? `/api/generated-image/${generationId}?variant=preview`
      : url;

  const text =
    typeof body.text === "string"
      ? body.text
      : typeof body.output === "string"
        ? body.output
        : Array.isArray(body.hooks)
          ? (body.hooks as string[]).join("\n\n")
          : undefined;

  return { text, url, previewUrl, data: body.data };
}

async function mockGeneration(
  tool: ToolApiDefinition,
  params: Record<string, unknown>
): Promise<CanvasGenerationResult> {
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 400));
  const mockText = `[${tool.label}] Output\n${JSON.stringify(params, null, 2).slice(0, 400)}`;

  if (tool.outputType === "text" || tool.outputType === "agent") {
    return { text: mockText };
  }
  if (tool.outputType === "image") {
    return {
      previewUrl: "/videos/landing/ki-influencer.mp4",
      url: "/videos/landing/ki-influencer.mp4",
    };
  }
  if (tool.outputType === "video") {
    return { url: "/videos/landing/seedance-2-0.mp4" };
  }
  if (tool.outputType === "calendar") {
    return { data: { weeks: 4, posts: 12 } };
  }
  return {};
}

export async function runCanvasGeneration(
  tool: ToolApiDefinition,
  params: Record<string, unknown>,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<CanvasGenerationResult> {
  if (!tool.apiRoute) {
    return mockGeneration(tool, params);
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  options?.signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(tool.apiRoute, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestBody(tool, params)),
      signal: controller.signal,
    });

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      throw mapHttpError(res.status, body);
    }

    return parseApiResponse(tool, body);
  } catch (err) {
    if (err instanceof CanvasGenerationError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new CanvasGenerationError(
        "API-Timeout — Deine Coins wurden nicht abgezogen.",
        "timeout",
        { creditsRefunded: true }
      );
    }
    if (err instanceof TypeError) {
      throw new CanvasGenerationError(
        "Verbindungsfehler — Deine Coins wurden nicht abgezogen.",
        "offline",
        { creditsRefunded: true }
      );
    }
    throw new CanvasGenerationError(
      "Generierung fehlgeschlagen — Deine Coins wurden erstattet.",
      "unknown",
      { creditsRefunded: true }
    );
  } finally {
    window.clearTimeout(timeout);
    options?.signal?.removeEventListener("abort", onAbort);
  }
}

export function outputTypeForTool(tool: ToolApiDefinition): ToolOutputType {
  return tool.outputType;
}

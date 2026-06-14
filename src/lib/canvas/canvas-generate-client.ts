import type { ToolApiDefinition, ToolOutputType } from "./toolApiSchema";
import {
  CanvasGenerationError,
  type CanvasApiErrorCode,
} from "./canvas-api-errors";
import { LANDING_VIDEOS } from "@/lib/landing-video-urls";

export type CanvasGenerationResult = {
  text?: string;
  url?: string;
  previewUrl?: string;
  data?: unknown;
  jobId?: string;
  generationId?: string;
  status?: string;
};

/** Default for synchronous tools; async job tools should pass a higher `timeoutMs`. */
export const DEFAULT_CANVAS_GENERATION_TIMEOUT_MS = 120_000;

/** Shorter timeout for async job POST endpoints that return `{ jobId }` immediately. */
export const CANVAS_ASYNC_JOB_START_TIMEOUT_MS = 60_000;

export type RunCanvasGenerationOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  onProgress?: CanvasSseProgressHandler;
};

export type CanvasSseProgressEvent = {
  type: "tool_start" | "tool_done" | "tool_error" | "estimate";
  tool?: string;
  label?: string;
  toolsDone?: number;
};

export type CanvasSseProgressHandler = (event: CanvasSseProgressEvent) => void;

const DEFAULT_TIMEOUT_MS = DEFAULT_CANVAS_GENERATION_TIMEOUT_MS;

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

function resolveSeedanceImageUrl(images: unknown): string | undefined {
  if (typeof images === "string" && images.trim()) {
    return images.trim();
  }
  if (Array.isArray(images)) {
    const first = images.find(
      (item): item is string => typeof item === "string" && item.trim().length > 0
    );
    return first?.trim();
  }
  return undefined;
}

export function validateSeedanceParams(
  params: Record<string, unknown>
): string | null {
  const imageUrl = resolveSeedanceImageUrl(params.images_list);
  const modelId =
    typeof params.modelId === "string" ? params.modelId.trim() : "";
  if (!imageUrl || !modelId) {
    return "Bitte Bild hochladen und Modell wählen";
  }
  return null;
}

export function validateKiIchParams(
  params: Record<string, unknown>
): string | null {
  const characterId =
    typeof params.characterId === "string" ? params.characterId.trim() : "";
  const prompt = typeof params.prompt === "string" ? params.prompt.trim() : "";
  if (!characterId) {
    return "Bitte einen trainierten Avatar-Klon wählen";
  }
  if (!prompt) {
    return "Bitte eine Szene beschreiben";
  }
  return null;
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
      const imageUrl = resolveSeedanceImageUrl(params.images_list);
      const resolution =
        typeof params.resolution === "string" ? params.resolution.trim() : "";
      return {
        prompt: params.prompt,
        imageUrl,
        modelId: params.modelId,
        duration: params.duration ?? 8,
        generate_audio: params.generate_audio ?? true,
        ...(resolution ? { resolution } : {}),
      };
    }
    case "viral-hook": {
      const nische = params.nische ?? params.input ?? params.prompt ?? params.topic;
      const plattform = params.plattform ?? "TikTok";
      const tonfall = params.tonfall;
      const parts = [
        typeof nische === "string" ? nische : "",
        plattform ? `Plattform: ${plattform}` : "",
        tonfall ? `Tonfall: ${tonfall}` : "",
      ].filter(Boolean);
      return { input: parts.join(" · ") || String(nische ?? "") };
    }
    case "script-generator":
      return {
        topic: params.topic,
        videoLength: params.video_laenge ?? "60s",
        tone: params.tonfall,
        language: params.sprache,
        toolId: "script-generator",
      };
    case "produkt-werbung":
      return {
        productName: params.produkt_name,
        productDescription: params.usps,
        audience: params.zielgruppe ?? "Allgemein",
        platform: params.plattform ?? "tiktok",
        style: params.werbe_ziel ?? "lifestyle",
        language: params.sprache ?? "de",
      };
    case "trend-script":
      return {
        topic: params.trend_thema ?? params.topic ?? params.prompt,
        platform: params.plattform ?? "TikTok",
        videoLength: params.video_laenge ?? "60s",
        scriptInput: params.script_input,
        toolId: "trend-script",
      };
    case "content-kalender": {
      const nischeInput =
        typeof params.nische === "string" ? params.nische.trim() : "";
      const zielgruppe =
        typeof params.zielgruppe === "string" ? params.zielgruppe.trim() : "";
      const nische = zielgruppe
        ? `${nischeInput} (Zielgruppe: ${zielgruppe})`
        : nischeInput;
      return {
        nische,
        plattform: params.plattform ?? "TikTok",
        frequenz: params.frequenz ?? "taeglich",
      };
    }
    case "melodia-studio": {
      const base =
        typeof params.message === "string" ? params.message.trim() : "";
      const context: string[] = [];
      if (params.duration) context.push(`Dauer: ${String(params.duration)}`);
      if (typeof params.bpm === "number" && params.bpm > 0) {
        context.push(`BPM: ${params.bpm}`);
      }
      const message =
        context.length > 0 ? `${base}\n\n${context.join("\n")}` : base;
      return { message };
    }
    case "agent-autopilot": {
      const goal =
        typeof params.campaign_goal === "string"
          ? params.campaign_goal.trim()
          : "";
      const platforms = Array.isArray(params.platforms)
        ? (params.platforms as string[]).filter(Boolean)
        : [];

      let message = goal;
      if (platforms.length > 0) {
        message += `\n\nKontext: ${platforms.join(", ")}.`;
      }
      return { message };
    }
    case "ki-ich": {
      const basePrompt =
        typeof params.prompt === "string" ? params.prompt.trim() : "";
      const kleidungsStil =
        typeof params.kleidungs_stil === "string"
          ? params.kleidungs_stil.trim()
          : "";
      const prompt = kleidungsStil
        ? `${basePrompt}\n\nKleidungsstil: ${kleidungsStil}`
        : basePrompt;

      return {
        characterId: params.characterId,
        prompt,
      };
    }
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

  const jobId = typeof body.jobId === "string" ? body.jobId : undefined;
  const responseStatus = typeof body.status === "string" ? body.status : undefined;
  const isAsyncProcessing = responseStatus === "processing" && !!jobId;

  const url =
    videoUrl ??
    imageUrl ??
    (!isAsyncProcessing && generationId && tool.outputType === "video"
      ? `/api/generated-video/${generationId}`
      : !isAsyncProcessing && generationId && tool.outputType === "image"
        ? `/api/generated-image/${generationId}?variant=final`
        : undefined);

  const previewUrl =
    generationId && tool.outputType === "image"
      ? `/api/generated-image/${generationId}?variant=preview`
      : url;

  const text =
    typeof body.text === "string"
      ? body.text
      : typeof body.script === "string"
        ? body.script
        : typeof body.output === "string"
          ? body.output
          : Array.isArray(body.hooks)
            ? (body.hooks as string[]).join("\n\n")
            : undefined;

  const data =
    body.data && typeof body.data === "object"
      ? body.data
      : undefined;

  if (Array.isArray(body.entries)) {
    const entries = body.entries as Array<{
      tag?: string;
      idee?: string;
      format?: string;
    }>;
    const calendarText = entries
      .map((e) => `${e.tag ?? ""}: ${e.idee ?? ""} (${e.format ?? ""})`.trim())
      .filter(Boolean)
      .join("\n");
    return {
      text: calendarText || text,
      data: { entries },
    };
  }

  return { text, url, previewUrl, data, jobId, generationId, status: responseStatus };
}

type SseStreamResult = {
  text: string;
  error?: string;
  outputs?: Record<string, unknown>;
};

async function consumeSseResponse(
  res: Response,
  signal?: AbortSignal,
  onProgress?: CanvasSseProgressHandler
): Promise<SseStreamResult> {
  const reader = res.body?.getReader();
  if (!reader) {
    throw new CanvasGenerationError(
      "Leere Server-Antwort.",
      "provider_error",
      { creditsRefunded: true }
    );
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let error: string | undefined;
  let outputs: Record<string, unknown> | undefined;
  let toolsCompletedCount = 0;

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload) continue;

        let event: Record<string, unknown>;
        try {
          event = JSON.parse(payload) as Record<string, unknown>;
        } catch {
          continue;
        }

        if (event.type === "text_delta" && typeof event.text === "string") {
          text += event.text;
        } else if (event.type === "error" && typeof event.message === "string") {
          error = event.message;
        } else if (
          event.type === "done" &&
          typeof event.summary === "string" &&
          event.summary.trim()
        ) {
          if (!text.trim()) text = event.summary;
        } else if (event.type === "tool_start") {
          onProgress?.({
            type: "tool_start",
            tool: typeof event.tool === "string" ? event.tool : undefined,
            label: typeof event.label === "string" ? event.label : undefined,
          });
        } else if (event.type === "tool_done") {
          toolsCompletedCount += 1;
          onProgress?.({
            type: "tool_done",
            tool: typeof event.tool === "string" ? event.tool : undefined,
            toolsDone: toolsCompletedCount,
          });
        } else if (event.type === "tool_error") {
          onProgress?.({
            type: "tool_error",
            tool: typeof event.tool === "string" ? event.tool : undefined,
          });
        } else if (
          event.type === "outputs" &&
          event.outputs &&
          typeof event.outputs === "object"
        ) {
          outputs = event.outputs as Record<string, unknown>;
        } else if (event.type === "estimate") {
          onProgress?.({ type: "estimate" });
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { text: text.trim(), error, outputs };
}

async function parseCanvasResponse(
  tool: ToolApiDefinition,
  res: Response,
  signal?: AbortSignal,
  onProgress?: CanvasSseProgressHandler
): Promise<CanvasGenerationResult> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("text/event-stream")) {
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      throw mapHttpError(res.status, body);
    }

    const streamed = await consumeSseResponse(res, signal, onProgress);
    if (streamed.error) {
      throw new CanvasGenerationError(streamed.error, "provider_error", {
        creditsRefunded: true,
      });
    }
    if (!streamed.text) {
      throw new CanvasGenerationError(
        "Leere KI-Antwort.",
        "provider_error",
        { creditsRefunded: true }
      );
    }
    return {
      text: streamed.text,
      data: streamed.outputs,
    };
  }

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    throw mapHttpError(res.status, body);
  }

  return parseApiResponse(tool, body);
}

async function mockGeneration(
  tool: ToolApiDefinition,
  params: Record<string, unknown>
): Promise<CanvasGenerationResult> {
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 400));
  const mockText = `[${tool.label}] Output\n${JSON.stringify(params, null, 2).slice(0, 400)}`;

  if (tool.outputType === "text" || tool.outputType === "script" || tool.outputType === "agent") {
    return { text: mockText };
  }
  if (tool.outputType === "image") {
    return {
      previewUrl: LANDING_VIDEOS.kiInfluencer,
      url: LANDING_VIDEOS.kiInfluencer,
    };
  }
  if (tool.outputType === "video") {
    return { url: LANDING_VIDEOS.seedance20 };
  }
  if (tool.outputType === "calendar") {
    return { data: { weeks: 4, posts: 12 } };
  }
  return {};
}

export async function runCanvasGeneration(
  tool: ToolApiDefinition,
  params: Record<string, unknown>,
  options?: RunCanvasGenerationOptions
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

    return parseCanvasResponse(tool, res, controller.signal, options?.onProgress);
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

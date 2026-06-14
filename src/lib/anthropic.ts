const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/** Claude Sonnet 4.5 — project default for text tools and API routes. */
export const CLAUDE_SONNET_45_MODEL = "claude-sonnet-4-5-20250929";

/** @deprecated Legacy alias — prefer CLAUDE_SONNET_45_MODEL. */
export const CLAUDE_35_SONNET_MODEL = "claude-3-5-sonnet-latest";

/** Script Generator & default API routes. */
export const SCRIPT_GENERATOR_MODEL = CLAUDE_SONNET_45_MODEL;

/** Default Claude model for dashboard text tools and API routes. */
export const ANTHROPIC_MODEL = CLAUDE_SONNET_45_MODEL;

export const CLAUDE_JSON_SYSTEM_RULE =
  "Antworte NUR mit validem JSON, ohne Markdown-Backticks oder zusätzlichen Text.";

/** Strip markdown fences and leading prose before JSON (Produkt-Werbung pattern). */
export function stripClaudeJson(raw: string): string {
  let text = raw.trim();
  if (!text) return text;

  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  text = text.replace(/```json|```/gi, "").trim();

  const start = text.search(/[[{]/);
  if (start > 0) {
    text = text.slice(start);
  }
  return text.trim();
}

export function parseClaudeJson<T>(raw: string): T {
  return JSON.parse(stripClaudeJson(raw)) as T;
}

export function getAnthropicConfigError(): string | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    return "KI ist gerade nicht verfügbar. Bitte später erneut versuchen.";
  }
  if (!key.startsWith("sk-ant-")) {
    return "KI ist gerade nicht verfügbar. Bitte später erneut versuchen.";
  }
  return null;
}

export function anthropicUserErrorFromStatus(status: number, body?: string): string {
  if (status === 404 && body?.includes("not_found_error")) {
    const match = body.match(/"message":"([^"]+)"/);
    if (match?.[1]) return `KI-Modell nicht verfügbar: ${match[1]}`;
  }
  if (status === 401 || status === 403) {
    return "KI ist gerade nicht verfügbar. Bitte später erneut versuchen.";
  }
  if (status === 429) {
    return "Zu viele Anfragen. Bitte kurz warten und erneut versuchen.";
  }
  if (status >= 500) {
    return "KI-Server vorübergehend nicht erreichbar. Bitte später erneut versuchen.";
  }
  return "KI-Anfrage fehlgeschlagen. Bitte später erneut versuchen.";
}

export function logAnthropicFailure(
  context: string,
  model: string,
  err: unknown
): void {
  if (isAnthropicApiError(err)) {
    console.error(
      `[${context}] Anthropic model=${model} status=${err.status}:`,
      err.message
    );
    return;
  }
  if (err instanceof Error) {
    console.error(`[${context}] Anthropic model=${model}:`, err.message);
    if (err.stack) console.error(err.stack);
    return;
  }
  console.error(`[${context}] Anthropic model=${model}:`, err);
}

function isAnthropicApiError(err: unknown): err is { status: number; message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
  );
}

/** Maps Anthropic SDK / fetch errors to HTTP status + user-facing German message. */
export function mapAnthropicSdkError(
  err: unknown,
  model?: string
): { status: number; message: string } {
  if (isAnthropicApiError(err)) {
    const userMessage = anthropicUserErrorFromStatus(err.status, err.message);
    if (err.status === 404) {
      return {
        status: 503,
        message: model
          ? `KI-Modell „${model}“ ist derzeit nicht verfügbar. Bitte später erneut versuchen.`
          : userMessage,
      };
    }
    if (err.status === 429) return { status: 429, message: userMessage };
    if (err.status === 401 || err.status === 403) return { status: 503, message: userMessage };
    if (err.status >= 500) return { status: 502, message: userMessage };
    return { status: 502, message: userMessage };
  }

  if (err instanceof Error && err.constructor.name === "APIConnectionError") {
    return {
      status: 503,
      message: "Netzwerkfehler bei der KI-Anfrage. Bitte erneut versuchen.",
    };
  }

  if (err instanceof Error) {
    if (/JSON|parse|Hook|Body|CTA|B-Roll|Leere/i.test(err.message)) {
      return { status: 502, message: "KI-Antwort konnte nicht verarbeitet werden." };
    }
    return { status: 500, message: err.message };
  }

  return { status: 500, message: "Unbekannter Fehler bei der KI-Anfrage." };
}

export type AnthropicContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
        data: string;
      };
    };

export type AnthropicMessageParams = {
  system: string;
  user: string | AnthropicContentBlock[];
  maxTokens?: number;
  model?: string;
  temperature?: number;
};

export type AnthropicMessageResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function createAnthropicMessage(
  params: AnthropicMessageParams
): Promise<AnthropicMessageResult> {
  const configError = getAnthropicConfigError();
  if (configError) {
    return { ok: false, error: configError };
  }

  const key = process.env.ANTHROPIC_API_KEY!.trim();

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: params.model ?? ANTHROPIC_MODEL,
        max_tokens: params.maxTokens ?? 4096,
        ...(params.temperature != null ? { temperature: params.temperature } : {}),
        system: params.system,
        messages: [
          {
            role: "user",
            content:
              typeof params.user === "string"
                ? params.user
                : params.user,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(
        "Anthropic API:",
        response.status,
        params.model ?? ANTHROPIC_MODEL,
        errBody.slice(0, 500)
      );
      return {
        ok: false,
        error: anthropicUserErrorFromStatus(response.status, errBody),
      };
    }

    const data = await response.json();
    const text = (data.content?.[0]?.text ?? "") as string;
    if (!text.trim()) {
      return { ok: false, error: "Leere KI-Antwort erhalten." };
    }
    return { ok: true, text };
  } catch (e) {
    console.error("Anthropic fetch:", e);
    if (e instanceof Error && e.stack) console.error(e.stack);
    return {
      ok: false,
      error: "Netzwerkfehler bei der KI-Anfrage. Bitte erneut versuchen.",
    };
  }
}

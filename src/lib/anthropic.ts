const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/** Same model as Produkt-Werbung (verified working in production). */
export const ANTHROPIC_MODEL = "claude-opus-4-5";

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

export function anthropicUserErrorFromStatus(status: number): string {
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

export type AnthropicMessageParams = {
  system: string;
  user: string;
  maxTokens?: number;
  model?: string;
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
        system: params.system,
        messages: [{ role: "user", content: params.user }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API:", response.status, errBody.slice(0, 500));
      return {
        ok: false,
        error: anthropicUserErrorFromStatus(response.status),
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
    return {
      ok: false,
      error: "Netzwerkfehler bei der KI-Anfrage. Bitte erneut versuchen.",
    };
  }
}

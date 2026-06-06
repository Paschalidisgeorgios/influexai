import { getAnthropicConfigError } from "@/lib/anthropic";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/** Fast model for conversational support — Melodia should respond quickly. */
export const MELODIA_MODEL = "claude-haiku-4-5-20251001";

export type MelodiaChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type MelodiaStreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export async function* streamMelodiaChat(
  system: string,
  messages: MelodiaChatMessage[]
): AsyncGenerator<MelodiaStreamEvent> {
  const configError = getAnthropicConfigError();
  if (configError) {
    yield { type: "error", message: configError };
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY!.trim();

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MELODIA_MODEL,
      max_tokens: 1024,
      system,
      messages,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const errBody = await response.text().catch(() => "");
    console.error("[melodia] Anthropic:", response.status, errBody.slice(0, 300));
    yield { type: "error", message: "Melodia ist gerade nicht erreichbar." };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;

      let event: Record<string, unknown>;
      try {
        event = JSON.parse(payload) as Record<string, unknown>;
      } catch {
        continue;
      }

      if (event.type === "content_block_delta") {
        const delta = event.delta as { type?: string; text?: string };
        if (delta?.type === "text_delta" && delta.text) {
          yield { type: "text_delta", text: delta.text };
        }
      }

      if (event.type === "message_stop") {
        yield { type: "done" };
        return;
      }
    }
  }

  yield { type: "done" };
}

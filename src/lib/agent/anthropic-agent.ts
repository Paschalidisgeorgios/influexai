import { getAnthropicConfigError } from "@/lib/anthropic";
import { MASTER_AGENT_TOOLS } from "./tools-definition";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export type AnthropicContentBlock =
  | { type: "text"; text: string }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    };

export type AnthropicToolResultBlock = {
  type: "tool_result";
  tool_use_id: string;
  content: string;
};

export type AnthropicMessageParam = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[] | AnthropicToolResultBlock[];
};

export type AnthropicTurnResult = {
  stopReason: string;
  content: AnthropicContentBlock[];
  text: string;
  toolUses: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
};

export async function runAnthropicAgentTurn(
  system: string,
  messages: AnthropicMessageParam[]
): Promise<
  | { ok: true; turn: AnthropicTurnResult }
  | { ok: false; error: string }
> {
  const configError = getAnthropicConfigError();
  if (configError) return { ok: false, error: configError };

  const key = process.env.ANTHROPIC_API_KEY!.trim();

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 8192,
      system,
      tools: MASTER_AGENT_TOOLS,
      messages,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error("[agent] Anthropic:", response.status, errBody.slice(0, 500));
    return { ok: false, error: "KI-Anfrage fehlgeschlagen." };
  }

  const data = await response.json();
  const blocks = (data.content ?? []) as AnthropicContentBlock[];
  const text = blocks
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("");

  const toolUses = blocks
    .filter(
      (b): b is Extract<AnthropicContentBlock, { type: "tool_use" }> =>
        b.type === "tool_use"
    )
    .map((b) => ({
      id: b.id,
      name: b.name,
      input: b.input ?? {},
    }));

  return {
    ok: true,
    turn: {
      stopReason: data.stop_reason ?? "end_turn",
      content: blocks,
      text,
      toolUses,
    },
  };
}

/** Stream one agent turn; yields text deltas, then tool_use summary at end. */
export async function* streamAnthropicAgentTurn(
  system: string,
  messages: AnthropicMessageParam[]
): AsyncGenerator<
  | { kind: "text_delta"; text: string }
  | {
      kind: "turn_end";
      stopReason: string;
      content: AnthropicContentBlock[];
      text: string;
      toolUses: AnthropicTurnResult["toolUses"];
    }
  | { kind: "error"; message: string }
> {
  const configError = getAnthropicConfigError();
  if (configError) {
    yield { kind: "error", message: configError };
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
      model: "claude-opus-4-5",
      max_tokens: 8192,
      system,
      tools: MASTER_AGENT_TOOLS,
      messages,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    yield { kind: "error", message: "KI-Stream fehlgeschlagen." };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const contentBlocks: AnthropicContentBlock[] = [];
  let currentText = "";
  let stopReason = "end_turn";

  const flushLine = (line: string) => {
    if (!line.startsWith("data: ")) return;
    const payload = line.slice(6).trim();
    if (payload === "[DONE]" || !payload) return;

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(payload) as Record<string, unknown>;
    } catch {
      return;
    }

    const type = event.type as string;

    if (type === "content_block_delta") {
      const delta = event.delta as { type?: string; text?: string };
      if (delta?.type === "text_delta" && delta.text) {
        currentText += delta.text;
        return delta.text;
      }
    }

    if (type === "content_block_start") {
      const block = event.content_block as AnthropicContentBlock;
      if (block?.type === "tool_use") {
        contentBlocks.push({
          type: "tool_use",
          id: block.id,
          name: block.name,
          input: {},
        });
      }
    }

    if (type === "content_block_delta" && (event.delta as { type?: string })?.type === "input_json_delta") {
      const partial = (event.delta as { partial_json?: string }).partial_json;
      const last = contentBlocks[contentBlocks.length - 1];
      if (last?.type === "tool_use" && partial) {
        try {
          const merged = JSON.parse(
            (last.input as { _raw?: string })._raw
              ? String((last.input as { _raw: string })._raw) + partial
              : partial
          );
          last.input = merged;
        } catch {
          (last.input as { _raw?: string })._raw =
            String((last.input as { _raw?: string })._raw ?? "") + partial;
        }
      }
    }

    if (type === "message_delta") {
      const dr = event.delta as { stop_reason?: string };
      if (dr?.stop_reason) stopReason = dr.stop_reason;
    }

    if (type === "message_stop") {
      return "__stop__";
    }

    return null;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const out = flushLine(line);
      if (out === "__stop__") break;
      if (typeof out === "string" && out) {
        yield { kind: "text_delta", text: out };
      }
    }
  }

  if (currentText) {
    contentBlocks.unshift({ type: "text", text: currentText });
  }

  const toolUses = contentBlocks
    .filter(
      (b): b is Extract<AnthropicContentBlock, { type: "tool_use" }> =>
        b.type === "tool_use"
    )
    .map((b) => {
      let input = b.input ?? {};
      if ((input as { _raw?: string })._raw) {
        try {
          input = JSON.parse((input as { _raw: string })._raw);
        } catch {
          input = {};
        }
      }
      return { id: b.id, name: b.name, input };
    });

  yield {
    kind: "turn_end",
    stopReason,
    content: contentBlocks.length ? contentBlocks : [{ type: "text", text: currentText }],
    text: currentText,
    toolUses,
  };
}

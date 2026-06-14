import type {
  AgentOutputs,
  AgentStreamEvent,
  AgentToolName,
} from "./types";

export type AgentStreamHandlers = {
  onTextDelta?: (text: string) => void;
  onToolStart?: (tool: AgentToolName, label: string) => void;
  onToolDone?: (tool: AgentToolName, creditsUsed: number) => void;
  onToolError?: (tool: AgentToolName, error: string) => void;
  onOutputs?: (outputs: AgentOutputs) => void;
  onCredits?: (creditsLeft: number, totalUsed: number) => void;
  onDone?: (summary: string) => void;
  onError?: (message: string) => void;
};

function dispatchEvent(event: AgentStreamEvent, handlers: AgentStreamHandlers): void {
  switch (event.type) {
    case "text_delta":
      handlers.onTextDelta?.(event.text);
      break;
    case "tool_start":
      handlers.onToolStart?.(event.tool, event.label);
      break;
    case "tool_done":
      handlers.onToolDone?.(event.tool, event.creditsUsed);
      break;
    case "tool_error":
      handlers.onToolError?.(event.tool, event.error);
      break;
    case "outputs":
      handlers.onOutputs?.(event.outputs);
      break;
    case "credits":
      handlers.onCredits?.(event.creditsLeft, event.totalUsed);
      break;
    case "done":
      handlers.onDone?.(event.summary);
      break;
    case "error":
      handlers.onError?.(event.message);
      break;
    case "estimate":
      break;
  }
}

function parseStreamEvent(jsonStr: string): AgentStreamEvent | null {
  try {
    const parsed = JSON.parse(jsonStr) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "type" in parsed &&
      typeof (parsed as { type: unknown }).type === "string"
    ) {
      return parsed as AgentStreamEvent;
    }
  } catch (e) {
    console.error("[consumeAgentStream] parse error:", e, jsonStr);
  }
  return null;
}

export async function consumeAgentStream(
  response: Response,
  handlers: AgentStreamHandlers
): Promise<void> {
  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        const event = parseStreamEvent(jsonStr);
        if (event) {
          dispatchEvent(event, handlers);
        }
      }
    }

    if (buffer.startsWith("data: ")) {
      const jsonStr = buffer.slice(6).trim();
      if (jsonStr) {
        const event = parseStreamEvent(jsonStr);
        if (event) {
          dispatchEvent(event, handlers);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

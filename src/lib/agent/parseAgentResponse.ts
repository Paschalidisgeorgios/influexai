export interface ParsedToolCall {
  toolId: string;
  params: Record<string, unknown>;
  raw: string;
}

export interface ParsedAgentResponse {
  cleanText: string;
  toolCalls: ParsedToolCall[];
}

const OPEN_TOOL_PATTERN = /\[OPEN_TOOL:([a-z0-9-]+):(\{.*?\})\]/g;

export function parseAgentResponse(rawResponse: string): ParsedAgentResponse {
  const toolCalls: ParsedToolCall[] = [];
  let match: RegExpExecArray | null;

  while ((match = OPEN_TOOL_PATTERN.exec(rawResponse)) !== null) {
    try {
      const params = JSON.parse(match[2]) as Record<string, unknown>;
      toolCalls.push({
        toolId: match[1],
        params,
        raw: match[0],
      });
    } catch (e) {
      console.error("Failed to parse OPEN_TOOL params:", match[0], e);
    }
  }

  let cleanText = rawResponse.replace(OPEN_TOOL_PATTERN, "").trim();
  cleanText = cleanText.replace(/\n{3,}/g, "\n\n");

  return { cleanText, toolCalls };
}

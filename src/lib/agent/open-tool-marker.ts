import type { IntentToolId } from "@/lib/agent/intentRouter";
import {
  buildIntentToolUrl,
  INTENT_TOOL_LABELS,
} from "@/lib/agent/intent-tool-navigation";

const OPEN_TOOL_REGEX =
  /\[OPEN_TOOL:([a-z0-9-]+):(\{[^[\]]+\})\]/g;

const VALID_TOOLS = new Set<string>([
  "image-generator",
  "ki-influencer",
  "ugc-video",
  "script-generator",
  "viral-hooks",
  "content-kalender",
  "trend-script",
  "product-ad",
  "thumbnail",
  "ki-agent",
]);

export type ParsedOpenTool = {
  tool: IntentToolId;
  prefill: Record<string, string>;
  label: string;
  href: string;
  raw: string;
};

export function parseOpenToolMarkers(text: string): {
  cleanText: string;
  markers: ParsedOpenTool[];
} {
  const markers: ParsedOpenTool[] = [];
  let cleanText = text;

  for (const match of text.matchAll(OPEN_TOOL_REGEX)) {
    const raw = match[0];
    const toolId = match[1];
    const jsonPart = match[2];

    if (!VALID_TOOLS.has(toolId)) continue;

    try {
      const prefill = JSON.parse(jsonPart) as Record<string, string>;
      const tool = toolId as IntentToolId;
      markers.push({
        tool,
        prefill,
        label: `${INTENT_TOOL_LABELS[tool]} öffnen →`,
        href: buildIntentToolUrl(tool, prefill),
        raw,
      });
      cleanText = cleanText.replace(raw, "").trim();
    } catch {
      // ignore malformed JSON
    }
  }

  return { cleanText: cleanText.trim(), markers };
}

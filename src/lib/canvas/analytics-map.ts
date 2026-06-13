import type { CreditCategory } from "./analytics-types";
import { TOOL_API_SCHEMA } from "./toolApiSchema";

const VIDEO_TYPE_HINTS = [
  "video",
  "seedance",
  "live-creator",
  "lipsync",
  "motion",
  "remix",
  "ugc",
  "avatar",
  "akool",
];

const IMAGE_TYPE_HINTS = [
  "image",
  "flux",
  "thumbnail",
  "faceswap",
  "upscale",
  "character",
  "ki-ich",
  "ki-influencer",
  "lora",
];

export function categorizeGenerationType(type: string): CreditCategory {
  const tool = TOOL_API_SCHEMA[type];
  if (tool) {
    if (tool.outputType === "video" || tool.outputType === "audio") return "video";
    if (tool.outputType === "image") return "image";
    return "text";
  }

  const lower = type.toLowerCase();
  if (type.startsWith("canvas-share-")) return "video";
  if (VIDEO_TYPE_HINTS.some((h) => lower.includes(h))) return "video";
  if (IMAGE_TYPE_HINTS.some((h) => lower.includes(h))) return "image";
  return "text";
}

export function resolveToolMeta(type: string, resultToolId?: string) {
  const toolId = resultToolId ?? type;
  const tool = TOOL_API_SCHEMA[toolId] ?? TOOL_API_SCHEMA[type.replace(/^canvas-share-/, "")];
  if (tool) {
    return { toolId: tool.id, toolLabel: tool.label, toolIcon: tool.icon };
  }

  if (type.startsWith("canvas-share-")) {
    const platform = type.replace("canvas-share-", "");
    return {
      toolId,
      toolLabel: `Share · ${platform}`,
      toolIcon: "📤",
    };
  }

  return { toolId, toolLabel: type, toolIcon: "✨" };
}

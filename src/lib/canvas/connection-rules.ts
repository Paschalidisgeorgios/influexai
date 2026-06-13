import type { ToolOutputType } from "./toolApiSchema";

export function canConnect(
  sourceType: ToolOutputType,
  targetAccepts?: ToolOutputType[]
): boolean {
  if (!targetAccepts?.length) return false;
  if (targetAccepts.includes(sourceType)) return true;
  if (sourceType === "image" && targetAccepts.includes("video")) return true;
  if (sourceType === "text" && targetAccepts.includes("audio")) return true;
  return false;
}

export function applyConnectionToParams(
  paramKey: string,
  sourceOutput: { type: ToolOutputType; text?: string; url?: string; data?: unknown }
): unknown {
  if (sourceOutput.type === "text") return sourceOutput.text ?? "";
  if (sourceOutput.type === "image" || sourceOutput.type === "video" || sourceOutput.type === "audio") {
    return sourceOutput.url ?? sourceOutput.data;
  }
  if (sourceOutput.type === "calendar") return sourceOutput.data;
  return sourceOutput.text ?? sourceOutput.url;
}

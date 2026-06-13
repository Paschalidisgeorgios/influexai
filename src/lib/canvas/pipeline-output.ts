import {
  TOOL_OUTPUT_TYPE,
  outputLabelForTool,
  type NodeOutput,
} from "@/lib/dashboard-v3/usePipeline";

type GenerationResult = {
  text?: string;
  url?: string;
  previewUrl?: string;
  data?: unknown;
};

export function resolvePipelineOutput(
  panelId: string,
  toolId: string,
  toolLabel: string,
  result: GenerationResult
): NodeOutput | null {
  const type = TOOL_OUTPUT_TYPE[toolId];
  if (!type) return null;

  let value: string | undefined;

  if (type === "text" || type === "script") {
    value = result.text?.trim() || undefined;
  } else if (type === "image_url") {
    value = result.url ?? result.previewUrl;
  } else if (type === "video_url" || type === "audio_url") {
    value = result.url;
  } else if (type === "json" && result.data) {
    value = JSON.stringify(result.data);
  }

  if (!value) return null;

  return {
    panelId,
    toolId,
    type,
    label: outputLabelForTool(toolId, toolLabel),
    value,
    createdAt: Date.now(),
  };
}

export function buildEffectiveParams(
  params: Record<string, unknown>,
  toolParams: { key: string }[],
  getInheritedValue: (
    fieldKey: string,
    currentPanelIndex: number,
    allPanelIds: string[]
  ) => NodeOutput | null,
  panelIndex: number,
  allPanelIds: string[],
  disconnectedFields: ReadonlySet<string>
): Record<string, unknown> {
  const effective = { ...params };

  for (const field of toolParams) {
    if (disconnectedFields.has(field.key)) continue;

    const current = effective[field.key];
    const hasValue =
      typeof current === "string"
        ? current.trim().length > 0
        : current != null && current !== "" && current !== false;

    if (hasValue) continue;

    const inherited = getInheritedValue(field.key, panelIndex, allPanelIds);
    if (inherited) {
      effective[field.key] = inherited.value;
    }
  }

  return effective;
}

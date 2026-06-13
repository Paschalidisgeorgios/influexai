"use client";

import { useState, useCallback } from "react";

export interface NodeOutput {
  panelId: string;
  toolId: string;
  type: "text" | "script" | "image_url" | "video_url" | "audio_url" | "json";
  label: string;
  value: string;
  createdAt: number;
}

export const PIPELINE_COMPATIBILITY: Record<string, NodeOutput["type"][]> = {
  prompt: ["text", "script"],
  image_url: ["image_url"],
  images_list: ["image_url"],
  input_video: ["video_url"],
  input_audio: ["audio_url"],
  script: ["text", "script"],
  script_ref: ["text", "script"],
  audio_script: ["text", "script", "audio_url"],
  target_video: ["video_url"],
  "kampagnen-ziel": ["text", "script"],
  stylePrompt: ["text", "script"],
  videoUrl: ["video_url"],
};

export const TOOL_OUTPUT_TYPE: Record<string, NodeOutput["type"]> = {
  "viral-hook": "text",
  "content-kalender": "text",
  "trend-script": "script",
  "produkt-werbung": "script",
  "agent-autopilot": "script",
  "flux-image": "image_url",
  "ki-ich": "image_url",
  "seedance-video": "video_url",
  "video-transformer": "video_url",
  "video-uebersetzer": "video_url",
  "avatar-studio": "video_url",
  "lipsync-studio": "video_url",
  "melodia-studio": "audio_url",
  "lora-training": "json",
};

export function outputLabelForTool(toolId: string, toolLabel: string): string {
  const type = TOOL_OUTPUT_TYPE[toolId];
  const kind =
    type === "script"
      ? "Skript"
      : type === "image_url"
        ? "Bild"
        : type === "video_url"
          ? "Video"
          : type === "audio_url"
            ? "Audio"
            : "Text";
  return `${kind} von ${toolLabel}`;
}

export type PipelineApi = ReturnType<typeof usePipeline>;

export function usePipeline() {
  const [outputs, setOutputs] = useState<NodeOutput[]>([]);

  const registerOutput = useCallback((output: NodeOutput) => {
    setOutputs((prev) => {
      const filtered = prev.filter((o) => o.panelId !== output.panelId);
      return [...filtered, output];
    });
  }, []);

  const getInheritedValue = useCallback(
    (
      fieldKey: string,
      currentPanelIndex: number,
      allPanelIds: string[]
    ): NodeOutput | null => {
      const compatibleTypes = PIPELINE_COMPATIBILITY[fieldKey];
      if (!compatibleTypes) return null;

      const leftPanelIds = allPanelIds.slice(0, currentPanelIndex);

      const compatible = outputs
        .filter(
          (o) =>
            leftPanelIds.includes(o.panelId) && compatibleTypes.includes(o.type)
        )
        .sort((a, b) => b.createdAt - a.createdAt);

      return compatible[0] ?? null;
    },
    [outputs]
  );

  const clearOutputs = useCallback(() => setOutputs([]), []);

  const getAllOutputs = useCallback(() => outputs, [outputs]);

  const removeOutputsForPanels = useCallback((panelIds: string[]) => {
    const removeSet = new Set(panelIds);
    setOutputs((prev) => prev.filter((o) => !removeSet.has(o.panelId)));
  }, []);

  return {
    outputs,
    registerOutput,
    getInheritedValue,
    clearOutputs,
    getAllOutputs,
    removeOutputsForPanels,
  };
}

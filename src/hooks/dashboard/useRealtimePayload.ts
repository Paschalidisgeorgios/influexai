"use client";

import { useMemo } from "react";
import type { AIModel } from "@/lib/dashboard-v2/model-registry";
import type { DashboardToolDef } from "@/lib/dashboard-v2/tool-registry";

export type ToolParams = Record<string, string | number | boolean | null>;

export function useRealtimePayload(
  tool: DashboardToolDef | null,
  model: AIModel | null,
  prompt: string,
  params: ToolParams,
  uploads: Record<string, string>
) {
  return useMemo(() => {
    if (!tool) {
      return { tool: null, status: "idle" };
    }

    const base: Record<string, unknown> = {
      tool: tool.id,
      provider: tool.provider,
      capability: tool.capabilityType,
      prompt: prompt.trim() || null,
      locale: "de-DE",
      credits_estimate: model?.creditCost ?? tool.creditBase,
    };

    if (model) {
      base.model = {
        id: model.id,
        name: model.name,
        provider: model.provider,
        theme: model.themeKey,
      };
      base.duration = params.duration ?? model.durations[0] ?? null;
      base.resolution = params.resolution ?? model.resolutions[0] ?? null;
    }

    const cinematicKeys = [
      "cameraMovement",
      "shotType",
      "expression",
      "atmosphere",
      "light",
      "effectEnhance",
      "aspectRatio",
      "style",
    ] as const;

    const cinematic: Record<string, unknown> = {};
    for (const key of cinematicKeys) {
      if (params[key] != null && params[key] !== "Keiner" && params[key] !== "None") {
        cinematic[key] = params[key];
      }
    }
    if (Object.keys(cinematic).length > 0) base.cinematic = cinematic;

    const uploadEntries = Object.entries(uploads).filter(([, v]) => v.trim());
    if (uploadEntries.length > 0) {
      base.uploads = Object.fromEntries(uploadEntries);
    }

    if (model?.supportsStart && uploads.startFrame) {
      base.start_frame = uploads.startFrame;
    }
    if (model?.supportsEnd && uploads.endFrame) {
      base.end_frame = uploads.endFrame;
    }
    if (model?.supportsAudio && params.generateAudio != null) {
      base.generate_audio = params.generateAudio;
    }

    return base;
  }, [tool, model, prompt, params, uploads]);
}

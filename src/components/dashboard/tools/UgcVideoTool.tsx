"use client";

/**
 * UgcVideoTool — Video-Generator via Akool (Seedance, Kling, Minimax).
 *
 * API:  POST /api/seedance
 * Poll: GET  /api/seedance/status?generationId=...
 */

import { useMemo } from "react";
import {
  useSeedanceModels,
  pickDefaultSeedanceModel,
  pickDefaultSeedanceResolution,
  type SeedanceModelOption,
} from "@/hooks/canvas/useSeedanceModels";
import { groupSeedanceModelOptionsByProvider } from "@/lib/seedance-model-groups";
import {
  FieldLabel,
  TextareaField,
  GroupedModelSelect,
  SelectField,
  SliderField,
  DropzoneField,
} from "./shared";
import type { ToolModule, ToolFormProps } from "./types";

// ---------------------------------------------------------------------------
// Aspect Ratio
// ---------------------------------------------------------------------------

const ASPECT_RATIO_OPTIONS = [
  { value: "9:16", label: "9:16 — Hochformat (TikTok, Reels)" },
  { value: "16:9", label: "16:9 — Querformat (YouTube)" },
  { value: "1:1", label: "1:1 — Quadratisch" },
];

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

function UgcVideoFormComponent({ values, onChange }: ToolFormProps) {
  const { models, loading } = useSeedanceModels();

  // Nur Video-Modelle (keine reinen Bild-Modelle)
  const videoModels = useMemo(
    () => models.filter((m) => m.durationList.length > 0),
    [models]
  );

  const selectedModel = useMemo<SeedanceModelOption | undefined>(() => {
    const modelId = values.modelId as string | undefined;
    return modelId
      ? (videoModels.find((m) => m.value === modelId) ?? pickDefaultSeedanceModel(videoModels))
      : pickDefaultSeedanceModel(videoModels);
  }, [values.modelId, videoModels]);

  const modelGroups = useMemo(
    () => groupSeedanceModelOptionsByProvider(videoModels),
    [videoModels]
  );

  const durationOptions = useMemo(
    () =>
      (selectedModel?.durationList ?? [2, 5, 8]).map((d) => ({
        value: String(d),
        label: `${d}s`,
      })),
    [selectedModel]
  );

  const resolutionOptions = useMemo(
    () =>
      selectedModel?.resolutionList ?? [
        { value: "720p", label: "720p" },
        { value: "1080p", label: "1080p" },
      ],
    [selectedModel]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Modell */}
      <div>
        <FieldLabel>Modell</FieldLabel>
        {loading ? (
          <div className="h-10 animate-pulse rounded-xl bg-zinc-800/60" />
        ) : (
          <GroupedModelSelect
            value={(values.modelId as string | undefined) ?? (selectedModel?.value ?? "")}
            onChange={(v) => {
              onChange("modelId", v);
              const model = videoModels.find((m) => m.value === v);
              const defaultRes = pickDefaultSeedanceResolution(model);
              if (defaultRes) onChange("resolution", defaultRes);
              const defaultDur = model?.durationList[0] ?? 5;
              onChange("duration", defaultDur);
            }}
            groups={modelGroups.map((g) => ({
              groupLabel: g.providerLabel,
              options: g.options.map((o) => ({ value: o.value, label: o.label })),
            }))}
          />
        )}
      </div>

      {/* Referenzbild */}
      <div>
        <FieldLabel>Referenzbild / Rohmaterial</FieldLabel>
        <DropzoneField
          value={(values.imageUrl as string | undefined) ?? ""}
          onChange={(url) => onChange("imageUrl", url)}
          label="Bild hierher ziehen oder klicken"
        />
      </div>

      {/* Video Prompt */}
      <div>
        <FieldLabel>Video Prompt</FieldLabel>
        <TextareaField
          value={(values.prompt as string | undefined) ?? ""}
          onChange={(v) => onChange("prompt", v)}
          placeholder="Beschreibe die Bewegung und den Stil des Videos…"
          rows={3}
        />
      </div>

      {/* Seitenverhältnis */}
      <div>
        <FieldLabel>Seitenverhältnis</FieldLabel>
        <SelectField
          value={(values.aspectRatio as string | undefined) ?? "9:16"}
          onChange={(v) => onChange("aspectRatio", v)}
          options={ASPECT_RATIO_OPTIONS}
        />
      </div>

      {/* Dauer */}
      <div>
        <FieldLabel>{`Videodauer — ${String(values.duration ?? selectedModel?.durationList[0] ?? 5)}s`}</FieldLabel>
        <SelectField
          value={String(values.duration ?? selectedModel?.durationList[0] ?? 5)}
          onChange={(v) => onChange("duration", Number(v))}
          options={durationOptions}
        />
      </div>

      {/* Auflösung */}
      <div>
        <FieldLabel>Auflösung</FieldLabel>
        <SelectField
          value={
            (values.resolution as string | undefined) ??
            (pickDefaultSeedanceResolution(selectedModel) ?? "720p")
          }
          onChange={(v) => onChange("resolution", v)}
          options={resolutionOptions}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modul
// ---------------------------------------------------------------------------

function validate(values: Record<string, unknown>): string | null {
  if (!values.prompt || String(values.prompt).trim().length < 3) {
    return "Bitte beschreibe das Video (min. 3 Zeichen)";
  }
  return null;
}

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  return {
    prompt: String(values.prompt ?? "").trim(),
    modelId: String(values.modelId ?? "seedance-2.0"),
    aspectRatio: String(values.aspectRatio ?? "9:16"),
    duration: Number(values.duration ?? 5),
    resolution: String(values.resolution ?? "720p"),
    ...(values.imageUrl ? { imageUrl: String(values.imageUrl) } : {}),
  };
}

export const UgcVideoToolModule: ToolModule = {
  toolId: "ugc-video",
  FormComponent: UgcVideoFormComponent,
  validate,
  buildPayload,
  apiRoute: "/api/seedance",
  polling: {
    statusEndpoint: "/api/seedance/status",
    processingLabel: "Produktvideo wird gerendert… (1–3 Min.)",
  },
};

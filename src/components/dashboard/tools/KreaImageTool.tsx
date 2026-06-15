"use client";

/**
 * KreaImageTool — Bild-Generator via Krea AI / Fal AI.
 * Blueprint für alle Tool-Module.
 *
 * API: POST /api/generate-image
 * Backend: Fal AI (Krea 2 / Flux 2 Pro)
 */

import {
  KREA_MODEL_OPTIONS,
  DEFAULT_IMAGE_MODEL_ID,
} from "@/lib/generation-config";
import { FieldLabel, TextareaField, SelectField } from "./shared";
import type { ToolModule, ToolFormProps } from "./types";

// ---------------------------------------------------------------------------
// Konstanten
// ---------------------------------------------------------------------------

const ASPECT_RATIO_OPTIONS = [
  { value: "portrait_16_9", label: "9:16 — Hochformat (TikTok, Reels)" },
  { value: "square_hd", label: "1:1 — Quadratisch (Feed)" },
  { value: "landscape_16_9", label: "16:9 — Querformat (YouTube)" },
  { value: "portrait_4_3", label: "3:4 — Kompakt Hochformat" },
  { value: "landscape_4_3", label: "4:3 — Kompakt Querformat" },
];

const NUM_IMAGES_OPTIONS = [
  { value: "1", label: "1 Bild" },
  { value: "2", label: "2 Bilder" },
  { value: "4", label: "4 Bilder" },
];

const MODEL_OPTIONS = KREA_MODEL_OPTIONS.map((m) => ({
  value: m.value,
  label: m.label,
}));

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

function KreaImageFormComponent({ values, onChange }: ToolFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel>Modell</FieldLabel>
        <SelectField
          value={(values.modelId as string | undefined) ?? DEFAULT_IMAGE_MODEL_ID}
          onChange={(v) => onChange("modelId", v)}
          options={MODEL_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel>Prompt</FieldLabel>
        <TextareaField
          value={(values.prompt as string | undefined) ?? ""}
          onChange={(v) => onChange("prompt", v)}
          placeholder="Beschreibe das Bild, das du generieren möchtest…"
          rows={4}
        />
      </div>

      <div>
        <FieldLabel>Seitenverhältnis</FieldLabel>
        <SelectField
          value={(values.imageSize as string | undefined) ?? "portrait_16_9"}
          onChange={(v) => onChange("imageSize", v)}
          options={ASPECT_RATIO_OPTIONS}
        />
      </div>

      <div>
        <FieldLabel>Anzahl Bilder</FieldLabel>
        <SelectField
          value={String((values.numImages as number | undefined) ?? 1)}
          onChange={(v) => onChange("numImages", Number(v))}
          options={NUM_IMAGES_OPTIONS}
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
    return "Bitte beschreibe das Bild (min. 3 Zeichen)";
  }
  return null;
}

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  return {
    prompt: String(values.prompt ?? "").trim(),
    modelId: String(values.modelId ?? DEFAULT_IMAGE_MODEL_ID),
    imageSize: String(values.imageSize ?? "portrait_16_9"),
    numImages: Number(values.numImages ?? 1),
  };
}

export const KreaImageToolModule: ToolModule = {
  toolId: "flux-image",
  FormComponent: KreaImageFormComponent,
  validate,
  buildPayload,
  apiRoute: "/api/generate-image",
};

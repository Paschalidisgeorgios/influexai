"use client";

import { useState } from "react";
import {
  workflowLabelFor,
  type PreviewFormat,
  type PreviewIntent,
} from "./preview-intent";
import { PREVIEW_MVP_ROUTES } from "./preview-routes";
import {
  isLoraTrainingEngine,
  isUltraPhotoEngine,
  resolveEngineForIntent,
  type StudioEngineDefinition,
} from "./studio-engine-registry";
import { UltraPhotoWorkflowPanel } from "./UltraPhotoWorkflowPanel";
import { LoraTrainingWorkflowPanel } from "./LoraTrainingWorkflowPanel";
import { ImageUpscaleWorkflowPanel } from "./ImageUpscaleWorkflowPanel";
import { VideoUpscaleWorkflowPanel } from "./VideoUpscaleWorkflowPanel";

const ACCENT = "#b4ff00";
const META = "rgba(244,240,232,0.45)";
const BORDER = "rgba(255,255,255,0.08)";

export type WorkflowPhase = "idle" | "optimizing" | "generating" | "complete";

type DynamicWorkflowResultProps = {
  intent: PreviewIntent;
  originalPrompt: string;
  optimizedPrompt: string;
  onOptimizedChange: (value: string) => void;
  phase: WorkflowPhase;
  format: PreviewFormat | null;
  lang: "de" | "en";
  hasImageContext: boolean;
  hasVideoContext?: boolean;
  forceVideoPanel?: boolean;
  forceUpscalePanel?: "image" | "video" | false;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="preview-type-meta mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function ProgressBar({
  phase,
  lang,
  ultra,
  lora,
  upscale,
}: {
  phase: WorkflowPhase;
  lang: "de" | "en";
  ultra: boolean;
  lora: boolean;
  upscale: boolean;
}) {
  if (phase === "idle") return null;

  const de = lang === "de";
  const label =
    phase === "optimizing"
      ? lora || upscale
        ? de
          ? "Workflow wird vorbereitet…"
          : "Preparing workflow…"
        : de
          ? "Prompt optimiert"
          : "Prompt optimized"
      : phase === "generating"
        ? ultra
          ? de
            ? "Engine wird vorbereitet…"
            : "Preparing engine…"
          : de
            ? "Generiert…"
            : "Generating…"
        : lora
          ? de
            ? "Vorbereitung bereit"
            : "Preparation ready"
          : upscale
            ? de
              ? "Upscale-Pipeline vorbereitet"
              : "Upscale pipeline prepared"
            : ultra
              ? de
                ? "Ultra Engine vorbereitet"
                : "Ultra engine prepared"
              : de
                ? "Bereit"
                : "Ready";

  const width = phase === "optimizing" ? "35%" : phase === "generating" ? "72%" : "100%";
  const showBar = phase === "generating" && !lora && !upscale;

  return (
    <div className="space-y-2">
      <p className="preview-type-body flex items-center gap-2 text-[0.8125rem]">
        {phase === "complete" || phase === "optimizing" ? (
          <span style={{ color: ACCENT }}>✓</span>
        ) : null}
        {label}
      </p>
      {showBar ? (
        <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width, background: ACCENT }}
          />
        </div>
      ) : null}
    </div>
  );
}

function StandardAdvancedSettings({
  engine,
  format,
  lang,
}: {
  engine: StudioEngineDefinition;
  format: PreviewFormat | null;
  lang: "de" | "en";
}) {
  const de = lang === "de";
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="preview-type-meta"
        style={{ color: META }}
      >
        {open ? "−" : "+"} {de ? "Erweiterte Einstellungen" : "Advanced settings"}
      </button>
      {open ? (
        <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: BORDER }}>
          <Field label={de ? "Modell" : "Model"}>
            <input
              readOnly
              className="preview-type-body w-full rounded border bg-transparent px-2 py-1.5 text-[0.75rem]"
              style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
              value={engine.advancedLabel ?? engine.label}
            />
          </Field>
          <Field label="Provider">
            <input
              readOnly
              className="preview-type-body w-full rounded border bg-transparent px-2 py-1.5 text-[0.75rem]"
              style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
              value={engine.provider ?? "Internal routing"}
            />
          </Field>
          <Field label={de ? "Seitenverhältnis" : "Aspect ratio"}>
            <input
              readOnly
              className="preview-type-body w-full rounded border bg-transparent px-2 py-1.5 text-[0.75rem]"
              style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
              value={format ?? "—"}
            />
          </Field>
        </div>
      ) : null}
    </>
  );
}

export function DynamicWorkflowResult({
  intent,
  originalPrompt,
  optimizedPrompt,
  onOptimizedChange,
  phase,
  format,
  lang,
  hasImageContext,
  hasVideoContext = false,
  forceVideoPanel,
  forceUpscalePanel = false,
}: DynamicWorkflowResultProps) {
  const de = lang === "de";
  const effectiveIntent = forceVideoPanel
    ? "image_to_video"
    : forceUpscalePanel === "image"
      ? "image_upscale"
      : forceUpscalePanel === "video"
        ? "video_upscale"
        : intent;
  const showPanel = phase !== "idle" && effectiveIntent !== "unknown";

  const engine = resolveEngineForIntent(effectiveIntent, originalPrompt);
  const ultra = isUltraPhotoEngine(engine);
  const lora = isLoraTrainingEngine(engine);

  if (!showPanel) return null;

  const copy = {
    original: de ? "Original" : "Original",
    optimized: de ? "Optimiert" : "Optimized",
    optimizeHint: de
      ? "Prompts werden für die Produktions-Engine optimiert."
      : "Prompts are optimized for the production engine.",
  };

  const isLoraWorkflow =
    effectiveIntent === "lora_training" || effectiveIntent === "ai_creator";
  const isImageUpscaleWorkflow = effectiveIntent === "image_upscale";
  const isVideoUpscaleWorkflow = effectiveIntent === "video_upscale";

  const isUltraWorkflow =
    effectiveIntent === "ai_influencer" ||
    effectiveIntent === "product_visual" ||
    (effectiveIntent === "image_generation" && ultra);

  const mvpHref =
    effectiveIntent === "ai_influencer"
      ? PREVIEW_MVP_ROUTES.kiInfluencer
      : engine.mvpRoute;

  return (
    <div
      className="preview-workflow-panel min-w-0 space-y-4 p-4 md:p-5"
      data-preview-workflow
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="preview-type-meta">
          {workflowLabelFor(effectiveIntent, lang)}
        </span>
        <span className="preview-type-meta" style={{ color: "rgba(180,255,0,0.85)" }}>
          {engine.label}
        </span>
      </div>

      <ProgressBar
        phase={phase}
        lang={lang}
        ultra={ultra && isUltraWorkflow}
        lora={isLoraWorkflow}
        upscale={isImageUpscaleWorkflow || isVideoUpscaleWorkflow}
      />

      {isLoraWorkflow ? (
        <LoraTrainingWorkflowPanel
          originalPrompt={originalPrompt}
          lang={lang}
          engine={engine}
          phase={phase}
        />
      ) : null}

      {isUltraWorkflow ? (
        <UltraPhotoWorkflowPanel
          intent={
            effectiveIntent === "ai_influencer" ||
            effectiveIntent === "product_visual" ||
            effectiveIntent === "image_generation"
              ? effectiveIntent
              : "image_generation"
          }
          originalPrompt={originalPrompt}
          optimizedPrompt={optimizedPrompt}
          onOptimizedChange={onOptimizedChange}
          format={format}
          lang={lang}
          engine={engine}
          phase={phase}
          mvpHref={mvpHref}
        />
      ) : null}

      {isImageUpscaleWorkflow ? (
        <ImageUpscaleWorkflowPanel
          lang={lang}
          engine={engine}
          phase={phase}
          hasSourceAsset={hasImageContext}
        />
      ) : null}

      {isVideoUpscaleWorkflow ? (
        <VideoUpscaleWorkflowPanel
          lang={lang}
          engine={engine}
          phase={phase}
          hasSourceAsset={hasVideoContext}
        />
      ) : null}

      {!isUltraWorkflow &&
        !isLoraWorkflow &&
        !isImageUpscaleWorkflow &&
        !isVideoUpscaleWorkflow &&
        (effectiveIntent === "image_generation" || effectiveIntent === "hook_generation") && (
          <div className="grid gap-3">
            <Field label={copy.original}>
              <p
                className="preview-type-body rounded border px-3 py-2 text-[0.8125rem]"
                style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
              >
                {originalPrompt}
              </p>
            </Field>
            {phase !== "optimizing" && (
              <Field label={copy.optimized}>
                <textarea
                  value={optimizedPrompt}
                  onChange={(e) => onOptimizedChange(e.target.value)}
                  rows={3}
                  className="preview-type-body w-full resize-none rounded border bg-transparent px-3 py-2 text-[0.8125rem] outline-none"
                  style={{ borderColor: BORDER, color: "var(--studio-text-primary)" }}
                />
                <p className="preview-type-body preview-type-body--muted mt-1.5 text-[0.6875rem]">
                  {copy.optimizeHint}
                </p>
              </Field>
            )}
          </div>
        )}

      {effectiveIntent === "image_to_video" && (
        <div className="grid gap-4">
          <p className="preview-type-workflow-title">{de ? "Bild → Video" : "Image → Video"}</p>
          {hasImageContext ? (
            <p className="text-[13px]" style={{ color: ACCENT }}>
              ✓ {de ? "Bild bereits eingefügt" : "Image already attached"}
            </p>
          ) : null}
          <Field label={de ? "Bewegungsrichtung" : "Motion direction"}>
            <div className="flex flex-wrap gap-2">
              {(de ? ["Links", "Rechts", "Zoom", "Drehen"] : ["Left", "Right", "Zoom", "Rotate"]).map(
                (opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="preview-type-chip rounded border px-3 py-1.5"
                    style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
                  >
                    {opt}
                  </button>
                )
              )}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label={de ? "Dauer" : "Duration"}>
              <select
                className="preview-type-body w-full rounded border bg-transparent px-2 py-2 text-[0.8125rem] outline-none"
                style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
                defaultValue="5s"
              >
                <option>3s</option>
                <option>5s</option>
                <option>10s</option>
              </select>
            </Field>
            <Field label={de ? "Stil" : "Style"}>
              <select
                className="preview-type-body w-full rounded border bg-transparent px-2 py-2 text-[0.8125rem] outline-none"
                style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
                defaultValue="Cinematic"
              >
                <option>Cinematic</option>
                <option>Dynamic</option>
                <option>Slow</option>
              </select>
            </Field>
            <Field label="Format">
              <select
                className="preview-type-body w-full rounded border bg-transparent px-2 py-2 text-[0.8125rem] outline-none"
                style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
              >
                <option>{format ?? "9:16"}</option>
                <option>4:5</option>
                <option>16:9</option>
              </select>
            </Field>
          </div>
          <a
            href={PREVIEW_MVP_ROUTES.imgToVideo}
            className="preview-type-btn inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-[0.75rem] uppercase tracking-[0.08em]"
            style={{ background: ACCENT, color: "#080808" }}
          >
            {de ? "Im Video-Workflow öffnen →" : "Open in video workflow →"}
          </a>
        </div>
      )}

      {effectiveIntent === "campaign_planning" && phase === "complete" && (
        <div className="space-y-3">
          <p className="preview-type-workflow-title">
            {de ? "Kampagnenplan bereit" : "Campaign plan ready"}
          </p>
          <ul className="preview-type-body space-y-1 text-[0.875rem]">
            <li>· 3 Visuals</li>
            <li>· 2 Motion Assets</li>
            <li>· 5 Hooks</li>
            <li>· 7 Content-Ideen</li>
          </ul>
          <p className="preview-type-meta"> {de ? "Geschätzte Credits: 48" : "Estimated credits: 48"}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className="preview-type-btn rounded-md px-4 py-2.5 text-[0.6875rem] uppercase tracking-[0.08em]"
              style={{ background: ACCENT, color: "#080808" }}
            >
              {de ? "Plan ausführen" : "Execute plan"}
            </button>
            <button
              type="button"
              className="preview-type-chip rounded border px-4 py-2.5 uppercase tracking-[0.06em]"
              style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
            >
              {de ? "Anpassen" : "Adjust"}
            </button>
          </div>
        </div>
      )}

      {effectiveIntent === "image_generation" &&
        !ultra &&
        phase === "complete" && (
          <a
            href={PREVIEW_MVP_ROUTES.imageGen}
            className="preview-type-btn inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-[0.75rem] uppercase tracking-[0.08em]"
            style={{ background: ACCENT, color: "#080808" }}
          >
            {engine.executionHint[lang]}
          </a>
        )}

      {!isUltraWorkflow &&
        !isLoraWorkflow &&
        !isImageUpscaleWorkflow &&
        !isVideoUpscaleWorkflow &&
        effectiveIntent !== "image_to_video" &&
        effectiveIntent !== "campaign_planning" && (
          <StandardAdvancedSettings engine={engine} format={format} lang={lang} />
        )}
    </div>
  );
}

export function resolveAssetKind(
  intent: PreviewIntent,
  phase: WorkflowPhase,
  forceVideoPanel?: boolean,
  input = "",
  forceUpscalePanel?: "image" | "video" | false
): "image" | "video" | "hooks" | "campaign" | "ultra_prepared" | "lora_prepared" | "upscale_prepared" | "none" {
  if (phase !== "complete") return "none";
  if (forceUpscalePanel === "image" || intent === "image_upscale") return "upscale_prepared";
  if (forceUpscalePanel === "video" || intent === "video_upscale") return "upscale_prepared";
  if (forceVideoPanel || intent === "image_to_video") return "video";
  if (intent === "lora_training" || intent === "ai_creator") return "lora_prepared";
  if (intent === "ai_influencer" || intent === "product_visual") return "ultra_prepared";
  if (intent === "image_generation" && isUltraPhotoEngine(resolveEngineForIntent(intent, input))) {
    return "ultra_prepared";
  }
  if (intent === "image_generation") return "image";
  if (intent === "hook_generation") return "hooks";
  if (intent === "campaign_planning") return "campaign";
  return "none";
}

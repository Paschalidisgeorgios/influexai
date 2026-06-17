"use client";

import { useState } from "react";
import {
  buildOptimizedPrompt,
  engineLabelForIntent,
  type PreviewFormat,
  type PreviewIntent,
} from "./preview-intent";
import { PREVIEW_MVP_ROUTES } from "./preview-routes";

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
  forceVideoPanel?: boolean;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: META }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function ProgressBar({ phase, lang }: { phase: WorkflowPhase; lang: "de" | "en" }) {
  if (phase === "idle") return null;

  const label =
    phase === "optimizing"
      ? lang === "de"
        ? "Prompt optimiert"
        : "Prompt optimized"
      : lang === "de"
        ? "Generiert…"
        : "Generating…";

  const width = phase === "optimizing" ? "35%" : phase === "generating" ? "72%" : "100%";

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-[13px] text-neutral-200">
        {phase !== "generating" && phase === "optimizing" ? (
          <span style={{ color: ACCENT }}>✓</span>
        ) : null}
        {phase === "generating" ? null : phase === "complete" ? (
          <span style={{ color: ACCENT }}>✓</span>
        ) : null}
        {label}
      </p>
      {phase === "generating" ? (
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

export function DynamicWorkflowResult({
  intent,
  originalPrompt,
  optimizedPrompt,
  onOptimizedChange,
  phase,
  format,
  lang,
  hasImageContext,
  forceVideoPanel,
}: DynamicWorkflowResultProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const de = lang === "de";

  const effectiveIntent = forceVideoPanel ? "image_to_video" : intent;
  const showPanel = phase !== "idle" && effectiveIntent !== "unknown";

  if (!showPanel) return null;

  const copy = {
    original: de ? "Original" : "Original",
    optimized: de ? "Optimiert" : "Optimized",
    optimizeHint: de
      ? "Prompts werden für die Produktions-Engine optimiert."
      : "Prompts are optimized for the production engine.",
    advanced: de ? "Erweiterte Einstellungen" : "Advanced settings",
  };

  return (
    <div
      className="min-w-0 space-y-4 rounded-lg border p-4 md:p-5"
      style={{ borderColor: BORDER, background: "rgba(255,255,255,0.03)" }}
      data-preview-workflow
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: META }}>
          Workflow
        </span>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.08em]"
          style={{ color: "rgba(180,255,0,0.85)" }}
        >
          {engineLabelForIntent(effectiveIntent)}
        </span>
      </div>

      <ProgressBar phase={phase} lang={lang} />

      {(effectiveIntent === "image_generation" || effectiveIntent === "hook_generation") && (
        <div className="grid gap-3">
          <Field label={copy.original}>
            <p
              className="rounded border px-3 py-2 text-[13px] leading-relaxed text-neutral-400"
              style={{ borderColor: BORDER }}
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
                className="w-full resize-none rounded border bg-transparent px-3 py-2 text-[13px] leading-relaxed text-neutral-100 outline-none"
                style={{ borderColor: BORDER }}
              />
              <p className="mt-1.5 text-[11px]" style={{ color: META }}>
                {copy.optimizeHint}
              </p>
            </Field>
          )}
        </div>
      )}

      {effectiveIntent === "image_to_video" && (
        <div className="grid gap-4">
          <p className="text-[14px] font-semibold text-white">{de ? "Bild → Video" : "Image → Video"}</p>
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
                    className="rounded border px-3 py-1.5 text-[12px] text-neutral-200"
                    style={{ borderColor: BORDER }}
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
                className="w-full rounded border bg-transparent px-2 py-2 text-[13px] text-neutral-200"
                style={{ borderColor: BORDER }}
                defaultValue="5s"
              >
                <option>3s</option>
                <option>5s</option>
                <option>10s</option>
              </select>
            </Field>
            <Field label={de ? "Stil" : "Style"}>
              <select
                className="w-full rounded border bg-transparent px-2 py-2 text-[13px] text-neutral-200"
                style={{ borderColor: BORDER }}
                defaultValue="Cinematic"
              >
                <option>Cinematic</option>
                <option>Dynamic</option>
                <option>Slow</option>
              </select>
            </Field>
            <Field label="Format">
              <select
                className="w-full rounded border bg-transparent px-2 py-2 text-[13px] text-neutral-200"
                style={{ borderColor: BORDER }}
              >
                <option>{format ?? "9:16"}</option>
                <option>4:5</option>
                <option>16:9</option>
              </select>
            </Field>
          </div>
          <a
            href={PREVIEW_MVP_ROUTES.imgToVideo}
            className="inline-flex w-full items-center justify-center rounded-md px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.1em]"
            style={{ background: ACCENT, color: "#080808" }}
          >
            {de ? "Video generieren →" : "Generate video →"}
          </a>
        </div>
      )}

      {effectiveIntent === "campaign_planning" && phase === "complete" && (
        <div className="space-y-3">
          <p className="text-[15px] font-semibold text-white">
            {de ? "Kampagnenplan bereit" : "Campaign plan ready"}
          </p>
          <ul className="space-y-1 text-[14px] text-neutral-300">
            <li>· 3 Visuals</li>
            <li>· 2 Motion Assets</li>
            <li>· 5 Hooks</li>
            <li>· 7 Content-Ideen</li>
          </ul>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
            {de ? "Geschätzte Credits: 48" : "Estimated credits: 48"}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className="rounded-md px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ background: ACCENT, color: "#080808" }}
            >
              {de ? "Plan ausführen" : "Execute plan"}
            </button>
            <button
              type="button"
              className="rounded border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-300"
              style={{ borderColor: BORDER }}
            >
              {de ? "Anpassen" : "Adjust"}
            </button>
          </div>
        </div>
      )}

      {effectiveIntent === "image_generation" && phase === "complete" && (
        <a
          href={PREVIEW_MVP_ROUTES.imageGen}
          className="inline-flex w-full items-center justify-center rounded-md px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.1em]"
          style={{ background: ACCENT, color: "#080808" }}
        >
          {de ? "Bild erstellen" : "Create image"}
        </a>
      )}

      {effectiveIntent !== "image_to_video" && effectiveIntent !== "campaign_planning" && (
        <>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.12em]"
            style={{ color: META }}
          >
            {advancedOpen ? "−" : "+"} {copy.advanced}
          </button>
          {advancedOpen ? (
            <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: BORDER }}>
              <Field label={de ? "Modell" : "Model"}>
                <input
                  readOnly
                  className="w-full rounded border bg-transparent px-2 py-1.5 text-[12px] text-neutral-400"
                  style={{ borderColor: BORDER }}
                  defaultValue="InfluexAI Standard"
                />
              </Field>
              <Field label="Provider">
                <input
                  readOnly
                  className="w-full rounded border bg-transparent px-2 py-1.5 text-[12px] text-neutral-400"
                  style={{ borderColor: BORDER }}
                  defaultValue="Internal routing"
                />
              </Field>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function resolveAssetKind(
  intent: PreviewIntent,
  phase: WorkflowPhase,
  forceVideoPanel?: boolean
): "image" | "video" | "hooks" | "campaign" | "none" {
  if (phase !== "complete") return "none";
  if (forceVideoPanel || intent === "image_to_video") return "video";
  if (intent === "image_generation") return "image";
  if (intent === "hook_generation") return "hooks";
  if (intent === "campaign_planning") return "campaign";
  return "none";
}
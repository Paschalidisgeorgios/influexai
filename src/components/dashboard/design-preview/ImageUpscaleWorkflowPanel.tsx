"use client";

import { useState } from "react";
import Link from "next/link";
import type { WorkflowPhase } from "./DynamicWorkflowResult";
import type { StudioEngineDefinition } from "./studio-engine-registry";
import { PREVIEW_MVP_ROUTES } from "./preview-routes";

const ACCENT = "#b4ff00";
const BORDER = "rgba(255,255,255,0.08)";

const PRESETS = [
  { id: "standard", de: "Standard", en: "Standard" },
  { id: "portrait", de: "Portrait", en: "Portrait" },
  { id: "product", de: "Product", en: "Product" },
  { id: "creative", de: "Creative", en: "Creative" },
] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="preview-type-meta mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

type ImageUpscaleWorkflowPanelProps = {
  lang: "de" | "en";
  engine: StudioEngineDefinition;
  phase: WorkflowPhase;
  hasSourceAsset: boolean;
};

export function ImageUpscaleWorkflowPanel({
  lang,
  engine,
  phase,
  hasSourceAsset,
}: ImageUpscaleWorkflowPanelProps) {
  const de = lang === "de";
  const [preset, setPreset] = useState<string>(PRESETS[0].id);
  const [factor, setFactor] = useState<"2" | "4">("2");
  const [format, setFormat] = useState<"jpeg" | "png">("jpeg");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [subjectDetection, setSubjectDetection] = useState(true);
  const [faceEnhancement, setFaceEnhancement] = useState(true);
  const [faceStrength, setFaceStrength] = useState(50);
  const [sharpen, setSharpen] = useState(40);
  const [denoise, setDenoise] = useState(30);
  const [fixCompression, setFixCompression] = useState(true);

  const copy = {
    title: de ? "Bild verbessern" : "Improve image",
    source: de ? "Quelle" : "Source",
    sourceAttached: de ? "Aktuelles Ergebnis übernommen" : "Current result attached",
    sourceMissing: de ? "Bild hochladen oder aus Galerie wählen" : "Upload image or pick from gallery",
    upload: de ? "Hochladen" : "Upload",
    gallery: de ? "Galerie" : "Gallery",
    preset: de ? "Preset" : "Preset",
    factor: de ? "Upscale-Faktor" : "Upscale factor",
    format: de ? "Ausgabeformat" : "Output format",
    advanced: de ? "Erweiterte Einstellungen" : "Advanced settings",
    model: de ? "Topaz-Modell" : "Topaz model",
    subjectDetection: de ? "Motiverkennung" : "Subject detection",
    faceEnhancement: de ? "Gesicht verbessern" : "Face enhancement",
    faceStrength: de ? "Gesichtsstärke" : "Face strength",
    sharpen: de ? "Schärfen" : "Sharpen",
    denoise: de ? "Rauschen reduzieren" : "Denoise",
    fixCompression: de ? "Kompression korrigieren" : "Fix compression",
    cta: de ? "Bild verbessern" : "Improve image",
    hint: de
      ? "Ideal nach Bildgenerierung oder für Galerie-Assets vor Export."
      : "Best after image generation or for gallery assets before export.",
  };

  return (
    <div className="space-y-4">
      <p className="preview-type-workflow-title">{copy.title}</p>
      <p className="preview-type-body preview-type-body--muted text-[0.8125rem]">{copy.hint}</p>

      <Field label={copy.source}>
        {hasSourceAsset ? (
          <p className="text-[13px]" style={{ color: ACCENT }}>
            ✓ {copy.sourceAttached}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="preview-type-chip rounded border px-3 py-1.5"
              style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
            >
              {copy.upload}
            </button>
            <Link
              href={PREVIEW_MVP_ROUTES.gallery}
              className="preview-type-chip rounded border px-3 py-1.5"
              style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
            >
              {copy.gallery}
            </Link>
          </div>
        )}
        {!hasSourceAsset ? (
          <p className="preview-type-body preview-type-body--muted mt-1.5 text-[0.6875rem]">
            {copy.sourceMissing}
          </p>
        ) : null}
      </Field>

      <Field label={copy.preset}>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className="preview-type-chip rounded border px-3 py-1.5"
              style={{
                borderColor: preset === p.id ? "rgba(180,255,0,0.35)" : BORDER,
                color: preset === p.id ? ACCENT : "var(--studio-text-secondary)",
                background: preset === p.id ? "rgba(180,255,0,0.08)" : "transparent",
              }}
            >
              {de ? p.de : p.en}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={copy.factor}>
          <div className="flex gap-2">
            {(["2", "4"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFactor(f)}
                className="preview-type-chip flex-1 rounded border px-3 py-1.5"
                style={{
                  borderColor: factor === f ? "rgba(180,255,0,0.35)" : BORDER,
                  color: factor === f ? ACCENT : "var(--studio-text-secondary)",
                }}
              >
                {f}x
              </button>
            ))}
          </div>
        </Field>
        <Field label={copy.format}>
          <div className="flex gap-2">
            {(["jpeg", "png"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className="preview-type-chip flex-1 rounded border px-3 py-1.5 uppercase"
                style={{
                  borderColor: format === f ? "rgba(180,255,0,0.35)" : BORDER,
                  color: format === f ? ACCENT : "var(--studio-text-secondary)",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen((v) => !v)}
        className="preview-type-meta"
        style={{ color: "rgba(244,240,232,0.45)" }}
      >
        {advancedOpen ? "−" : "+"} {copy.advanced}
      </button>

      {advancedOpen ? (
        <div className="grid gap-3 border-t pt-3 sm:grid-cols-2" style={{ borderColor: BORDER }}>
          <Field label={copy.model}>
            <input
              readOnly
              className="preview-type-body w-full rounded border bg-transparent px-2 py-1.5 text-[0.75rem]"
              style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
              value={engine.advancedLabel ?? engine.label}
            />
          </Field>
          <label className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              checked={subjectDetection}
              onChange={(e) => setSubjectDetection(e.target.checked)}
            />
            <span className="preview-type-body text-[0.8125rem]">{copy.subjectDetection}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={faceEnhancement}
              onChange={(e) => setFaceEnhancement(e.target.checked)}
            />
            <span className="preview-type-body text-[0.8125rem]">{copy.faceEnhancement}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={fixCompression}
              onChange={(e) => setFixCompression(e.target.checked)}
            />
            <span className="preview-type-body text-[0.8125rem]">{copy.fixCompression}</span>
          </label>
          <Field label={copy.faceStrength}>
            <input
              type="range"
              min={0}
              max={100}
              value={faceStrength}
              onChange={(e) => setFaceStrength(Number(e.target.value))}
              className="w-full"
            />
          </Field>
          <Field label={copy.sharpen}>
            <input
              type="range"
              min={0}
              max={100}
              value={sharpen}
              onChange={(e) => setSharpen(Number(e.target.value))}
              className="w-full"
            />
          </Field>
          <Field label={copy.denoise}>
            <input
              type="range"
              min={0}
              max={100}
              value={denoise}
              onChange={(e) => setDenoise(Number(e.target.value))}
              className="w-full"
            />
          </Field>
        </div>
      ) : null}

      {phase === "complete" ? (
        <Link
          href={PREVIEW_MVP_ROUTES.imageUpscale}
          className="preview-type-btn inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-[0.75rem] uppercase tracking-[0.08em]"
          style={{ background: ACCENT, color: "#080808" }}
        >
          {copy.cta} →
        </Link>
      ) : null}
    </div>
  );
}

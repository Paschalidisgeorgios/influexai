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
  { id: "denoise", de: "Denoise", en: "Denoise" },
  { id: "animation", de: "Animation", en: "Animation" },
  { id: "high_detail", de: "High Detail", en: "High Detail" },
] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="preview-type-meta mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

type VideoUpscaleWorkflowPanelProps = {
  lang: "de" | "en";
  engine: StudioEngineDefinition;
  phase: WorkflowPhase;
  hasSourceAsset: boolean;
};

export function VideoUpscaleWorkflowPanel({
  lang,
  engine,
  phase,
  hasSourceAsset,
}: VideoUpscaleWorkflowPanelProps) {
  const de = lang === "de";
  const [preset, setPreset] = useState<string>(PRESETS[0].id);
  const [factor, setFactor] = useState<"2" | "4">("2");
  const [targetFps, setTargetFps] = useState<"original" | "30" | "60">("original");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [compression, setCompression] = useState(35);
  const [noise, setNoise] = useState(25);
  const [halo, setHalo] = useState(20);
  const [grain, setGrain] = useState(15);
  const [recoverDetail, setRecoverDetail] = useState(true);
  const [h264Output, setH264Output] = useState(false);

  const copy = {
    title: de ? "Video verbessern" : "Improve video",
    source: de ? "Quelle" : "Source",
    sourceAttached: de ? "Aktuelles Video übernommen" : "Current video attached",
    sourceMissing: de ? "Video hochladen oder aus Galerie wählen" : "Upload video or pick from gallery",
    upload: de ? "Hochladen" : "Upload",
    gallery: de ? "Galerie" : "Gallery",
    preset: de ? "Preset" : "Preset",
    factor: de ? "Upscale-Faktor" : "Upscale factor",
    fps: de ? "Ziel-FPS" : "Target FPS",
    advanced: de ? "Erweiterte Einstellungen" : "Advanced settings",
    model: de ? "Topaz-Modell" : "Topaz model",
    compression: de ? "Kompression" : "Compression",
    noise: de ? "Rauschen" : "Noise",
    halo: "Halo",
    grain: de ? "Körnung" : "Grain",
    recoverDetail: de ? "Details wiederherstellen" : "Recover detail",
    h264: "H264 Output",
    cta: de ? "Video verbessern" : "Improve video",
    hint: de
      ? "Ideal nach Bild-zu-Video oder Text-zu-Video vor Export."
      : "Best after image-to-video or text-to-video before export.",
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
        <Field label={copy.fps}>
          <select
            className="preview-type-body w-full rounded border bg-transparent px-2 py-2 text-[0.8125rem] outline-none"
            style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
            value={targetFps}
            onChange={(e) => setTargetFps(e.target.value as typeof targetFps)}
          >
            <option value="original">{de ? "Original" : "Original"}</option>
            <option value="30">30</option>
            <option value="60">60</option>
          </select>
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
              checked={recoverDetail}
              onChange={(e) => setRecoverDetail(e.target.checked)}
            />
            <span className="preview-type-body text-[0.8125rem]">{copy.recoverDetail}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={h264Output}
              onChange={(e) => setH264Output(e.target.checked)}
            />
            <span className="preview-type-body text-[0.8125rem]">{copy.h264}</span>
          </label>
          <Field label={copy.compression}>
            <input
              type="range"
              min={0}
              max={100}
              value={compression}
              onChange={(e) => setCompression(Number(e.target.value))}
              className="w-full"
            />
          </Field>
          <Field label={copy.noise}>
            <input
              type="range"
              min={0}
              max={100}
              value={noise}
              onChange={(e) => setNoise(Number(e.target.value))}
              className="w-full"
            />
          </Field>
          <Field label={copy.halo}>
            <input
              type="range"
              min={0}
              max={100}
              value={halo}
              onChange={(e) => setHalo(Number(e.target.value))}
              className="w-full"
            />
          </Field>
          <Field label={copy.grain}>
            <input
              type="range"
              min={0}
              max={100}
              value={grain}
              onChange={(e) => setGrain(Number(e.target.value))}
              className="w-full"
            />
          </Field>
        </div>
      ) : null}

      {phase === "complete" ? (
        <Link
          href={PREVIEW_MVP_ROUTES.videoUpscale}
          className="preview-type-btn inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-[0.75rem] uppercase tracking-[0.08em]"
          style={{ background: ACCENT, color: "#080808" }}
        >
          {copy.cta} →
        </Link>
      ) : null}
    </div>
  );
}

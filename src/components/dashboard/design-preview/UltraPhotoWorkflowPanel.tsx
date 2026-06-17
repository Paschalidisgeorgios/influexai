"use client";

import { useState } from "react";
import type { PreviewFormat, PreviewIntent } from "./preview-intent";
import type { WorkflowPhase } from "./DynamicWorkflowResult";
import {
  isUltraPhotoEngine,
  type StudioEngineDefinition,
} from "./studio-engine-registry";

const ACCENT = "#b4ff00";
const BORDER = "rgba(255,255,255,0.08)";

const INFLUENCER_STYLES = [
  "Beauty",
  "Fashion",
  "Fitness",
  "Business",
  "Lifestyle",
  "Cinematic",
] as const;

const PLATFORMS = [
  "Instagram Feed",
  "Instagram Reel",
  "TikTok",
  "YouTube",
  "LinkedIn",
] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="preview-type-meta mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

type UltraPhotoWorkflowPanelProps = {
  intent: Extract<PreviewIntent, "ai_influencer" | "product_visual" | "image_generation">;
  originalPrompt: string;
  optimizedPrompt: string;
  onOptimizedChange: (value: string) => void;
  format: PreviewFormat | null;
  lang: "de" | "en";
  engine: StudioEngineDefinition;
  phase: WorkflowPhase;
  mvpHref: string;
};

export function UltraPhotoWorkflowPanel({
  intent,
  originalPrompt,
  optimizedPrompt,
  onOptimizedChange,
  format,
  lang,
  engine,
  phase,
  mvpHref,
}: UltraPhotoWorkflowPanelProps) {
  const de = lang === "de";
  const isInfluencer = intent === "ai_influencer";
  const ultra = isUltraPhotoEngine(engine);

  const [persona, setPersona] = useState(originalPrompt);
  const [style, setStyle] = useState<string>(INFLUENCER_STYLES[0]);
  const [outfit, setOutfit] = useState("");
  const [location, setLocation] = useState("");
  const [quality, setQuality] = useState<"standard" | "premium" | "ultra">(
    ultra ? "ultra" : "standard"
  );

  const panelTitle = isInfluencer
    ? "AI Influencer Visual"
    : de
      ? "Produktvisual"
      : "Product visual";

  const copy = {
    original: de ? "Original" : "Original",
    optimized: de ? "Optimiert · Produktionsprompt" : "Optimized · production prompt",
    pipeline: de
      ? "User Prompt → Claude Optimization → English Production Prompt → Engine"
      : "User prompt → Claude optimization → English production prompt → engine",
    optimizeHint: de
      ? "Deutsche Eingaben werden für die Engine in englische Produktionssprache übersetzt."
      : "German inputs are translated into English production language for the engine.",
    persona: de ? "Persona / Beschreibung" : "Persona / description",
    style: de ? "Stil" : "Style",
    outfit: de ? "Outfit" : "Outfit",
    location: de ? "Location" : "Location",
    platform: de ? "Plattform" : "Platform",
    format: "Format",
    quality: de ? "Qualität" : "Quality",
    engine: de ? "Engine" : "Engine",
    advanced: de ? "Erweiterte Einstellungen" : "Advanced settings",
    seed: "Seed",
    aspect: de ? "Seitenverhältnis" : "Aspect ratio",
    rawMode: "Raw / Ultra Mode",
    credits: "Credits",
    reference: de ? "Referenzbild (optional)" : "Reference image (optional)",
    referenceHint: de ? "Für spätere Referenz-Pipeline vorbereitet" : "Prepared for future reference pipeline",
  };

  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="space-y-4">
      <p className="preview-type-workflow-title">{panelTitle}</p>

      {isInfluencer ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copy.persona}>
            <textarea
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              rows={3}
              className="preview-type-body w-full resize-none rounded border bg-transparent px-3 py-2 text-[0.8125rem] outline-none"
              style={{ borderColor: BORDER, color: "var(--studio-text-primary)" }}
            />
          </Field>
          <div className="grid gap-3">
            <Field label={copy.style}>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="preview-type-body w-full rounded border bg-transparent px-2 py-2 text-[0.8125rem] outline-none"
                style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
              >
                {INFLUENCER_STYLES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={copy.outfit}>
              <input
                type="text"
                value={outfit}
                onChange={(e) => setOutfit(e.target.value)}
                placeholder={de ? "z. B. Premium Streetwear" : "e.g. premium streetwear"}
                className="preview-type-body w-full rounded border bg-transparent px-3 py-2 text-[0.8125rem] outline-none"
                style={{ borderColor: BORDER, color: "var(--studio-text-primary)" }}
              />
            </Field>
            <Field label={copy.location}>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={de ? "z. B. Studio, Mediterranean terrace" : "e.g. studio, Mediterranean terrace"}
                className="preview-type-body w-full rounded border bg-transparent px-3 py-2 text-[0.8125rem] outline-none"
                style={{ borderColor: BORDER, color: "var(--studio-text-primary)" }}
              />
            </Field>
          </div>
        </div>
      ) : (
        <Field label={de ? "Produkt / Motiv" : "Product / subject"}>
          <textarea
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            rows={2}
            className="preview-type-body w-full resize-none rounded border bg-transparent px-3 py-2 text-[0.8125rem] outline-none"
            style={{ borderColor: BORDER, color: "var(--studio-text-primary)" }}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label={copy.platform}>
          <select
            className="preview-type-body w-full rounded border bg-transparent px-2 py-2 text-[0.8125rem] outline-none"
            style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
            defaultValue="Instagram Feed"
          >
            {PLATFORMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label={copy.format}>
          <select
            className="preview-type-body w-full rounded border bg-transparent px-2 py-2 text-[0.8125rem] outline-none"
            style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
            defaultValue={format ?? "4:5"}
          >
            <option>{format ?? "4:5"}</option>
            <option>9:16</option>
            <option>1:1</option>
            <option>16:9</option>
          </select>
        </Field>
        <Field label={copy.quality}>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as typeof quality)}
            className="preview-type-body w-full rounded border bg-transparent px-2 py-2 text-[0.8125rem] outline-none"
            style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
          >
            <option value="standard">{de ? "Standard" : "Standard"}</option>
            <option value="premium">{de ? "Premium" : "Premium"}</option>
            <option value="ultra">Ultra</option>
          </select>
        </Field>
        <Field label={copy.engine}>
          <div
            className="preview-type-body rounded border px-2 py-2 text-[0.8125rem]"
            style={{ borderColor: "rgba(180,255,0,0.22)", color: ACCENT }}
          >
            {engine.label}
          </div>
        </Field>
      </div>

      <div className="grid gap-3 border-t pt-3" style={{ borderColor: BORDER }}>
        <Field label={copy.original}>
          <p
            className="preview-type-body rounded border px-3 py-2 text-[0.8125rem]"
            style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
          >
            {originalPrompt}
          </p>
        </Field>
        {phase !== "optimizing" && (
          <>
            <Field label={copy.optimized}>
              <textarea
                value={optimizedPrompt}
                onChange={(e) => onOptimizedChange(e.target.value)}
                rows={4}
                className="preview-type-body w-full resize-none rounded border bg-transparent px-3 py-2 text-[0.8125rem] outline-none"
                style={{ borderColor: BORDER, color: "var(--studio-text-primary)" }}
              />
            </Field>
            <p className="preview-type-body preview-type-body--muted text-[0.6875rem]">
              {copy.pipeline}
            </p>
            <p className="preview-type-body preview-type-body--muted text-[0.6875rem]">
              {copy.optimizeHint}
            </p>
          </>
        )}
      </div>

      {ultra ? (
        <Field label={copy.reference}>
          <div
            className="preview-type-body rounded border border-dashed px-3 py-4 text-center text-[0.75rem]"
            style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
          >
            {copy.referenceHint}
          </div>
        </Field>
      ) : null}

      <button
        type="button"
        onClick={() => setAdvancedOpen((v) => !v)}
        className="preview-type-meta"
        style={{ color: "rgba(244,240,232,0.45)" }}
      >
        {advancedOpen ? "−" : "+"} {copy.advanced}
      </button>

      {advancedOpen ? (
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
          <Field label={copy.seed}>
            <input
              readOnly
              placeholder={de ? "Automatisch" : "Auto"}
              className="preview-type-body w-full rounded border bg-transparent px-2 py-1.5 text-[0.75rem]"
              style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
            />
          </Field>
          <Field label={copy.aspect}>
            <input
              readOnly
              className="preview-type-body w-full rounded border bg-transparent px-2 py-1.5 text-[0.75rem]"
              style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
              value={format ?? "4:5"}
            />
          </Field>
          {ultra ? (
            <Field label={copy.rawMode}>
              <input
                readOnly
                className="preview-type-body w-full rounded border bg-transparent px-2 py-1.5 text-[0.75rem]"
                style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
                value="Ultra"
              />
            </Field>
          ) : null}
          <Field label={copy.credits}>
            <input
              readOnly
              className="preview-type-body w-full rounded border bg-transparent px-2 py-1.5 text-[0.75rem]"
              style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
              value={de ? "Laut Plan · Preview" : "Per plan · preview"}
            />
          </Field>
        </div>
      ) : null}

      {phase === "complete" ? (
        <a
          href={mvpHref}
          className="preview-type-btn inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-[0.75rem] uppercase tracking-[0.08em]"
          style={{ background: ACCENT, color: "#080808" }}
        >
          {engine.executionHint[lang]}
        </a>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  type PreviewIntent,
  type PreviewFormat,
  engineLabelForIntent,
} from "./preview-intent";

const ACCENT = "#b4ff00";
const DARK = "#080808";
const META = "rgba(8,8,8,0.45)";
const BODY = "rgba(8,8,8,0.68)";
const BORDER = "rgba(8,8,8,0.08)";
const PANEL_BG = "rgba(244,240,232,0.55)";

type PreviewWorkflowPanelProps = {
  intent: PreviewIntent;
  originalPrompt: string;
  optimizedPrompt: string;
  format: PreviewFormat | null;
  needsPlatform: boolean;
  lang: "de" | "en";
};

const COPY = {
  de: {
    original: "Original",
    optimized: "Optimiert",
    optimizeHint: "Prompts werden für die Produktions-Engine optimiert.",
    platformAsk: "Für welche Plattform oder welchen Zweck soll das Asset entstehen?",
    advanced: "Erweiterte Einstellungen",
    model: "Modell",
    provider: "Provider",
    seed: "Seed",
    resolution: "Auflösung",
    duration: "Dauer",
    credits: "Credits",
    style: "Stil",
    quality: "Qualität",
    cta: {
      image_generation: "Bild erstellen",
      image_to_video: "Video erstellen",
      hook_generation: "Hooks generieren",
      campaign_planning: "Kampagne planen",
      asset_reuse: "Variante erstellen",
      unknown: "Produktion starten",
    },
    styles: ["Produkt", "Creator", "Ad", "Cinematic"],
    qualities: ["Schnell", "Standard", "Premium"],
  },
  en: {
    original: "Original",
    optimized: "Optimized",
    optimizeHint: "Prompts are optimized for the production engine.",
    platformAsk: "Which platform or purpose should this asset target?",
    advanced: "Advanced settings",
    model: "Model",
    provider: "Provider",
    seed: "Seed",
    resolution: "Resolution",
    duration: "Duration",
    credits: "Credits",
    style: "Style",
    quality: "Quality",
    cta: {
      image_generation: "Create image",
      image_to_video: "Create video",
      hook_generation: "Generate hooks",
      campaign_planning: "Plan campaign",
      asset_reuse: "Create variant",
      unknown: "Start production",
    },
    styles: ["Product", "Creator", "Ad", "Cinematic"],
    qualities: ["Fast", "Standard", "Premium"],
  },
} as const;

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

export function PreviewWorkflowPanel({
  intent,
  originalPrompt,
  optimizedPrompt,
  format,
  needsPlatform,
  lang,
}: PreviewWorkflowPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const t = COPY[lang];
  const engine = engineLabelForIntent(intent);

  if (intent === "unknown" && !originalPrompt.trim()) {
    return (
      <div
        className="flex min-h-[220px] items-center justify-center rounded-lg border px-6 py-8 text-center"
        style={{ background: PANEL_BG, borderColor: BORDER }}
      >
        <p className="max-w-sm text-[14px] leading-relaxed" style={{ color: BODY }}>
          {lang === "de"
            ? "Beschreibe dein Ziel oben — InfluexAI bereitet den passenden Workflow vor."
            : "Describe your goal above — InfluexAI will prepare the matching workflow."}
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-w-0 rounded-lg border p-4 md:p-5"
      style={{ background: PANEL_BG, borderColor: BORDER }}
      data-preview-panel
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: META }}>
          Workflow
        </p>
        <span
          className="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em]"
          style={{ background: "rgba(180,255,0,0.12)", color: "rgba(8,8,8,0.78)" }}
        >
          {engine}
        </span>
      </div>

      {needsPlatform ? (
        <div
          className="mb-4 rounded border px-3 py-2.5 text-[13px]"
          style={{ borderColor: "rgba(180,255,0,0.25)", background: "rgba(180,255,0,0.06)", color: DARK }}
        >
          {t.platformAsk}
        </div>
      ) : null}

      <div className="mb-4 grid gap-3">
        <Field label={t.original}>
          <p className="rounded border px-3 py-2 text-[13px] leading-relaxed" style={{ borderColor: BORDER, color: BODY }}>
            {originalPrompt || "—"}
          </p>
        </Field>
        <Field label={t.optimized}>
          <p className="rounded border px-3 py-2 text-[13px] leading-relaxed" style={{ borderColor: BORDER, color: DARK }}>
            {optimizedPrompt || "—"}
          </p>
          <p className="mt-1.5 text-[11px]" style={{ color: META }}>
            {t.optimizeHint}
          </p>
        </Field>
      </div>

      {intent === "image_generation" && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Field label="Format">
            <select className="w-full rounded border bg-white/40 px-2 py-2 text-[13px]" style={{ borderColor: BORDER }}>
              <option>{format ?? "4:5"}</option>
              <option>9:16</option>
              <option>1:1</option>
              <option>16:9</option>
            </select>
          </Field>
          <Field label={t.style}>
            <select className="w-full rounded border bg-white/40 px-2 py-2 text-[13px]" style={{ borderColor: BORDER }}>
              {t.styles.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label={t.quality}>
            <select className="w-full rounded border bg-white/40 px-2 py-2 text-[13px]" style={{ borderColor: BORDER }}>
              {t.qualities.map((q) => (
                <option key={q}>{q}</option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {intent === "image_to_video" && (
        <div className="mb-4 grid gap-3">
          <Field label={lang === "de" ? "Startbild" : "Start image"}>
            <div className="flex flex-wrap gap-2">
              {["Upload", lang === "de" ? "Aus Galerie" : "From gallery", "URL"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="rounded border px-3 py-2 text-[12px]"
                  style={{ borderColor: BORDER, color: DARK }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Motion Prompt">
            <input
              className="w-full rounded border bg-white/40 px-3 py-2 text-[13px]"
              style={{ borderColor: BORDER }}
              defaultValue={optimizedPrompt}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Format">
              <select className="w-full rounded border bg-white/40 px-2 py-2 text-[13px]" style={{ borderColor: BORDER }}>
                <option>{format ?? "9:16"}</option>
                <option>4:5</option>
                <option>16:9</option>
              </select>
            </Field>
            <Field label={t.quality}>
              <select className="w-full rounded border bg-white/40 px-2 py-2 text-[13px]" style={{ borderColor: BORDER }}>
                {t.qualities.map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      )}

      {intent === "campaign_planning" && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Field label="Plattform">
            <input className="w-full rounded border bg-white/40 px-3 py-2 text-[13px]" style={{ borderColor: BORDER }} placeholder="Instagram" />
          </Field>
          <Field label={lang === "de" ? "Zielgruppe" : "Audience"}>
            <input className="w-full rounded border bg-white/40 px-3 py-2 text-[13px]" style={{ borderColor: BORDER }} placeholder="Beauty, 18–34" />
          </Field>
          <Field label={lang === "de" ? "Anzahl Ideen" : "Ideas count"}>
            <input className="w-full rounded border bg-white/40 px-3 py-2 text-[13px]" style={{ borderColor: BORDER }} defaultValue="7" />
          </Field>
          <Field label="Hook-Richtung">
            <input className="w-full rounded border bg-white/40 px-3 py-2 text-[13px]" style={{ borderColor: BORDER }} placeholder="UGC / Premium" />
          </Field>
        </div>
      )}

      {intent === "asset_reuse" && (
        <div className="mb-4 grid gap-3">
          <Field label={lang === "de" ? "Asset aus Galerie" : "Gallery asset"}>
            <button type="button" className="w-full rounded border px-3 py-2.5 text-left text-[13px]" style={{ borderColor: BORDER, color: BODY }}>
              {lang === "de" ? "Kampagnenvisual auswählen…" : "Select campaign visual…"}
            </button>
          </Field>
          <Field label={lang === "de" ? "Aktion" : "Action"}>
            <select className="w-full rounded border bg-white/40 px-2 py-2 text-[13px]" style={{ borderColor: BORDER }}>
              <option>Variante</option>
              <option>Remix</option>
              <option>Motion</option>
              <option>{lang === "de" ? "Speichern" : "Save"}</option>
            </select>
          </Field>
        </div>
      )}

      <button
        type="button"
        className="mb-3 w-full rounded-md px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.1em]"
        style={{ background: ACCENT, color: DARK }}
      >
        {t.cta[intent]}
      </button>

      <button
        type="button"
        onClick={() => setAdvancedOpen((v) => !v)}
        className="w-full text-left font-mono text-[10px] uppercase tracking-[0.12em]"
        style={{ color: META }}
      >
        {advancedOpen ? "−" : "+"} {t.advanced}
      </button>

      {advancedOpen ? (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: BORDER }}>
          <Field label={t.model}>
            <input className="w-full rounded border bg-white/30 px-2 py-1.5 text-[12px]" style={{ borderColor: BORDER }} defaultValue="InfluexAI Standard" />
          </Field>
          <Field label={t.provider}>
            <input className="w-full rounded border bg-white/30 px-2 py-1.5 text-[12px]" style={{ borderColor: BORDER }} defaultValue="Internal routing" />
          </Field>
          <Field label={t.seed}>
            <input className="w-full rounded border bg-white/30 px-2 py-1.5 text-[12px]" style={{ borderColor: BORDER }} defaultValue="42891" />
          </Field>
          <Field label={t.resolution}>
            <input className="w-full rounded border bg-white/30 px-2 py-1.5 text-[12px]" style={{ borderColor: BORDER }} defaultValue="2048" />
          </Field>
          {intent === "image_to_video" ? (
            <Field label={t.duration}>
              <input className="w-full rounded border bg-white/30 px-2 py-1.5 text-[12px]" style={{ borderColor: BORDER }} defaultValue="6s" />
            </Field>
          ) : null}
          <Field label={t.credits}>
            <input className="w-full rounded border bg-white/30 px-2 py-1.5 text-[12px]" style={{ borderColor: BORDER }} defaultValue="8" />
          </Field>
        </div>
      ) : null}
    </div>
  );
}

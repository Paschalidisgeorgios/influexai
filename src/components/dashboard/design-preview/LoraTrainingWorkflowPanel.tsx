"use client";

import { useState } from "react";
import Link from "next/link";
import type { WorkflowPhase } from "./DynamicWorkflowResult";
import type { StudioEngineDefinition } from "./studio-engine-registry";
import { PREVIEW_MVP_ROUTES } from "./preview-routes";
import { LORA_REFERENCE_IMAGES } from "@/lib/landing-v2-studio-demo-scenarios";

const ACCENT = "#b4ff00";
const BORDER = "rgba(255, 255, 255, 0.08)";

const TRAINING_TYPES = [
  { id: "persona", de: "AI Influencer / Persona", en: "AI Influencer / Persona" },
  { id: "brand", de: "Brand Style", en: "Brand Style" },
  { id: "product", de: "Produktstil", en: "Product Style" },
  { id: "character", de: "Character Reference", en: "Character Reference" },
] as const;

const STATUS_STEPS = [
  { id: "prep", de: "Vorbereitung", en: "Preparation" },
  { id: "upload", de: "Upload", en: "Upload" },
  { id: "training", de: "Training", en: "Training" },
  { id: "done", de: "Fertig", en: "Complete" },
] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="preview-type-meta mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

type LoraTrainingWorkflowPanelProps = {
  originalPrompt: string;
  lang: "de" | "en";
  engine: StudioEngineDefinition;
  phase: WorkflowPhase;
};

export function LoraTrainingWorkflowPanel({
  originalPrompt,
  lang,
  engine,
  phase,
}: LoraTrainingWorkflowPanelProps) {
  const de = lang === "de";
  const [trainingType, setTrainingType] = useState<string>(TRAINING_TYPES[0].id);
  const [name, setName] = useState("");
  const [description, setDescription] = useState(originalPrompt);
  const [quality, setQuality] = useState<"standard" | "premium" | "ultra">("standard");
  const [consent, setConsent] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [prepared, setPrepared] = useState(false);

  const copy = {
    title: de ? "LoRA Training vorbereiten" : "Prepare LoRA training",
    subline: de
      ? "Erstelle eine wiederverwendbare Persona oder einen Brand-Look, der später in Bild-Workflows genutzt werden kann."
      : "Create a reusable persona or brand look for later use in image workflows.",
    type: de ? "Trainingsart" : "Training type",
    name: de ? "Name des Trainings" : "Training name",
    namePlaceholder: de ? "Beauty Creator Persona" : "Beauty Creator Persona",
    description: de ? "Beschreibung" : "Description",
    descPlaceholder: de
      ? "Premium Mediterranean product aesthetic"
      : "Premium Mediterranean product aesthetic",
    upload: de ? "Bilder" : "Images",
    uploadHint: de
      ? "Mind. 8–15 klare Referenzbilder · gleichmäßiges Licht · keine starken Filter"
      : "At least 8–15 clear reference images · even lighting · no heavy filters",
    addImages: de ? "Bilder hinzufügen" : "Add images",
    fromGallery: de ? "Aus Galerie wählen" : "Pick from gallery",
    rightsHint: de
      ? "Bitte lade nur Bilder hoch, für die du die nötigen Rechte und Zustimmungen hast."
      : "Only upload images you have the rights and consent to use.",
    consent: de
      ? "Ich bestätige, dass ich die Rechte und Zustimmung zur Nutzung der hochgeladenen Bilder habe."
      : "I confirm I have the rights and consent to use the uploaded images.",
    quality: de ? "Qualität" : "Quality",
    status: de ? "Status" : "Status",
    prepare: de ? "Training vorbereiten" : "Prepare training",
    prepareNote: de
      ? "Dieser Workflow wird für die Trainingspipeline vorbereitet."
      : "This workflow prepares the training pipeline.",
    prepared: de ? "Vorbereitung gespeichert" : "Preparation saved",
    openWorkflow: de ? "LoRA-Workflow öffnen" : "Open LoRA workflow",
    advanced: de ? "Erweiterte Einstellungen" : "Advanced settings",
    provider: "Provider",
    model: de ? "Modelltyp" : "Model type",
    steps: de ? "Trainingsschritte" : "Training steps",
    credits: "Credits",
  };

  const canPrepare = consent && name.trim().length > 0 && phase === "complete";

  return (
    <div className="space-y-4">
      <div>
        <p className="preview-type-workflow-title">{copy.title}</p>
        <p className="preview-type-body preview-type-body--muted mt-1.5 text-[0.8125rem]">
          {copy.subline}
        </p>
      </div>

      <Field label={copy.type}>
        <select
          value={trainingType}
          onChange={(e) => setTrainingType(e.target.value)}
          className="preview-type-body w-full rounded border bg-transparent px-2 py-2 text-[0.8125rem] outline-none"
          style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
        >
          {TRAINING_TYPES.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {de ? opt.de : opt.en}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={copy.name}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={copy.namePlaceholder}
            className="preview-type-body w-full rounded border bg-transparent px-3 py-2 text-[0.8125rem] outline-none"
            style={{ borderColor: BORDER, color: "var(--studio-text-primary)" }}
          />
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
      </div>

      <Field label={copy.description}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder={copy.descPlaceholder}
          className="preview-type-body w-full resize-none rounded border bg-transparent px-3 py-2 text-[0.8125rem] outline-none"
          style={{ borderColor: BORDER, color: "var(--studio-text-primary)" }}
        />
      </Field>

      <Field label={copy.upload}>
        <div
          className="rounded border border-dashed px-3 py-4"
          style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}
        >
          <p className="preview-type-body preview-type-body--muted text-[0.75rem]">
            {copy.uploadHint}
          </p>
          <div className="preview-lora-thumb-row mt-3" aria-label={de ? "Referenzbilder Demo" : "Reference images demo"}>
            {LORA_REFERENCE_IMAGES.map((thumb) => (
              <img
                key={thumb.src}
                src={thumb.src}
                alt={thumb.alt}
                className="preview-lora-thumb"
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
          <p className="preview-type-body preview-type-body--muted mt-2 text-[0.6875rem]">
            {de
              ? "Demo-Referenzen — kein trainiertes Modell."
              : "Demo references — no trained model."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="preview-type-chip rounded border px-3 py-1.5 text-[0.75rem]"
              style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
            >
              {copy.addImages}
            </button>
            <Link
              href={PREVIEW_MVP_ROUTES.gallery}
              className="preview-type-chip rounded border px-3 py-1.5 text-[0.75rem]"
              style={{ borderColor: BORDER, color: "var(--studio-text-secondary)" }}
            >
              {copy.fromGallery}
            </Link>
          </div>
        </div>
        <p className="preview-type-body preview-type-body--muted mt-2 text-[0.6875rem]">
          {copy.rightsHint}
        </p>
      </Field>

      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 accent-[#b4ff00]"
        />
        <span className="preview-type-body text-[0.8125rem]" style={{ color: "var(--studio-text-secondary)" }}>
          {copy.consent}
        </span>
      </label>

      <div>
        <p className="preview-type-meta mb-2">{copy.status}</p>
        <ol className="flex flex-wrap gap-2">
          {STATUS_STEPS.map((step, index) => {
            const active = index === 0;
            return (
              <li
                key={step.id}
                className="preview-type-chip rounded border px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.06em]"
                style={{
                  borderColor: active ? "rgba(180,255,0,0.35)" : BORDER,
                  color: active ? ACCENT : "var(--studio-text-muted)",
                  background: active ? "rgba(180,255,0,0.08)" : "transparent",
                }}
              >
                {de ? step.de : step.en}
              </li>
            );
          })}
        </ol>
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
        <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: BORDER }}>
          <Field label={copy.model}>
            <input
              readOnly
              className="preview-type-body w-full rounded border bg-transparent px-2 py-1.5 text-[0.75rem]"
              style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
              value={engine.advancedLabel ?? "Flux LoRA"}
            />
          </Field>
          <Field label={copy.provider}>
            <input
              readOnly
              className="preview-type-body w-full rounded border bg-transparent px-2 py-1.5 text-[0.75rem]"
              style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
              value={engine.provider ?? "fal.ai"}
            />
          </Field>
          <Field label={copy.steps}>
            <input
              readOnly
              placeholder={de ? "Nach Upload" : "After upload"}
              className="preview-type-body w-full rounded border bg-transparent px-2 py-1.5 text-[0.75rem]"
              style={{ borderColor: BORDER, color: "var(--studio-text-muted)" }}
            />
          </Field>
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
        <div className="space-y-2 border-t pt-3" style={{ borderColor: BORDER }}>
          <button
            type="button"
            disabled={!canPrepare}
            onClick={() => setPrepared(true)}
            className="preview-type-btn inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-[0.75rem] uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: canPrepare ? ACCENT : "rgba(255,255,255,0.08)", color: canPrepare ? "#080808" : "var(--studio-text-muted)" }}
          >
            {prepared ? copy.prepared : copy.prepare}
          </button>
          <p className="preview-type-body preview-type-body--muted text-center text-[0.6875rem]">
            {copy.prepareNote}
          </p>
          {prepared ? (
            <Link
              href={PREVIEW_MVP_ROUTES.loraTraining}
              className="preview-type-btn inline-flex w-full items-center justify-center rounded-md border px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.08em]"
              style={{ borderColor: "rgba(180,255,0,0.28)", color: ACCENT }}
            >
              {copy.openWorkflow}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LORA_REFERENCE_IMAGES } from "@/lib/landing-v2-studio-demo-scenarios";
import { suggestTriggerWord } from "@/lib/ai-creator/trigger-word";
import {
  badgeForStatus,
  deriveTrainingStatus,
  mapDbStatus,
} from "@/lib/ai-creator/status";
import {
  ACCEPTED_REFERENCE_TYPES,
  REFERENCE_MIN_HINT,
  REFERENCE_RECOMMENDED_COUNT,
  type AiCreatorDraft,
  type AiCreatorSeed,
  type CharacterType,
} from "@/lib/ai-creator/types";
import "./ai-creator.css";

const ACCENT = "#b4ff00";
const BORDER = "rgba(255, 255, 255, 0.08)";

const SELF_STEPS_DE = [
  "Referenzbilder hochladen",
  "Qualität prüfen",
  "Consent bestätigen",
  "Persona-Profil",
  "Training vorbereiten",
] as const;

const SELF_STEPS_EN = [
  "Upload reference images",
  "Review quality",
  "Confirm consent",
  "Persona profile",
  "Prepare training",
] as const;

const FICTIONAL_STEPS_DE = [
  "Persona beschreiben",
  "Profil vorbereiten",
  "Referenzen vorbereiten",
  "Set bestätigen",
  "Training vorbereiten",
] as const;

const FICTIONAL_STEPS_EN = [
  "Describe persona",
  "Prepare profile",
  "Prepare references",
  "Confirm set",
  "Prepare training",
] as const;

const PREVIEW_STORAGE_KEY = "influexai-preview-ai-creators";

function emptyDraft(): AiCreatorDraft {
  return {
    name: "",
    characterType: null,
    triggerWord: "",
    niche: "",
    style: "",
    tone: "",
    platforms: [],
    targetAudience: "",
    description: "",
    consentConfirmed: false,
    referenceImageUrls: [],
    trainingStatus: "draft",
  };
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`ai-creator-field ${className}`.trim()}>
      <span className="ai-creator-field__label">{label}</span>
      {children}
    </label>
  );
}

function inputClass() {
  return "ai-creator-input w-full min-w-0 rounded border bg-transparent px-3 py-2.5 text-[0.875rem] outline-none transition-colors focus:border-white/20";
}

type UploadedPreview = { id: string; url: string; name: string; landscape: boolean };

function analyzeImageOrientation(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve(img.naturalWidth >= img.naturalHeight);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    img.src = url;
  });
}

export type AiCreatorWorkflowProps = {
  lang?: "de" | "en";
  seed?: AiCreatorSeed;
  preview?: boolean;
  classPrefix?: "preview" | "dashboard";
};

export function AiCreatorWorkflow({
  lang = "de",
  seed,
  preview = false,
  classPrefix = "dashboard",
}: AiCreatorWorkflowProps) {
  const de = lang === "de";
  const [draft, setDraft] = useState<AiCreatorDraft>(() => {
    const base = emptyDraft();
    if (seed?.prompt) base.description = seed.prompt;
    if (seed?.mode) base.characterType = seed.mode;
    return base;
  });
  const [uploads, setUploads] = useState<UploadedPreview[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [prepared, setPrepared] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!seed) return;
    setDraft((prev) => ({
      ...prev,
      description: seed.prompt ?? prev.description,
      characterType: seed.mode ?? prev.characterType,
    }));
  }, [seed]);

  const effectiveStatus = useMemo(
    () =>
      deriveTrainingStatus({
        ...draft,
        referenceImageUrls: [
          ...draft.referenceImageUrls,
          ...uploads.map((u) => u.url),
        ],
      }),
    [draft, uploads]
  );

  const steps =
    draft.characterType === "fictional"
      ? de
        ? FICTIONAL_STEPS_DE
        : FICTIONAL_STEPS_EN
      : draft.characterType === "self"
        ? de
          ? SELF_STEPS_DE
          : SELF_STEPS_EN
        : [];

  const landscapeCount = uploads.filter((u) => u.landscape).length;
  const portraitCount = uploads.length - landscapeCount;
  const imageCount = uploads.length;

  const canPrepareTraining =
    draft.characterType === "self"
      ? imageCount >= REFERENCE_MIN_HINT &&
        draft.consentConfirmed &&
        draft.name.trim().length > 0
      : draft.characterType === "fictional"
        ? draft.name.trim().length > 0 && draft.description.trim().length > 0
        : false;

  const handleChooseType = (type: CharacterType) => {
    setDraft((prev) => ({ ...prev, characterType: type }));
    setPrepared(false);
    setSaveMessage(null);
  };

  const handleNameChange = (name: string) => {
    setDraft((prev) => ({
      ...prev,
      name,
      triggerWord: prev.triggerWord || suggestTriggerWord(name),
    }));
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const next: UploadedPreview[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED_REFERENCE_TYPES.has(file.type)) continue;
      const url = URL.createObjectURL(file);
      const landscape = await analyzeImageOrientation(file);
      next.push({
        id: `${file.name}-${file.lastModified}`,
        url,
        name: file.name,
        landscape,
      });
    }
    if (next.length) setUploads((prev) => [...prev, ...next]);
  }, []);

  const removeUpload = (id: string) => {
    setUploads((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const persistPreview = (character: AiCreatorDraft & { id: string }) => {
    try {
      const raw = localStorage.getItem(PREVIEW_STORAGE_KEY);
      const list: (AiCreatorDraft & { id: string })[] = raw ? JSON.parse(raw) : [];
      list.unshift(character);
      localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(list.slice(0, 12)));
    } catch {
      /* preview-only */
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    const payload: AiCreatorDraft = {
      ...draft,
      referenceImageUrls: uploads.map((u) => u.url),
      trainingStatus: effectiveStatus,
      previewImageUrl: uploads[0]?.url ?? draft.previewImageUrl,
    };

    if (preview) {
      const id = crypto.randomUUID();
      persistPreview({ ...payload, id });
      setDraft((prev) => ({ ...prev, id, trainingStatus: effectiveStatus }));
      setSaveMessage(de ? "Character in Preview gespeichert." : "Character saved in preview.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/ai-creator/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          characterType: payload.characterType,
          triggerWord: payload.triggerWord,
          niche: payload.niche,
          style: payload.style,
          tone: payload.tone,
          platforms: payload.platforms,
          targetAudience: payload.targetAudience,
          description: payload.description,
          consentConfirmed: payload.consentConfirmed,
          referenceImageUrls: [],
          trainingStatus: payload.trainingStatus,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        character?: { id: string; trainingStatus: string };
        error?: string;
      };
      if (!res.ok || !json.success || !json.character) {
        setSaveMessage(json.error ?? (de ? "Speichern fehlgeschlagen." : "Save failed."));
        setSaving(false);
        return;
      }
      setDraft((prev) => ({
        ...prev,
        id: json.character!.id,
        trainingStatus: mapDbStatus(json.character!.trainingStatus),
      }));
      setSaveMessage(de ? "Character gespeichert." : "Character saved.");
    } catch {
      setSaveMessage(de ? "Speichern fehlgeschlagen." : "Save failed.");
    }
    setSaving(false);
  };

  const handlePrepareTraining = () => {
    if (!canPrepareTraining) return;
    setPrepared(true);
    setDraft((prev) => ({ ...prev, trainingStatus: "ready_to_train" }));
  };

  const statusBadge = badgeForStatus(prepared ? "ready_to_train" : effectiveStatus, lang);
  const rootClass =
    classPrefix === "preview" ? "ai-creator-root ai-creator-root--preview" : "ai-creator-root";

  const copy = {
    headline: de ? "AI Creator erstellen" : "Create AI Creator",
    subline: de
      ? "Baue eine wiedererkennbare Persona für Bilder, UGC, Kampagnen und Motion."
      : "Build a recognizable persona for images, UGC, campaigns, and motion.",
    choose: de ? "Wer ist dein Charakter?" : "Who is your character?",
    selfTitle: de ? "Ich bin der Charakter" : "I am the character",
    selfDesc: de
      ? "Lade eigene Referenzbilder hoch und erstelle einen digitalen Zwilling."
      : "Upload your own reference images and create a digital twin.",
    fictionalTitle: de ? "Ich erstelle einen Charakter" : "I create a character",
    fictionalDesc: de
      ? "Beschreibe eine fiktive Persona. InfluexAI hilft dir beim Aufbau eines konsistenten Creator-Looks."
      : "Describe a fictional persona. InfluexAI helps you build a consistent creator look.",
    rights: de
      ? "Bitte lade nur Bilder hoch, für die du die nötigen Rechte und Zustimmungen hast."
      : "Only upload images you have the rights and consent to use.",
    consent: de
      ? "Ich bestätige, dass ich die nötigen Rechte und Zustimmungen für die hochgeladenen Bilder habe."
      : "I confirm I have the necessary rights and consent for the uploaded images.",
    fictionalLegal: de
      ? "Erstelle keine Persona, die eine reale Person ohne Zustimmung imitiert."
      : "Do not create a persona that imitates a real person without consent.",
    uploadRec: de
      ? `Empfehlung: ${REFERENCE_RECOMMENDED_COUNT}+ Bilder für bessere Konsistenz`
      : `Recommendation: ${REFERENCE_RECOMMENDED_COUNT}+ images for better consistency`,
    uploadMin: de
      ? "Mindestens mehrere klare Referenzen nötig"
      : "At least several clear references required",
    qualityHint: de
      ? "Für bessere Ergebnisse: verschiedene Winkel, Lichtverhältnisse und Gesichtsausdrücke."
      : "For better results: varied angles, lighting, and facial expressions.",
    exampleRefs: de
      ? "Beispiel: Referenzbilder für konsistente Persona"
      : "Example: reference images for a consistent persona",
    exampleNote: de ? "Demo-Referenzen — nicht dein Upload" : "Demo references — not your upload",
    prepare: de ? "Training vorbereiten" : "Prepare training",
    prepareDone: de
      ? "Training-Pipeline vorbereitet. Echte Ausführung folgt über Provider-Anbindung."
      : "Training pipeline prepared. Real execution follows via provider integration.",
    save: de ? "Character speichern" : "Save character",
    refsFictional: de ? "Referenzbilder vorbereiten" : "Prepare reference images",
    refsFictionalHint: de
      ? "Referenzbilder im Bild-Workflow erstellen — automatische Generierung ist in dieser Phase noch nicht angebunden."
      : "Create reference images in the image workflow — automatic generation is not connected in this phase.",
    personaPlaceholder: de
      ? "Mediterrane Beauty Creatorin, Premium-Lifestyle, warmes Licht, elegante Outfits, Instagram & TikTok."
      : "Mediterranean beauty creator, premium lifestyle, warm light, elegant outfits, Instagram & TikTok.",
    stepsLabel: de ? "Workflow" : "Workflow",
    previewLabel: de ? "Status & Next Actions" : "Status & next actions",
    nextImage: de ? "Bild mit Creator erstellen" : "Create image with creator",
    nextUgc: de ? "UGC Script schreiben" : "Write UGC script",
    nextVideo: de ? "Zu Video animieren" : "Animate to video",
    nextCampaign: de ? "Kampagne planen" : "Plan campaign",
    nextGallery: de ? "In Galerie öffnen" : "Open in gallery",
    loraReady: de ? "LoRA aktiv — Trigger:" : "LoRA active — trigger:",
    loraPending: de
      ? "Actions als Vorbereitung — LoRA folgt nach Training."
      : "Actions as preparation — LoRA follows after training.",
  };

  return (
    <div className={rootClass}>
      <header className="ai-creator-header mb-6 md:mb-8">
        <p className="ai-creator-overline mb-2">
          <span className="ai-creator-overline__accent">AI CREATOR</span>
        </p>
        <h1 className="ai-creator-headline">{copy.headline}</h1>
        <p className="ai-creator-subline mt-3 max-w-[48ch]">{copy.subline}</p>
      </header>

      <div className="ai-creator-layout">
        <aside className="ai-creator-steps min-w-0">
          <p className="ai-creator-overline mb-4">{copy.stepsLabel}</p>
          {draft.characterType ? (
            <ol className="ai-creator-step-list">
              {steps.map((label, i) => (
                <li key={label} className="ai-creator-step-list__item">
                  <span className="ai-creator-step-list__num">{String(i + 1).padStart(2, "0")}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="ai-creator-muted text-[0.8125rem]">
              {de ? "Wähle zuerst den Charakter-Typ." : "Choose a character type first."}
            </p>
          )}
        </aside>

        <div className="ai-creator-main min-w-0 space-y-6">
          {!draft.characterType ? (
            <section className="ai-creator-surface space-y-4 p-4 md:p-6">
              <h2 className="ai-creator-section-title">{copy.choose}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="ai-creator-choice"
                  onClick={() => handleChooseType("self")}
                >
                  <span className="ai-creator-choice__title">{copy.selfTitle}</span>
                  <span className="ai-creator-choice__desc">{copy.selfDesc}</span>
                </button>
                <button
                  type="button"
                  className="ai-creator-choice"
                  onClick={() => handleChooseType("fictional")}
                >
                  <span className="ai-creator-choice__title">{copy.fictionalTitle}</span>
                  <span className="ai-creator-choice__desc">{copy.fictionalDesc}</span>
                </button>
              </div>
            </section>
          ) : null}

          {draft.characterType === "self" ? (
            <>
              <section className="ai-creator-surface space-y-4 p-4 md:p-6">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    void handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="ai-creator-section-title">
                      {de ? "Referenzbilder" : "Reference images"}
                    </h2>
                    <p className="ai-creator-muted mt-1 text-[0.8125rem]">{copy.uploadRec}</p>
                    <p className="ai-creator-muted text-[0.75rem]">{copy.uploadMin}</p>
                  </div>
                  <button
                    type="button"
                    className="ai-creator-btn-secondary shrink-0 px-4 py-2 text-[0.6875rem] uppercase tracking-[0.08em]"
                    onClick={() => fileRef.current?.click()}
                  >
                    {de ? "Bilder hinzufügen" : "Add images"}
                  </button>
                </div>
                <p className="ai-creator-muted text-[0.8125rem]">{copy.rights}</p>

                {uploads.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {uploads.map((u) => (
                      <div
                        key={u.id}
                        className="ai-creator-thumb group relative aspect-[3/4] overflow-hidden rounded border"
                        style={{ borderColor: BORDER }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u.url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[0.625rem] opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => removeUpload(u.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="ai-creator-quality rounded border p-3" style={{ borderColor: BORDER }}>
                  <p className="ai-creator-meta mb-2">{de ? "Qualitätsfeedback" : "Quality feedback"}</p>
                  <ul className="ai-creator-muted space-y-1 text-[0.8125rem]">
                    <li>
                      {de ? "Anzahl Bilder:" : "Image count:"}{" "}
                      <strong className="text-white/90">{imageCount}</strong>
                    </li>
                    {imageCount > 0 ? (
                      <li>
                        {de ? "Querformat:" : "Landscape:"}{" "}
                        <strong className="text-white/90">{landscapeCount}</strong>
                        {" · "}
                        {de ? "Hochformat:" : "Portrait:"}{" "}
                        <strong className="text-white/90">{portraitCount}</strong>
                      </li>
                    ) : null}
                    <li>{copy.qualityHint}</li>
                  </ul>
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={draft.consentConfirmed}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, consentConfirmed: e.target.checked }))
                    }
                    className="mt-1"
                  />
                  <span className="ai-creator-muted text-[0.8125rem]">{copy.consent}</span>
                </label>
              </section>

              <section className="ai-creator-surface p-4 md:p-5">
                <p className="ai-creator-meta mb-3">{copy.exampleRefs}</p>
                <div className="grid grid-cols-4 gap-2">
                  {LORA_REFERENCE_IMAGES.map((img) => (
                    <div
                      key={img.src}
                      className="relative aspect-[3/4] overflow-hidden rounded border opacity-80"
                      style={{ borderColor: BORDER }}
                    >
                      <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="80px" />
                    </div>
                  ))}
                </div>
                <p className="ai-creator-muted mt-2 text-[0.6875rem]">{copy.exampleNote}</p>
              </section>
            </>
          ) : null}

          {draft.characterType === "fictional" ? (
            <section className="ai-creator-surface space-y-4 p-4 md:p-6">
              <h2 className="ai-creator-section-title">
                {de ? "Persona beschreiben" : "Describe persona"}
              </h2>
              <p className="ai-creator-muted text-[0.8125rem]">{copy.fictionalLegal}</p>
              <Field label={de ? "Look / Erscheinung" : "Look / appearance"}>
                <textarea
                  className={`${inputClass()} min-h-[120px] resize-y`}
                  value={draft.description}
                  onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={copy.personaPlaceholder}
                />
              </Field>
              <div className="rounded border p-4" style={{ borderColor: BORDER }}>
                <p className="ai-creator-muted mb-3 text-[0.8125rem]">{copy.refsFictionalHint}</p>
                <Link
                  href={preview ? "/dashboard?tool=image-gen" : "/dashboard/image-generator"}
                  className="ai-creator-btn-secondary inline-flex px-4 py-2 text-[0.6875rem] uppercase tracking-[0.08em]"
                >
                  {copy.refsFictional}
                </Link>
              </div>
            </section>
          ) : null}

          {draft.characterType ? (
            <section className="ai-creator-surface space-y-4 p-4 md:p-6">
              <h2 className="ai-creator-section-title">
                {de ? "Persona-Profil" : "Persona profile"}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={de ? "Creator-Name" : "Creator name"}>
                  <input
                    className={inputClass()}
                    value={draft.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Mia"
                  />
                </Field>
                <Field label="Trigger Word">
                  <input
                    className={inputClass()}
                    value={draft.triggerWord}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, triggerWord: e.target.value }))
                    }
                    placeholder="inflx_mia"
                  />
                </Field>
                <Field label={de ? "Nische" : "Niche"}>
                  <input
                    className={inputClass()}
                    value={draft.niche}
                    onChange={(e) => setDraft((prev) => ({ ...prev, niche: e.target.value }))}
                    placeholder="Beauty / Skincare"
                  />
                </Field>
                <Field label={de ? "Stil" : "Style"}>
                  <input
                    className={inputClass()}
                    value={draft.style}
                    onChange={(e) => setDraft((prev) => ({ ...prev, style: e.target.value }))}
                  />
                </Field>
                <Field label={de ? "Tonalität" : "Tone"}>
                  <input
                    className={inputClass()}
                    value={draft.tone}
                    onChange={(e) => setDraft((prev) => ({ ...prev, tone: e.target.value }))}
                  />
                </Field>
                <Field label={de ? "Plattformen" : "Platforms"}>
                  <input
                    className={inputClass()}
                    value={draft.platforms.join(", ")}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        platforms: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="Instagram, TikTok"
                  />
                </Field>
                <Field label={de ? "Zielgruppe" : "Target audience"} className="sm:col-span-2">
                  <input
                    className={inputClass()}
                    value={draft.targetAudience}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, targetAudience: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  className="ai-creator-btn-secondary px-4 py-2.5 text-[0.6875rem] uppercase tracking-[0.08em]"
                  disabled={saving || !draft.name.trim()}
                  onClick={() => void handleSave()}
                >
                  {copy.save}
                </button>
                <button
                  type="button"
                  className="ai-creator-btn-primary px-4 py-2.5 text-[0.6875rem] uppercase tracking-[0.08em]"
                  disabled={!canPrepareTraining || prepared}
                  onClick={handlePrepareTraining}
                >
                  {copy.prepare}
                </button>
              </div>
              {saveMessage ? (
                <p className="text-[0.8125rem]" style={{ color: ACCENT }}>
                  {saveMessage}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="ai-creator-status min-w-0">
          <p className="ai-creator-overline mb-4">{copy.previewLabel}</p>
          <div className="ai-creator-surface space-y-4 p-4 md:p-5">
            <span className={`ai-creator-badge ai-creator-badge--${statusBadge.tone}`}>
              {statusBadge.label}
            </span>
            {prepared ? (
              <p className="ai-creator-muted text-[0.8125rem]">{copy.prepareDone}</p>
            ) : null}
            {draft.loraUrl ? (
              <p className="ai-creator-muted text-[0.8125rem]">
                {copy.loraReady} <code>{draft.triggerWord}</code>
              </p>
            ) : (
              <p className="ai-creator-muted text-[0.8125rem]">{copy.loraPending}</p>
            )}
            <ul className="ai-creator-next-actions space-y-2">
              {[
                {
                  label: copy.nextImage,
                  href: preview ? "/dashboard?tool=image-gen" : "/dashboard/image-generator",
                },
                {
                  label: copy.nextUgc,
                  href: preview ? "/dashboard?tool=viral-hook" : "/dashboard/viral-hook",
                },
                {
                  label: copy.nextVideo,
                  href: preview ? "/dashboard?tool=img-to-video" : "/dashboard/szenen-generator",
                },
                { label: copy.nextCampaign, href: "/dashboard/design-preview?view=campaigns" },
                {
                  label: copy.nextGallery,
                  href: preview ? "/dashboard/design-preview?view=gallery" : "/dashboard/gallery",
                },
              ].map((action) => (
                <li key={action.label}>
                  <Link
                    href={action.href}
                    className={`ai-creator-next-link ${draft.loraUrl ? "" : "ai-creator-next-link--muted"}`}
                  >
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

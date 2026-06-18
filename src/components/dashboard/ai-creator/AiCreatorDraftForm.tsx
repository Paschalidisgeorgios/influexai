"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  CHARACTER_DESCRIPTION_MAX,
  CHARACTER_NAME_MAX,
  CHARACTER_TRIGGER_WORD_MAX,
} from "@/lib/ai-creator/characters-create.server";
import type { AiCreatorCharacterListItem } from "@/lib/ai-creator/characters-list.server";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPanel,
} from "@/components/dashboard/core/DashboardSurface";

type WizardPath = "self" | "fictional";

type SaveState = "idle" | "saving" | "success" | "error";

const SAFETY_LABELS: Record<WizardPath, string> = {
  self: "Ich bestätige, dass ich die Rechte und Zustimmung für alle später verwendeten Referenzen habe.",
  fictional:
    "Ich bestätige, dass diese Persona keine echte Person oder prominente/geschützte Person ohne Zustimmung nachahmt.",
};

const inputClassName =
  "w-full min-w-0 rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-white/24";
const inputStyle = {
  borderColor: "rgba(255,255,255,0.12)",
  color: DASHBOARD_TEXT,
};

type AiCreatorDraftFormProps = {
  wizardPath: WizardPath;
  onSaved: () => void | Promise<void>;
};

export function AiCreatorDraftForm({ wizardPath, onSaved }: AiCreatorDraftFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerWord, setTriggerWord] = useState("");
  const [personaNotes, setPersonaNotes] = useState("");
  const [safetyChecked, setSafetyChecked] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSave =
    name.trim().length > 0 &&
    name.trim().length <= CHARACTER_NAME_MAX &&
    safetyChecked &&
    saveState !== "saving";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) return;

    setSaveState("saving");
    setErrorMessage(null);

    const payload: Record<string, unknown> = {
      type: wizardPath,
      name: name.trim(),
      description: description.trim() || undefined,
      triggerWord: triggerWord.trim() || undefined,
      safetyAcknowledged: true,
    };

    if (wizardPath === "self") {
      payload.consentAccepted = true;
    }

    const notes = personaNotes.trim();
    if (notes) {
      payload.style = notes;
    }

    try {
      const res = await fetch("/api/ai-creator/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        character?: AiCreatorCharacterListItem;
      };

      if (!res.ok || !data.success) {
        setSaveState("error");
        setErrorMessage(
          data.error ??
            "Draft konnte nicht gespeichert werden. Bitte versuche es erneut."
        );
        return;
      }

      setSaveState("success");
      setName("");
      setDescription("");
      setTriggerWord("");
      setPersonaNotes("");
      setSafetyChecked(false);
      await onSaved();
    } catch {
      setSaveState("error");
      setErrorMessage(
        "Draft konnte nicht gespeichert werden. Bitte versuche es erneut."
      );
    }
  }

  const pathLabel = wizardPath === "self" ? "Eigener Character" : "Fiktive Persona";

  return (
    <DashboardPanel title="Character als Draft vorbereiten" className="mt-6">
      <p className="mb-5 text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
        Speichere Name und Persona-Briefing als Entwurf — ohne Upload oder Training. Referenzen
        und Workflows folgen in den verlinkten Produktionswegen.
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <div>
          <label htmlFor="draft-name" className="mb-1.5 block text-xs font-medium" style={{ color: DASHBOARD_TEXT }}>
            Name <span style={{ color: DASHBOARD_ACCENT }}>*</span>
          </label>
          <input
            id="draft-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (saveState === "success") setSaveState("idle");
            }}
            maxLength={CHARACTER_NAME_MAX}
            placeholder={wizardPath === "self" ? "z. B. Mein Creator-Profil" : "z. B. Nova — Brand Persona"}
            className={inputClassName}
            style={inputStyle}
            autoComplete="off"
          />
        </div>

        <div>
          <label
            htmlFor="draft-description"
            className="mb-1.5 block text-xs font-medium"
            style={{ color: DASHBOARD_TEXT }}
          >
            Beschreibung / Persona-Briefing
          </label>
          <textarea
            id="draft-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              if (saveState === "success") setSaveState("idle");
            }}
            maxLength={CHARACTER_DESCRIPTION_MAX}
            rows={4}
            placeholder="Rolle, Einsatzzweck, Tonalität — alles, was spätere Workflows orientieren soll."
            className={`${inputClassName} resize-y min-h-[96px]`}
            style={inputStyle}
          />
        </div>

        <div>
          <label
            htmlFor="draft-trigger"
            className="mb-1.5 block text-xs font-medium"
            style={{ color: DASHBOARD_TEXT }}
          >
            Trigger Word <span className="font-normal" style={{ color: DASHBOARD_MUTED }}>(optional)</span>
          </label>
          <input
            id="draft-trigger"
            type="text"
            value={triggerWord}
            onChange={(event) => setTriggerWord(event.target.value)}
            maxLength={CHARACTER_TRIGGER_WORD_MAX}
            placeholder="Einzigartiges Wort für spätere Prompts"
            className={inputClassName}
            style={inputStyle}
            autoComplete="off"
          />
        </div>

        <div>
          <label
            htmlFor="draft-persona-notes"
            className="mb-1.5 block text-xs font-medium"
            style={{ color: DASHBOARD_TEXT }}
          >
            Stil / Nische / Plattformen{" "}
            <span className="font-normal" style={{ color: DASHBOARD_MUTED }}>(optional, Freitext)</span>
          </label>
          <textarea
            id="draft-persona-notes"
            value={personaNotes}
            onChange={(event) => setPersonaNotes(event.target.value)}
            rows={2}
            placeholder="z. B. Lifestyle · Instagram/TikTok · warm, authentisch"
            className={`${inputClassName} resize-y min-h-[72px]`}
            style={inputStyle}
          />
          <p className="mt-1.5 text-[11px]" style={{ color: DASHBOARD_MUTED }}>
            Wird in der Beschreibung gespeichert — keine separaten Datenbankfelder.
          </p>
        </div>

        <label className="flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <input
            type="checkbox"
            checked={safetyChecked}
            onChange={(event) => {
              setSafetyChecked(event.target.checked);
              if (saveState === "success") setSaveState("idle");
            }}
            className="mt-0.5 h-4 w-4 shrink-0 accent-lime-400"
          />
          <span className="text-xs leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
            {SAFETY_LABELS[wizardPath]}
          </span>
        </label>

        {saveState === "success" ? (
          <div
            className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "rgba(52,211,153,0.25)",
              background: "rgba(52,211,153,0.08)",
              color: "#34d399",
            }}
            role="status"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Draft gespeichert. Du kannst später Referenzen ergänzen und mit einem Workflow
              weiterarbeiten.
            </span>
          </div>
        ) : null}

        {saveState === "error" && errorMessage ? (
          <p className="text-sm" style={{ color: "#f87171" }} role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          style={{ background: DASHBOARD_ACCENT, color: "#080808" }}
        >
          {saveState === "saving" ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden />
              Speichern…
            </>
          ) : (
            "Draft speichern"
          )}
        </button>

        <p className="text-[11px] leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          {pathLabel} · Entwurf · Kein Upload · Kein Training · Keine Credits in dieser Phase
        </p>
      </form>
    </DashboardPanel>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { ProtectedGeneratedImage } from "@/components/generated/ProtectedGeneratedImage";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import {
  DEFAULT_IMAGE_PLATFORM_ID,
  DEFAULT_IMAGE_STYLE_ID,
  IMAGE_STYLE_PRESETS,
  PLATFORM_FORMATS,
  type ImagePlatformId,
  type ImageStyleId,
} from "@/lib/ai/imageStylePresets";
import {
  handleKiInfluencerApiError,
  kiInfluencerUserMessage,
  type KiInfluencerApiErrorBody,
} from "@/lib/ki-influencer-client-errors";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { calcLoraCredits } from "@/lib/lora-credits";
import {
  KI_INFLUENCER_LORA_STEPS,
  KI_INFLUENCER_TRAINING_SET_CREDITS,
  KI_INFLUENCER_TRAINING_SET_SIZE,
  KI_INFLUENCER_WIZARD_STEPS,
} from "@/lib/ki-influencer-config";
import { LORA_GENERATION_CREDIT, LORA_MAX_FILE_BYTES, LORA_MIN_IMAGES } from "@/lib/lora-config";

type WizardStep = 0 | 1 | 2 | 3;
type PathMode = null | "generated" | "uploaded";

const UPLOAD_MAX_PHOTOS = 20;
const ALLOWED_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const UPLOAD_TIPS = [
  "Nur EINE Person auf allen Fotos",
  "Verschiedene Blickwinkel und Gesichtsausdrücke",
  "Gutes Licht, scharfes Gesicht",
  "Keine Sonnenbrillen oder verdeckte Gesichter",
] as const;

const DESCRIPTION_EXAMPLES = [
  "28-jährige Fitness-Influencerin, lange rotblonde Haare, grüne Augen, sportlich-natürlicher Look, Nische: Fitness & Ernährung",
  "32-jähriger Tech-Creator, kurze dunkle Haare, Brille, moderner Casual-Style, Nische: Gadgets & KI",
  "25-jährige Beauty-Influencerin, lange braune Haare, eleganter Look, Nische: Mode & Make-up",
] as const;

const DESCRIPTION_EXAMPLE_LABELS = [
  "Fitness-Influencerin",
  "Tech-Creator",
  "Beauty & Fashion",
] as const;

const SCENE_EXAMPLES = [
  "Beim Frühstück mit Smoothie-Bowl",
  "Beim Workout im Fitnessstudio",
  "Golden Hour am Strand",
] as const;

const LEARN_STATUS_TOOLTIP =
  "Technisch trainieren wir ein eigenes KI-Modell nur für deinen Charakter. Dadurch sieht er auf jedem Bild gleich aus.";

const chipClass = (active: boolean) =>
  active
    ? "border-[#B4FF00] bg-[#B4FF00]/12 text-[#B4FF00]"
    : "border-white/12 text-[#F0EFE8]/65 hover:border-white/20";

function InfoTip({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="ml-1.5 inline-flex h-4 w-4 cursor-help items-center justify-center text-[0.7rem] leading-none text-white/45"
      aria-label={text}
    >
      ⓘ
    </span>
  );
}

export default function KiInfluencerPage() {
  const [pathMode, setPathMode] = useState<PathMode>(null);
  const [step, setStep] = useState<WizardStep>(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [castingImageUrl, setCastingImageUrl] = useState<string | null>(null);
  const [castingConfirmed, setCastingConfirmed] = useState(false);

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [uploadConsent, setUploadConsent] = useState(false);
  const [uploadRightsConsent, setUploadRightsConsent] = useState(false);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const uploadFileRef = useRef<HTMLInputElement>(null);

  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingSetRunning, setTrainingSetRunning] = useState(false);

  const [loraProgress, setLoraProgress] = useState(0);
  const [loraLogs, setLoraLogs] = useState<string[]>([]);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [characterReady, setCharacterReady] = useState(false);

  const [contentPrompt, setContentPrompt] = useState("");
  const [styleId, setStyleId] = useState<ImageStyleId>(DEFAULT_IMAGE_STYLE_ID);
  const [platform, setPlatform] = useState<ImagePlatformId>(
    DEFAULT_IMAGE_PLATFORM_ID
  );
  const [contentResultUrl, setContentResultUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loraTrainCredits = calcLoraCredits(KI_INFLUENCER_LORA_STEPS);

  const addUploadFiles = (incoming: FileList | File[]) => {
    const next: File[] = [];
    for (const file of Array.from(incoming)) {
      if (!ALLOWED_UPLOAD_TYPES.has(file.type)) continue;
      if (file.size > LORA_MAX_FILE_BYTES) continue;
      next.push(file);
    }
    if (next.length === 0) return;
    setUploadFiles((prev) => {
      const merged = [...prev, ...next].slice(0, UPLOAD_MAX_PHOTOS);
      setUploadPreviews((old) => {
        old.forEach((url) => URL.revokeObjectURL(url));
        return merged.map((f) => URL.createObjectURL(f));
      });
      return merged;
    });
  };

  const submitUploadedPhotos = async () => {
    if (!name.trim() || uploadFiles.length < LORA_MIN_IMAGES) return;
    if (!uploadConsent || !uploadRightsConsent) {
      setError("Bitte bestätige beide Checkboxen, bevor es weitergeht.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      for (const file of uploadFiles) {
        formData.append("images", file);
      }
      formData.append("consentAccepted", "true");

      const uploadRes = await fetch("/api/lora/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = (await uploadRes.json()) as {
        error?: string;
        sessionId?: string;
        zipUrl?: string;
        thumbnailPath?: string;
        imageCount?: number;
      };
      if (!uploadRes.ok) {
        throw new Error(uploadData.error ?? "Upload fehlgeschlagen.");
      }

      const createRes = await fetch("/api/ki-influencer/create-from-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sessionId: uploadData.sessionId,
          zipUrl: uploadData.zipUrl,
          thumbnailPath: uploadData.thumbnailPath,
          imageCount: uploadData.imageCount,
        }),
      });
      const createData = (await createRes.json()) as KiInfluencerApiErrorBody & {
        characterId?: string;
      };
      if (!createRes.ok) {
        throw new Error(kiInfluencerUserMessage(createData));
      }
      if (createData.characterId) {
        setCharacterId(createData.characterId);
        setStep(2);
      }
    } catch (err) {
      setError(sanitizeUserMessage(err instanceof Error ? err.message : "Fehler"));
    } finally {
      setLoading(false);
    }
  };

  const pollTrainingStatus = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/ki-influencer/status/${id}`);
        const data = await res.json();
        if (typeof data.progress === "number") setLoraProgress(data.progress);
        if (Array.isArray(data.logs)) setLoraLogs(data.logs);
        if (data.status === "ready") {
          if (pollRef.current) clearInterval(pollRef.current);
          setCharacterReady(true);
          setLoading(false);
          setStep(3);
        }
        if (data.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setError(data.errorMessage ?? "Das hat leider nicht geklappt. Bitte erneut versuchen.");
          setLoading(false);
        }
      } catch {
        /* keep polling */
      }
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const runCasting = async (confirm = false) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ki-influencer/casting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: characterId ?? undefined,
          name,
          description,
          confirm,
        }),
      });
      const data = (await res.json()) as KiInfluencerApiErrorBody & {
        characterId?: string;
        imageUrl?: string;
      };
      if (
        !confirm &&
        handleKiInfluencerApiError(
          res.status,
          data,
          IMAGE_GEN_CREDITS.standard
        )
      ) {
        return;
      }
      if (!res.ok) throw new Error(kiInfluencerUserMessage(data));
      if (data.characterId) setCharacterId(data.characterId);
      if (confirm) {
        setCastingConfirmed(true);
        setStep(1);
      } else if (data.imageUrl) {
        setCastingImageUrl(data.imageUrl);
      }
      window.dispatchEvent(new Event("credits-updated"));
    } catch (err) {
      setError(sanitizeUserMessage(err instanceof Error ? err.message : "Fehler"));
    } finally {
      setLoading(false);
    }
  };

  const runTrainingSet = async () => {
    if (!characterId) return;
    setError(null);
    setTrainingSetRunning(true);
    setTrainingProgress(0);

    try {
      const startRes = await fetch("/api/ki-influencer/training-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, start: true }),
      });
      const startData = (await startRes.json()) as KiInfluencerApiErrorBody & {
        characterSetId?: string;
      };
      if (
        handleKiInfluencerApiError(
          startRes.status,
          startData,
          KI_INFLUENCER_TRAINING_SET_CREDITS
        )
      ) {
        return;
      }
      if (!startRes.ok) {
        throw new Error(kiInfluencerUserMessage(startData));
      }
      window.dispatchEvent(new Event("credits-updated"));

      for (let i = 0; i < KI_INFLUENCER_TRAINING_SET_SIZE; i++) {
        const res = await fetch("/api/ki-influencer/training-set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId, index: i }),
        });
        const data = (await res.json()) as KiInfluencerApiErrorBody;
        if (!res.ok) {
          throw new Error(kiInfluencerUserMessage(data));
        }
        setTrainingProgress(i + 1);
      }
      setStep(2);
    } catch (err) {
      setError(sanitizeUserMessage(err instanceof Error ? err.message : "Fehler"));
    } finally {
      setTrainingSetRunning(false);
    }
  };

  const runLoraTraining = async () => {
    if (!characterId) return;
    if (!consentAccepted) {
      setError("Bitte bestätige die Einwilligung, bevor es weitergeht.");
      return;
    }
    setError(null);
    setLoading(true);
    setLoraProgress(0);
    try {
      const res = await fetch("/api/ki-influencer/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, consentAccepted: true }),
      });
      const data = (await res.json()) as KiInfluencerApiErrorBody & { loraId?: string };
      if (
        handleKiInfluencerApiError(res.status, data, loraTrainCredits)
      ) {
        return;
      }
      if (!res.ok) throw new Error(kiInfluencerUserMessage(data));
      window.dispatchEvent(new Event("credits-updated"));
      pollTrainingStatus(characterId);
    } catch (err) {
      setError(sanitizeUserMessage(err instanceof Error ? err.message : "Fehler"));
      setLoading(false);
    }
  };

  const runContentGenerate = async () => {
    if (!characterId || !contentPrompt.trim()) return;
    setError(null);
    setLoading(true);
    setContentResultUrl(null);
    try {
      const res = await fetch("/api/ki-influencer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          prompt: contentPrompt,
          styleId,
          platform,
        }),
      });
      const data = (await res.json()) as KiInfluencerApiErrorBody & {
        imageUrl?: string;
      };
      if (
        handleKiInfluencerApiError(res.status, data, LORA_GENERATION_CREDIT)
      ) {
        return;
      }
      if (!res.ok) throw new Error(kiInfluencerUserMessage(data));
      if (data.imageUrl) setContentResultUrl(data.imageUrl);
      window.dispatchEvent(new Event("credits-updated"));
    } catch (err) {
      setError(sanitizeUserMessage(err instanceof Error ? err.message : "Fehler"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <UserRound size={32} color="#B4FF00" strokeWidth={2.2} />
          <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(2rem,4vw,3rem)] tracking-wide text-[#F0EFE8]">
            KI-Influencer erstellen
          </h1>
        </div>
        <p className="text-[0.95rem] leading-relaxed text-[rgba(255,255,255,0.65)]">
          In 4 Schritten zu deinem eigenen KI-Influencer — einmal einrichten, danach
          unbegrenzt Content erstellen.
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-[#ff6b7a]">{error}</p>}

      {pathMode === null && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPathMode("generated")}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#060608] p-6 text-left transition-colors hover:border-[#B4FF00]/40"
          >
            <span className="text-lg font-semibold text-[#F0EFE8]">
              Neuen Charakter erstellen
            </span>
            <span className="text-sm text-[rgba(255,255,255,0.65)]">
              Wir erfinden gemeinsam eine virtuelle Person
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPathMode("uploaded")}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#060608] p-6 text-left transition-colors hover:border-[#B4FF00]/40"
          >
            <span className="text-lg font-semibold text-[#F0EFE8]">
              Eigene Fotos verwenden
            </span>
            <span className="text-sm text-[rgba(255,255,255,0.65)]">
              Du hast schon Fotos einer Person (z.B. von dir)? Lade sie hoch.
            </span>
          </button>
        </div>
      )}

      {pathMode === "uploaded" && step < 2 && (
        <div className="flex flex-col gap-5 rounded-2xl border border-white/8 bg-[#060608] p-6">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#F0EFE8]">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Melodia"
              className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-[#F0EFE8] outline-none focus:border-[#B4FF00]/40"
            />
          </label>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[rgba(255,255,255,0.65)]">
            {UPLOAD_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <div
            role="button"
            tabIndex={0}
            onDragOver={(e) => {
              e.preventDefault();
              setUploadDragOver(true);
            }}
            onDragLeave={() => setUploadDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setUploadDragOver(false);
              if (e.dataTransfer.files.length) addUploadFiles(e.dataTransfer.files);
            }}
            onClick={() => uploadFileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") uploadFileRef.current?.click();
            }}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
              uploadDragOver
                ? "border-[#B4FF00]/50 bg-[#B4FF00]/5"
                : "border-white/15 bg-white/[0.02]"
            }`}
          >
            <p className="text-sm font-semibold text-[#F0EFE8]">
              Fotos hierher ziehen oder klicken
            </p>
            <p className="mt-1 text-xs text-white/45">JPG, PNG, WEBP · max. 10 MB pro Foto</p>
            <input
              ref={uploadFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addUploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
          {uploadPreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {uploadPreviews.map((src) => (
                <div
                  key={src}
                  className="relative aspect-square overflow-hidden rounded-lg border border-white/10"
                >
                  <Image src={src} alt="" fill unoptimized className="object-cover" />
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-[#B4FF00]">
            {uploadFiles.length} von mindestens {LORA_MIN_IMAGES} Fotos
          </p>
          <label className="flex items-start gap-3 text-sm text-[rgba(255,255,255,0.75)]">
            <input
              type="checkbox"
              checked={uploadRightsConsent}
              onChange={(e) => setUploadRightsConsent(e.target.checked)}
              className="mt-1"
            />
            <span>
              Ich bestätige, dass ich alle Rechte an diesen Fotos habe und die abgebildete
              Person (falls nicht ich selbst) eingewilligt hat.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-[rgba(255,255,255,0.75)]">
            <input
              type="checkbox"
              checked={uploadConsent}
              onChange={(e) => setUploadConsent(e.target.checked)}
              className="mt-1"
            />
            <span>Fotos werden nur für dein Training verwendet.</span>
          </label>
          <button
            type="button"
            disabled={
              loading ||
              !name.trim() ||
              uploadFiles.length < LORA_MIN_IMAGES ||
              !uploadConsent ||
              !uploadRightsConsent
            }
            onClick={() => void submitUploadedPhotos()}
            className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608] disabled:opacity-60"
          >
            {loading ? "Lade hoch…" : "Weiter zum Gesicht lernen"}
          </button>
        </div>
      )}

      {pathMode !== null && (pathMode === "generated" || step >= 2) && (
        <>
      <ol className="mb-8 flex flex-wrap gap-2">
        {KI_INFLUENCER_WIZARD_STEPS.map((s, i) => {
          const active = step === i;
          const done = step > i;
          return (
            <li
              key={s.id}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold sm:text-sm ${
                active
                  ? "border-[#B4FF00] bg-[#B4FF00]/12 text-[#B4FF00]"
                  : done
                    ? "border-[#B4FF00]/40 text-[#B4FF00]/80"
                    : "border-white/10 text-[rgba(255,255,255,0.45)]"
              }`}
            >
              {i + 1}. {s.label}
            </li>
          );
        })}
      </ol>

      {step === 0 && pathMode === "generated" && (
        <div className="flex flex-col gap-5 rounded-2xl border border-white/8 bg-[#060608] p-6">
          <h2 className="text-lg font-semibold text-[#F0EFE8]">
            Erstelle deine virtuelle Person
          </h2>
          <p className="text-sm text-[rgba(255,255,255,0.65)]">
            Beschreibe, wie dein KI-Influencer aussehen soll — wir erstellen daraus ein
            erstes Foto. Gefällt es dir nicht, kannst du es neu erstellen.
          </p>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#F0EFE8]">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Melodia"
              className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-[#F0EFE8] outline-none focus:border-[#B4FF00]/40"
            />
          </label>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#F0EFE8]">
              So soll dein Charakter aussehen
            </span>
            <div className="flex flex-wrap gap-2">
              {DESCRIPTION_EXAMPLES.map((example, index) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setDescription(example)}
                  className="rounded-lg border border-white/12 px-3 py-2 text-xs font-medium text-[#F0EFE8]/75 transition-colors hover:border-[#B4FF00]/35 hover:text-[#F0EFE8]"
                >
                  {DESCRIPTION_EXAMPLE_LABELS[index]}
                </button>
              ))}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Alter, Haare, Augen, Stil, Themengebiet..."
              className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-[#F0EFE8] outline-none focus:border-[#B4FF00]/40"
            />
          </div>

          {castingImageUrl && (
            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl border border-white/10">
              <Image
                src={castingImageUrl}
                alt="Vorschau deines Charakters"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading || !name.trim() || description.length < 10}
                onClick={() => runCasting(false)}
                className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608] disabled:opacity-60"
              >
                {loading && !castingConfirmed
                  ? "Erstelle Foto…"
                  : castingImageUrl
                    ? `Neu erstellen (${IMAGE_GEN_CREDITS.standard} Credits)`
                    : `Foto erstellen (${IMAGE_GEN_CREDITS.standard} Credits)`}
              </button>
              {castingImageUrl && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => runCasting(true)}
                  className="rounded-xl border border-[#B4FF00]/50 px-5 py-3 font-semibold text-[#B4FF00] disabled:opacity-60"
                >
                  Passt so, weiter
                </button>
              )}
            </div>
            <p className="text-xs text-[rgba(255,255,255,0.45)]">
              Dauert ca. 30 Sekunden · Neu erstellen jederzeit möglich
            </p>
          </div>
        </div>
      )}

      {step === 1 && pathMode === "generated" && (
        <div className="flex flex-col gap-5 rounded-2xl border border-white/8 bg-[#060608] p-6">
          <p className="text-sm text-[rgba(255,255,255,0.65)]">
            Wir erstellen jetzt 20 Fotos deines Charakters aus verschiedenen Blickwinkeln.
            Die braucht dein Charakter, um sein Gesicht zu lernen.
          </p>
          <p className="text-xs text-[rgba(255,255,255,0.45)]">
            {KI_INFLUENCER_TRAINING_SET_CREDITS} Credits · ca. 3–5 Minuten
          </p>
          {castingImageUrl && (
            <div className="relative mx-auto aspect-square w-32 overflow-hidden rounded-lg border border-white/10">
              <Image src={castingImageUrl} alt="" fill unoptimized className="object-cover" />
            </div>
          )}
          {trainingSetRunning && (
            <div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-[#B4FF00] transition-all"
                  style={{
                    width: `${(trainingProgress / KI_INFLUENCER_TRAINING_SET_SIZE) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-[rgba(255,255,255,0.65)]">
                Foto {trainingProgress} von {KI_INFLUENCER_TRAINING_SET_SIZE}…
              </p>
            </div>
          )}
          <button
            type="button"
            disabled={trainingSetRunning || !characterId}
            onClick={runTrainingSet}
            className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608] disabled:opacity-60"
          >
            {trainingSetRunning
              ? "Fotos werden erstellt…"
              : `20 Fotos erstellen (${KI_INFLUENCER_TRAINING_SET_CREDITS} Credits)`}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5 rounded-2xl border border-white/8 bg-[#060608] p-6">
          <p className="text-sm text-[rgba(255,255,255,0.65)]">
            Dein Charakter lernt jetzt sein eigenes Gesicht. Das passiert automatisch — du
            kannst die Seite verlassen und später wiederkommen.
          </p>
          <p className="text-xs text-[rgba(255,255,255,0.45)]">
            ca. {loraTrainCredits} Credits · ca. 10–15 Minuten
          </p>
          <label className="flex items-start gap-3 text-sm text-[rgba(255,255,255,0.75)]">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-1"
            />
            <span>
              Ich willige ein, dass die erstellten Fotos verarbeitet werden, damit mein
              Charakter sein Gesicht lernt.
            </span>
          </label>
          {(loading || loraProgress > 0 || characterReady) && (
            <div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-[#B4FF00] transition-all"
                  style={{ width: `${characterReady ? 100 : loraProgress}%` }}
                />
              </div>
              <p className="text-sm text-[rgba(255,255,255,0.65)]">
                {characterReady ? (
                  "Fertig! Dein Charakter ist bereit."
                ) : (
                  <>
                    Lernt gerade…
                    <InfoTip text={LEARN_STATUS_TOOLTIP} />
                  </>
                )}
              </p>
            </div>
          )}
          <button
            type="button"
            disabled={loading || characterReady}
            onClick={runLoraTraining}
            className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608] disabled:opacity-60"
          >
            {loading ? "Lernt gerade…" : "Gesicht lernen lassen"}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5 rounded-2xl border border-white/8 bg-[#060608] p-6">
          <p className="text-sm text-[rgba(255,255,255,0.65)]">
            Beschreibe eine Szene — dein Charakter erscheint darin. Immer mit demselben
            Gesicht.
          </p>
          {name && (
            <p className="text-sm text-[#B4FF00]">{name} ist bereit — leg los!</p>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold text-[#F0EFE8]">Stil</p>
            <div className="flex flex-wrap gap-2">
              {IMAGE_STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setStyleId(preset.id)}
                  className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left ${chipClass(styleId === preset.id)}`}
                >
                  <span className="text-sm font-semibold">{preset.labelDE}</span>
                  <span className="text-[0.7rem] font-normal opacity-70">
                    {preset.subtitleDE}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-[#F0EFE8]">Format</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setPlatform(fmt.id)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${chipClass(platform === fmt.id)}`}
                >
                  {fmt.labelDE}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#F0EFE8]">Szene beschreiben</span>
            <div className="flex flex-wrap gap-2">
              {SCENE_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setContentPrompt(example)}
                  className="rounded-lg border border-white/12 px-3 py-2 text-xs font-medium text-[#F0EFE8]/75 transition-colors hover:border-[#B4FF00]/35 hover:text-[#F0EFE8]"
                >
                  {example}
                </button>
              ))}
            </div>
            <textarea
              value={contentPrompt}
              onChange={(e) => setContentPrompt(e.target.value)}
              rows={3}
              placeholder="z.B. im Gym beim Training, lächelt in die Kamera"
              className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-[#F0EFE8] outline-none focus:border-[#B4FF00]/40"
            />
          </div>

          <button
            type="button"
            disabled={loading || !contentPrompt.trim()}
            onClick={runContentGenerate}
            className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608] disabled:opacity-60"
          >
            {loading
              ? "Erstelle Bild…"
              : `Bild erstellen (${LORA_GENERATION_CREDIT} Credits)`}
          </button>

          {contentResultUrl && (
            <ProtectedGeneratedImage
              src={contentResultUrl}
              alt="KI-Influencer Content"
              locked={false}
              aspectClassName="min-h-[360px] w-full max-w-lg mx-auto"
            />
          )}
          <AiOutputDisclaimer />
        </div>
      )}
        </>
      )}
    </div>
  );
}

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
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { calcLoraCredits } from "@/lib/lora-credits";
import {
  KI_INFLUENCER_LORA_STEPS,
  KI_INFLUENCER_TRAINING_SET_CREDITS,
  KI_INFLUENCER_TRAINING_SET_SIZE,
  KI_INFLUENCER_WIZARD_STEPS,
} from "@/lib/ki-influencer-config";
import { LORA_GENERATION_CREDIT } from "@/lib/lora-config";

type WizardStep = 0 | 1 | 2 | 3;

const chipClass = (active: boolean) =>
  active
    ? "border-[#B4FF00] bg-[#B4FF00]/12 text-[#B4FF00]"
    : "border-white/12 text-[#F0EFE8]/65 hover:border-white/20";

export default function KiInfluencerPage() {
  const [step, setStep] = useState<WizardStep>(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [castingImageUrl, setCastingImageUrl] = useState<string | null>(null);
  const [castingConfirmed, setCastingConfirmed] = useState(false);

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
          setError(data.errorMessage ?? "Training fehlgeschlagen.");
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
      const data = await res.json();
      if (
        !confirm &&
        handleApiInsufficientCredits(
          res.status,
          data as { error?: string; credits?: number },
          IMAGE_GEN_CREDITS.standard
        )
      ) {
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Casting fehlgeschlagen.");
      setCharacterId(data.characterId);
      if (confirm) {
        setCastingConfirmed(true);
        setStep(1);
      } else {
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
      const startData = await startRes.json();
      if (
        handleApiInsufficientCredits(
          startRes.status,
          startData as { error?: string; credits?: number },
          KI_INFLUENCER_TRAINING_SET_CREDITS
        )
      ) {
        return;
      }
      if (!startRes.ok) {
        throw new Error(startData.error ?? "Trainingsset konnte nicht gestartet werden.");
      }
      window.dispatchEvent(new Event("credits-updated"));

      for (let i = 0; i < KI_INFLUENCER_TRAINING_SET_SIZE; i++) {
        const res = await fetch("/api/ki-influencer/training-set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId, index: i }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? `Variante ${i + 1} fehlgeschlagen.`);
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
      setError("Bitte bestätige die Einwilligung vor dem Training.");
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
      const data = await res.json();
      if (
        handleApiInsufficientCredits(
          res.status,
          data as { error?: string; credits?: number },
          loraTrainCredits
        )
      ) {
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Training-Start fehlgeschlagen.");
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
      const data = await res.json();
      if (
        handleApiInsufficientCredits(
          res.status,
          data as { error?: string; credits?: number },
          LORA_GENERATION_CREDIT
        )
      ) {
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Generierung fehlgeschlagen.");
      setContentResultUrl(data.imageUrl);
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
          Charakter designen → Trainingsset → LoRA-Training → konsistente Bilder
        </p>
      </div>

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

      {error && <p className="mb-4 text-sm text-[#ff6b7a]">{error}</p>}

      {step === 0 && (
        <div className="flex flex-col gap-5 rounded-2xl border border-white/8 bg-[#060608] p-6">
          <h2 className="text-lg font-semibold text-[#F0EFE8]">A — Charakter designen</h2>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#F0EFE8]">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Luna"
              className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-[#F0EFE8] outline-none focus:border-[#B4FF00]/40"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#F0EFE8]">
              Beschreibung (18+, Look, Stil, Nische)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="z.B. 28-jährige Fitness-Coachin, athletisch, warmherzig, natürliches Makeup…"
              className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-[#F0EFE8] outline-none focus:border-[#B4FF00]/40"
            />
          </label>

          {castingImageUrl && (
            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl border border-white/10">
              <Image
                src={castingImageUrl}
                alt="Casting"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !name.trim() || description.length < 10}
              onClick={() => runCasting(false)}
              className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608] disabled:opacity-60"
            >
              {loading && !castingConfirmed
                ? "Generiere…"
                : castingImageUrl
                  ? `Neu generieren (${IMAGE_GEN_CREDITS.standard} Credits)`
                  : `Casting generieren (${IMAGE_GEN_CREDITS.standard} Credits)`}
            </button>
            {castingImageUrl && (
              <button
                type="button"
                disabled={loading}
                onClick={() => runCasting(true)}
                className="rounded-xl border border-[#B4FF00]/50 px-5 py-3 font-semibold text-[#B4FF00] disabled:opacity-60"
              >
                Charakter bestätigen
              </button>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5 rounded-2xl border border-white/8 bg-[#060608] p-6">
          <h2 className="text-lg font-semibold text-[#F0EFE8]">B — Trainingsset erstellen</h2>
          <p className="text-sm text-[rgba(255,255,255,0.65)]">
            20 Varianten aus dem Casting-Bild (Blickwinkel, Ausdruck, Licht, Outfits).
            Paketpreis: {KI_INFLUENCER_TRAINING_SET_CREDITS} Credits.
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
                {trainingProgress}/{KI_INFLUENCER_TRAINING_SET_SIZE} Varianten…
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
              ? "Trainingsset wird erstellt…"
              : `20 Varianten generieren (${KI_INFLUENCER_TRAINING_SET_CREDITS} Credits)`}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5 rounded-2xl border border-white/8 bg-[#060608] p-6">
          <h2 className="text-lg font-semibold text-[#F0EFE8]">C — Training starten</h2>
          <p className="text-sm text-[rgba(255,255,255,0.65)]">
            LoRA-Training mit 20 Bildern (~10–15 Min). Kosten: ca. {loraTrainCredits}{" "}
            Credits.
          </p>
          <label className="flex items-start gap-3 text-sm text-[rgba(255,255,255,0.75)]">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-1"
            />
            <span>
              Ich willige ein, dass meine hochgeladenen/generierten Bilder für das
              KI-Training verarbeitet werden (synthetischer Charakter).
            </span>
          </label>
          {(loading || loraProgress > 0) && (
            <div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-[#B4FF00] transition-all"
                  style={{ width: `${loraProgress}%` }}
                />
              </div>
              <p className="text-sm text-[rgba(255,255,255,0.65)]">
                Training… {loraProgress}%
              </p>
              {loraLogs.length > 0 && (
                <pre className="mt-2 max-h-24 overflow-auto text-xs text-white/40">
                  {loraLogs.join("\n")}
                </pre>
              )}
            </div>
          )}
          <button
            type="button"
            disabled={loading || characterReady}
            onClick={runLoraTraining}
            className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608] disabled:opacity-60"
          >
            {loading ? "Training läuft…" : `LoRA-Training starten (~${loraTrainCredits} Credits)`}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5 rounded-2xl border border-white/8 bg-[#060608] p-6">
          <h2 className="text-lg font-semibold text-[#F0EFE8]">D — Content erstellen</h2>
          <p className="text-sm text-[#B4FF00]">
            {name} ist trainiert — generiere konsistente Bilder mit deinem LoRA.
          </p>

          <div>
            <p className="mb-2 text-sm font-semibold text-[#F0EFE8]">Stil</p>
            <div className="flex flex-wrap gap-2">
              {IMAGE_STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setStyleId(preset.id)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${chipClass(styleId === preset.id)}`}
                >
                  {preset.labelDE}
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

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#F0EFE8]">Szene beschreiben</span>
            <textarea
              value={contentPrompt}
              onChange={(e) => setContentPrompt(e.target.value)}
              rows={3}
              placeholder="z.B. im Fitnessstudio, motivierender Blick in die Kamera…"
              className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-[#F0EFE8] outline-none focus:border-[#B4FF00]/40"
            />
          </label>

          <button
            type="button"
            disabled={loading || !contentPrompt.trim()}
            onClick={runContentGenerate}
            className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608] disabled:opacity-60"
          >
            {loading
              ? "Generiere…"
              : `Bild generieren (${LORA_GENERATION_CREDIT} Credits)`}
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
    </div>
  );
}

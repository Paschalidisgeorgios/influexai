"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BrainCircuit, UserRound } from "lucide-react";
import { KiInfluencerTrainingVisualizer } from "@/components/ki-influencer/KiInfluencerTrainingVisualizer";
import { ProtectedGeneratedImage } from "@/components/generated/ProtectedGeneratedImage";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { LoadingButton } from "@/components/ui/LoadingButton";
import {
  DEFAULT_IMAGE_PLATFORM_ID,
  DEFAULT_IMAGE_STYLE_ID,
  IMAGE_STYLE_PRESETS,
  PLATFORM_FORMATS,
  type ImagePlatformId,
  type ImageStyleId,
} from "@/lib/ai/imageStylePresets";
import {
  apiBodyToErrorMessage,
  handleKiInfluencerApiError,
  isKiInfluencerApiFailure,
  KI_INFLUENCER_ERROR_MESSAGES,
  parseKiInfluencerJsonResponse,
  resolveWizardDisplayError,
  toErrorMessage,
  type KiInfluencerApiErrorBody,
} from "@/lib/ki-influencer-client-errors";
import type {
  CreateFromUploadResponse,
  FinalizeUploadResponse,
  TrainingSetImageResponse,
  TrainingSetStartResponse,
  UploadPhotoResponse,
} from "@/lib/ki-influencer-types";
import {
  isCreateFromUploadResponse,
  isTrainingSetImageResponse,
  isTrainingSetStartResponse,
} from "@/lib/ki-influencer-types";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { calcLoraCredits } from "@/lib/lora-credits";
import {
  KI_INFLUENCER_LORA_STEPS,
  KI_INFLUENCER_TRAINING_SET_CREDITS,
  KI_INFLUENCER_TRAINING_SET_SIZE,
  KI_INFLUENCER_WIZARD_STEPS,
} from "@/lib/ki-influencer-config";
import { LORA_GENERATION_CREDIT, LORA_MAX_FILE_BYTES, LORA_MIN_IMAGES } from "@/lib/lora-config";
import { getSafeSearchParam } from "@/lib/safe-url-param";

type WizardStep = 0 | 1 | 2 | 3;
type PathMode = null | "generated" | "uploaded";
type WizardBusyAction =
  | "upload"
  | "casting"
  | "castingConfirm"
  | "loraTrain"
  | "content";

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

const chipClass = (active: boolean) =>
  active
    ? "border-[#B4FF00] bg-[#B4FF00]/12 text-[#B4FF00]"
    : "border-white/12 text-[#F0EFE8]/65 hover:border-white/20";

function parseUrlWizardStep(raw: string | null): WizardStep {
  const stepFromUrl = Number(raw) || 1;
  return Math.min(3, Math.max(0, stepFromUrl - 1)) as WizardStep;
}

function KiInfluencerPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlStep = searchParams.get("step");
  const urlId = searchParams.get("id");
  const urlName = getSafeSearchParam(searchParams, "name");
  const hasUrlWizardState = Boolean(urlStep || urlId);

  const [pathMode, setPathMode] = useState<PathMode>(
    hasUrlWizardState ? "generated" : null
  );
  const [step, setStep] = useState<WizardStep>(() => parseUrlWizardStep(urlStep));
  const [name, setName] = useState(urlName);
  const [description, setDescription] = useState("");
  const [characterId, setCharacterId] = useState<string | null>(urlId);
  const [castingImageUrl, setCastingImageUrl] = useState<string | null>(null);

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [uploadConsent, setUploadConsent] = useState(false);
  const [uploadRightsConsent, setUploadRightsConsent] = useState(false);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const uploadFileRef = useRef<HTMLInputElement>(null);

  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingSetRunning, setTrainingSetRunning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [loraProgress, setLoraProgress] = useState(0);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [characterReady, setCharacterReady] = useState(false);

  const [contentPrompt, setContentPrompt] = useState("");
  const [styleId, setStyleId] = useState<ImageStyleId>(DEFAULT_IMAGE_STYLE_ID);
  const [platform, setPlatform] = useState<ImagePlatformId>(
    DEFAULT_IMAGE_PLATFORM_ID
  );
  const [contentResultUrl, setContentResultUrl] = useState<string | null>(null);

  const [busyAction, setBusyAction] = useState<WizardBusyAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schemaReady, setSchemaReady] = useState(false);
  const schemaReadyRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loraTrainCredits = calcLoraCredits(KI_INFLUENCER_LORA_STEPS);

  const setWizardError = useCallback((message: string | null) => {
    if (!message) {
      setError(null);
      return;
    }
    setError(resolveWizardDisplayError(message, schemaReadyRef.current));
  }, []);

  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam) setStep(parseUrlWizardStep(stepParam));
    const idParam = searchParams.get("id");
    if (idParam) setCharacterId(idParam);
    const nameParam = getSafeSearchParam(searchParams, "name");
    if (nameParam) setName(nameParam);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/ki-influencer/schema-status");
        const parsed = await parseKiInfluencerJsonResponse<
          KiInfluencerApiErrorBody & {
            ready?: boolean;
            missing?: string[];
          }
        >(res);
        if (cancelled) return;

        if (parsed.ok && parsed.data.ready) {
          schemaReadyRef.current = true;
          setSchemaReady(true);
          setError((prev) =>
            prev === KI_INFLUENCER_ERROR_MESSAGES.table_missing ? null : prev
          );
          return;
        }

        if (parsed.ok && (parsed.data.missing?.length ?? 0) > 0) {
          schemaReadyRef.current = false;
          setSchemaReady(false);
          setError(KI_INFLUENCER_ERROR_MESSAGES.table_missing);
        }
      } catch {
        /* ignore probe errors */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!characterId) return;

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/ki-influencer/character/${characterId}`);
        const parsed = await parseKiInfluencerJsonResponse<
          KiInfluencerApiErrorBody & {
            character?: {
              name?: string;
              source?: "generated" | "uploaded";
              status?: string;
              casting_image_url?: string | null;
            };
          }
        >(res);
        if (cancelled || !parsed.ok || !parsed.data.character) return;

        const character = parsed.data.character;
        if (character.name) setName(character.name);
        setPathMode(character.source === "uploaded" ? "uploaded" : "generated");
        if (character.casting_image_url) {
          setCastingImageUrl(character.casting_image_url);
        }
        if (character.status === "ready") {
          setCharacterReady(true);
        }
      } catch {
        /* ignore hydrate errors */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  const persistWizardUrl = useCallback(
    (overrides?: {
      step?: WizardStep;
      id?: string | null;
      name?: string;
    }) => {
      const nextStep = overrides?.step ?? step;
      const nextId = overrides?.id !== undefined ? overrides.id : characterId;
      const nextName = overrides?.name !== undefined ? overrides.name : name;

      const params = new URLSearchParams();
      if (nextStep > 0 || nextId || nextName.trim()) {
        params.set("step", String(nextStep + 1));
        if (nextId) params.set("id", nextId);
        if (nextName.trim()) params.set("name", nextName.trim());
      }

      const nextQs = params.toString();
      if (nextQs === searchParams.toString()) return;

      router.replace(nextQs ? `${pathname}?${nextQs}` : pathname, {
        scroll: false,
      });
    },
    [step, characterId, name, searchParams, router, pathname]
  );

  const goToStep = useCallback(
    (
      nextStep: WizardStep,
      extra?: { id?: string | null; name?: string }
    ) => {
      setStep(nextStep);
      persistWizardUrl({ step: nextStep, ...extra });
    },
    [persistWizardUrl]
  );

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      persistWizardUrl({ name: value });
    },
    [persistWizardUrl]
  );

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
    if (busyAction || trainingSetRunning) return;
    if (!name.trim() || uploadFiles.length < LORA_MIN_IMAGES) return;
    if (!uploadConsent || !uploadRightsConsent) {
      setError("Bitte bestätige beide Checkboxen, bevor es weitergeht.");
      return;
    }
    setError(null);
    setBusyAction("upload");
    setUploadProgress(0);

    const sessionId = crypto.randomUUID();
    let thumbnailPath: string | null = null;
    let uploadedCount = 0;

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const formData = new FormData();
        formData.append("sessionId", sessionId);
        formData.append("index", String(i));
        formData.append("image", uploadFiles[i]!);
        formData.append("consentAccepted", "true");
        formData.append("rightsConfirmed", "true");

        const photoRes = await fetch("/api/ki-influencer/upload-photo", {
          method: "POST",
          body: formData,
        });
        const photoParsed = await parseKiInfluencerJsonResponse<UploadPhotoResponse>(
          photoRes
        );

        if (!photoParsed.ok || !photoParsed.data.success) {
          throw new Error(apiBodyToErrorMessage(photoParsed.data));
        }

        uploadedCount += 1;
        if (!thumbnailPath) thumbnailPath = photoParsed.data.storagePath;
        setUploadProgress(uploadedCount);
      }

      const createRes = await fetch("/api/ki-influencer/create-from-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sessionId,
          thumbnailPath,
          imageCount: uploadedCount,
          consentAccepted: true,
          rightsConfirmed: true,
        }),
      });
      const createParsed =
        await parseKiInfluencerJsonResponse<CreateFromUploadResponse>(createRes);
      const createData = createParsed.data;

      if (!isCreateFromUploadResponse(createData)) {
        throw new Error(apiBodyToErrorMessage(createData));
      }

      setCharacterId(createData.characterId);
      goToStep(2, { id: createData.characterId, name: name.trim() });
    } catch (err) {
      setWizardError(toErrorMessage(err));
    } finally {
      setBusyAction(null);
      setUploadProgress(0);
    }
  };

  const pollTrainingStatus = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/ki-influencer/status/${id}`);
        const parsed = await parseKiInfluencerJsonResponse(res);
        const data = parsed.data as {
          progress?: number;
          logs?: string[];
          status?: string;
          errorMessage?: string;
        };
        if (typeof data.progress === "number") setLoraProgress(data.progress);
        if (data.status === "ready") {
          if (pollRef.current) clearInterval(pollRef.current);
          setCharacterReady(true);
          setBusyAction(null);
          goToStep(3);
        }
        if (data.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setWizardError(
            data.errorMessage ??
              "Das hat leider nicht geklappt. Bitte erneut versuchen."
          );
          setBusyAction(null);
        }
      } catch {
        /* keep polling */
      }
    }, 4000);
  }, [goToStep, setWizardError]);

  useEffect(() => {
    if (!characterId) return;

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/ki-influencer/status/${characterId}`);
        const parsed = await parseKiInfluencerJsonResponse<
          KiInfluencerApiErrorBody & {
            status?: string;
            progress?: number;
            logs?: string[];
          }
        >(res);
        if (cancelled || !parsed.ok) return;

        const data = parsed.data;
        if (typeof data.progress === "number") {
          setLoraProgress(data.progress);
        }

        if (data.status === "training") {
          setBusyAction("loraTrain");
          pollTrainingStatus(characterId);
        } else if (data.status === "ready") {
          setCharacterReady(true);
          setBusyAction(null);
          goToStep(3);
        }
      } catch {
        /* ignore resume errors */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [characterId, goToStep, pollTrainingStatus]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const runCasting = async (confirm = false) => {
    if (busyAction || trainingSetRunning) return;
    setError(null);
    setBusyAction(confirm ? "castingConfirm" : "casting");
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
      const parsed = await parseKiInfluencerJsonResponse<
        KiInfluencerApiErrorBody & { characterId?: string; imageUrl?: string }
      >(res);
      const data = parsed.data;
      if (
        !confirm &&
        handleKiInfluencerApiError(
          parsed.status,
          data,
          IMAGE_GEN_CREDITS.standard
        )
      ) {
        return;
      }
      if (!parsed.ok || isKiInfluencerApiFailure(parsed.ok, data)) {
        throw new Error(apiBodyToErrorMessage(data));
      }
      if (data.characterId) {
        setCharacterId(data.characterId);
        persistWizardUrl({ id: data.characterId });
      }
      if (confirm) {
        goToStep(1, { id: data.characterId ?? characterId });
      } else if (data.imageUrl) {
        setCastingImageUrl(data.imageUrl);
      }
      window.dispatchEvent(new Event("credits-updated"));
    } catch (err) {
      setWizardError(toErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const runTrainingSet = async () => {
    if (!characterId || busyAction || trainingSetRunning) return;
    setError(null);
    setTrainingSetRunning(true);
    setTrainingProgress(0);

    try {
      const startRes = await fetch("/api/ki-influencer/training-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, start: true }),
      });
      const startParsed =
        await parseKiInfluencerJsonResponse<TrainingSetStartResponse>(
          startRes
        );
      const startData = startParsed.data;

      if (
        handleKiInfluencerApiError(
          startParsed.status,
          startData,
          KI_INFLUENCER_TRAINING_SET_CREDITS
        )
      ) {
        return;
      }

      if (!isTrainingSetStartResponse(startData)) {
        throw new Error(apiBodyToErrorMessage(startData));
      }

      window.dispatchEvent(new Event("credits-updated"));

      // Brief pause so character_set_id is visible before per-image requests.
      await new Promise((resolve) => setTimeout(resolve, 400));

      let successCount = 0;
      let lastError: string | null = null;

      for (let i = 0; i < KI_INFLUENCER_TRAINING_SET_SIZE; i++) {
        try {
          const res = await fetch("/api/ki-influencer/training-set", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ characterId, index: i }),
          });
          const parsed = await parseKiInfluencerJsonResponse<TrainingSetImageResponse>(
            res
          );
          const data = parsed.data;

          if (isTrainingSetImageResponse(data)) {
            successCount += 1;
            setTrainingProgress(successCount);
            continue;
          }

          if (
            handleKiInfluencerApiError(
              parsed.status,
              data,
              KI_INFLUENCER_TRAINING_SET_CREDITS
            )
          ) {
            return;
          }

          lastError = apiBodyToErrorMessage(data);
          console.warn("[ki-influencer] training-set image failed", i, data);
        } catch (imageErr) {
          lastError = toErrorMessage(imageErr);
          console.warn("[ki-influencer] training-set image error", i, imageErr);
        }
      }

      if (successCount >= LORA_MIN_IMAGES) {
        goToStep(2);
        return;
      }

      setWizardError(
        lastError ??
          `Es wurden nur ${successCount} von ${KI_INFLUENCER_TRAINING_SET_SIZE} Fotos erstellt — mindestens ${LORA_MIN_IMAGES} nötig.`
      );
    } catch (err) {
      setWizardError(toErrorMessage(err));
    } finally {
      setTrainingSetRunning(false);
    }
  };

  const runLoraTraining = async () => {
    if (!characterId || busyAction || trainingSetRunning) return;
    if (!consentAccepted) {
      setError("Bitte bestätige die Einwilligung, bevor es weitergeht.");
      return;
    }
    if (
      pathMode === "uploaded" &&
      (!uploadConsent || !uploadRightsConsent)
    ) {
      setError(
        "Bitte bestätige beide Upload-Checkboxen, bevor das Training startet."
      );
      return;
    }
    setError(null);
    setBusyAction("loraTrain");
    setLoraProgress(0);
    let startedPolling = false;
    try {
      if (pathMode === "uploaded") {
        const finRes = await fetch("/api/ki-influencer/finalize-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            characterId,
            consentAccepted: true,
            rightsConfirmed: true,
          }),
        });
        const finParsed =
          await parseKiInfluencerJsonResponse<FinalizeUploadResponse>(finRes);
        if (!finParsed.data.success) {
          throw new Error(apiBodyToErrorMessage(finParsed.data));
        }
      }

      const res = await fetch("/api/ki-influencer/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, consentAccepted: true }),
      });
      const parsed = await parseKiInfluencerJsonResponse<
        KiInfluencerApiErrorBody & { loraId?: string }
      >(res);
      const data = parsed.data;
      if (
        handleKiInfluencerApiError(parsed.status, data, loraTrainCredits)
      ) {
        return;
      }
      if (!parsed.ok || isKiInfluencerApiFailure(parsed.ok, data)) {
        throw new Error(apiBodyToErrorMessage(data));
      }
      window.dispatchEvent(new Event("credits-updated"));
      pollTrainingStatus(characterId);
      startedPolling = true;
    } catch (err) {
      setWizardError(toErrorMessage(err));
    } finally {
      if (!startedPolling) setBusyAction(null);
    }
  };

  const runContentGenerate = async () => {
    if (!characterId || !contentPrompt.trim() || busyAction || trainingSetRunning) {
      return;
    }
    setError(null);
    setBusyAction("content");
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
      const parsed = await parseKiInfluencerJsonResponse<
        KiInfluencerApiErrorBody & { imageUrl?: string }
      >(res);
      const data = parsed.data;
      if (
        handleKiInfluencerApiError(parsed.status, data, LORA_GENERATION_CREDIT)
      ) {
        return;
      }
      if (!parsed.ok || isKiInfluencerApiFailure(parsed.ok, data)) {
        throw new Error(apiBodyToErrorMessage(data));
      }
      if (data.imageUrl) setContentResultUrl(data.imageUrl);
      window.dispatchEvent(new Event("credits-updated"));
    } catch (err) {
      setWizardError(toErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const isUploading = busyAction === "upload";
  const isCasting = busyAction === "casting";
  const isCastingConfirm = busyAction === "castingConfirm";
  const isLoraTraining = busyAction === "loraTrain";
  const isContentGenerating = busyAction === "content";

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <UserRound size={32} color="#B4FF00" strokeWidth={2.2} />
          <h1 className="font-bold text-[clamp(2rem,4vw,3rem)] tracking-wide text-[#F0EFE8]">
            KI-Influencer erstellen
          </h1>
        </div>
        <p className="text-[0.95rem] leading-relaxed text-[rgba(255,255,255,0.65)]">
          In 4 Schritten zu deinem eigenen KI-Influencer — einmal einrichten, danach
          unbegrenzt Content erstellen.
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-[#ff6b7a]">
          {resolveWizardDisplayError(error, schemaReady)}
        </p>
      )}

      {pathMode === null && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setPathMode("generated");
              persistWizardUrl({ step: 0 });
            }}
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
            onClick={() => {
              setPathMode("uploaded");
              persistWizardUrl({ step: 0 });
            }}
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
              onChange={(e) => handleNameChange(e.target.value)}
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
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
          {isUploading && uploadProgress > 0 && (
            <div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-[#B4FF00] transition-all"
                  style={{
                    width: `${(uploadProgress / uploadFiles.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-[rgba(255,255,255,0.65)]">
                Foto {uploadProgress} von {uploadFiles.length} hochgeladen…
              </p>
            </div>
          )}
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
          <LoadingButton
            disabled={
              !name.trim() ||
              uploadFiles.length < LORA_MIN_IMAGES ||
              !uploadConsent ||
              !uploadRightsConsent
            }
            isLoading={isUploading}
            loadingText={
              uploadProgress > 0
                ? `Foto ${uploadProgress} von ${uploadFiles.length} hochgeladen`
                : "Lade Fotos hoch..."
            }
            onClick={() => void submitUploadedPhotos()}
            className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608]"
          >
            Weiter zum Gesicht lernen
          </LoadingButton>
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
              onChange={(e) => handleNameChange(e.target.value)}
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
              <LoadingButton
                disabled={!name.trim() || description.length < 10}
                isLoading={isCasting}
                loadingText="Erstelle Foto..."
                onClick={() => void runCasting(false)}
                className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608]"
              >
                {castingImageUrl
                  ? `Neu erstellen (${IMAGE_GEN_CREDITS.standard} Credits)`
                  : `Foto erstellen (${IMAGE_GEN_CREDITS.standard} Credits)`}
              </LoadingButton>
              {castingImageUrl && (
                <LoadingButton
                  isLoading={isCastingConfirm}
                  loadingText="Einen Moment..."
                  onClick={() => void runCasting(true)}
                  className="rounded-xl border border-[#B4FF00]/50 px-5 py-3 font-semibold text-[#B4FF00]"
                >
                  Passt so, weiter
                </LoadingButton>
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
          <LoadingButton
            disabled={!characterId}
            isLoading={trainingSetRunning}
            loadingText={`Foto ${trainingProgress} von ${KI_INFLUENCER_TRAINING_SET_SIZE}...`}
            onClick={() => void runTrainingSet()}
            className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608]"
          >
            {`20 Fotos erstellen (${KI_INFLUENCER_TRAINING_SET_CREDITS} Credits)`}
          </LoadingButton>
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
          {(isLoraTraining || (loraProgress > 0 && !characterReady)) &&
            characterId && (
              <KiInfluencerTrainingVisualizer
                active={isLoraTraining || (loraProgress > 0 && !characterReady)}
                characterId={characterId}
                fallbackImageUrl={castingImageUrl ?? uploadPreviews[0] ?? null}
                onComplete={() => {
                  setCharacterReady(true);
                  setBusyAction(null);
                  goToStep(3);
                }}
              />
            )}
          {isLoraTraining ? (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608] opacity-50"
              >
                <BrainCircuit className="h-4 w-4 animate-pulse" aria-hidden />
                Dein Charakter lernt...
              </button>
              <p className="text-xs text-[rgba(255,255,255,0.45)]">
                Das dauert ca. 10–15 Minuten. Du kannst die Seite verlassen.
              </p>
            </div>
          ) : (
            <LoadingButton
              disabled={characterReady}
              isLoading={false}
              onClick={() => void runLoraTraining()}
              className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608]"
            >
              Gesicht lernen lassen
            </LoadingButton>
          )}
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
                  <span className="text-sm font-normal opacity-70">
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

          <LoadingButton
            disabled={!contentPrompt.trim()}
            isLoading={isContentGenerating}
            loadingText="Erstelle Bild..."
            onClick={() => void runContentGenerate()}
            className="rounded-xl bg-[#B4FF00] px-5 py-3 font-semibold text-[#060608]"
          >
            {`Bild erstellen (${LORA_GENERATION_CREDIT} Credits)`}
          </LoadingButton>

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

export default function KiInfluencerPage() {
  return (
    <Suspense fallback={null}>
      <KiInfluencerPageInner />
    </Suspense>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ChevronUp, Film, Search } from "lucide-react";
import { AiCoreBadge } from "@/components/szenen-generator/AiCoreBadge";
import { AdvancedSettingsPanel } from "@/components/szenen-generator/AdvancedSettingsPanel";
import { ModelCard } from "@/components/szenen-generator/ModelCard";
import { UploadBox } from "@/components/szenen-generator/UploadBox";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { useBuyCredits } from "@/components/credits/BuyCreditsProvider";
import { handleApiInsufficientCredits, handleInsufficientCredits } from "@/lib/client-credits-ui";
import { useAkoolJobPoll } from "@/hooks/use-akool-job-poll";
import { useMouseVelocity } from "@/hooks/useMouseVelocity";
import { useScrollVelocity } from "@/hooks/useScrollVelocity";
import { useSentientBadge } from "@/hooks/useSentientBadge";
import { useUserCredits } from "@/hooks/use-user-credits";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import type { AkoolImageToVideoModel } from "@/lib/akool-models";
import {
  clampSelectionToCapabilities,
  getModelCapabilities,
  type SzenenAspectRatio,
  type SzenenAudioMode,
} from "@/lib/szenen-generator-capabilities";
import {
  buildClientRequestBody,
  type SzenenCinematicParams,
  validateGenerationInput,
  type SzenenGenerationInput,
} from "@/lib/szenen-generator-payload";
import {
  getDefaultDuration,
  getDefaultResolution,
  getModelCreditCost,
  groupSzenenModelsByProvider,
  mergeSzenenGeneratorModels,
  type SzenenGeneratorModel,
} from "@/lib/szenen-generator-models";
import {
  getThemeTokens,
  resolveModelThemeKey,
  spotlightBackground,
  themeCssVars,
  type SzenenThemeKey,
} from "@/lib/szenen-generator-theme";
import { createClient } from "@/lib/supabase/client";
import {
  applyPreparedInputsToWorkspaceState,
  type AgentPreparedInputs,
} from "@/lib/tools/agent-prepared-inputs";
import { AgentHandoffPanel } from "@/components/dashboard/studio-ui/AgentHandoffPanel";
import {
  buildImgToVideoLocalState,
  buildToolActionReadiness,
} from "@/lib/tools/tool-action-readiness";

const BUTTON_LOADING_MESSAGES = [
  "Generiere…",
  "Szene wird berechnet…",
  "Fast fertig…",
];

function loadingMessages(name: string) {
  return [
    "Szene wird vorbereitet…",
    "Video wird erstellt…",
    "Render läuft…",
    "Qualität wird geprüft…",
    `Fast fertig, ${name}…`,
  ];
}

type DialogStep = 0 | 1;

function filterModels(models: SzenenGeneratorModel[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return models;
  return models.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
  );
}

export function SzenenGeneratorStudio({
  preparedInputs = null,
}: {
  preparedInputs?: AgentPreparedInputs | null;
} = {}) {
  const modelListRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const modelCardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const hoverCooldown = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteraction = useRef(Date.now());

  const { openBuyModal } = useBuyCredits();
  const { credits } = useUserCredits();

  const [userName, setUserName] = useState("Georg");
  const [themeOverride, setThemeOverride] = useState<SzenenThemeKey | null>(null);
  const [pulseGenerate, setPulseGenerate] = useState(false);
  const [displayedCredits, setDisplayedCredits] = useState<number | null>(null);
  const [creditFlash, setCreditFlash] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [models, setModels] = useState<SzenenGeneratorModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<SzenenGeneratorModel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [hoveredModelId, setHoveredModelId] = useState<string | null>(null);
  const [dialogStep, setDialogStep] = useState<DialogStep>(0);
  const [prompt, setPrompt] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState("720p");
  const [aspectRatio, setAspectRatio] = useState<SzenenAspectRatio>("16:9");
  const [videoCount, setVideoCount] = useState(1);
  const [audioMode, setAudioMode] = useState<SzenenAudioMode>("none");
  const [extendPrompt, setExtendPrompt] = useState(false);
  const [speedRampLabel, setSpeedRampLabel] = useState("Auto");
  const [cinematic, setCinematic] = useState<SzenenCinematicParams>({
    camera: "Statisch",
    shot: "Medium Shot",
    expression: "Neutral",
    atmosphere: "Cinematic",
    light: "Natürlich",
    effect: "Keine",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lastFrameUrl, setLastFrameUrl] = useState("");
  const [lastFramePreview, setLastFramePreview] = useState<string | null>(null);
  const [referenceUrl, setReferenceUrl] = useState("");
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const { badgeText, badgeVisible, showMessage } = useSentientBadge(isTyping);

  const applyTheme = useCallback((key: SzenenThemeKey | null) => {
    setThemeOverride(key);
  }, []);

  const themeKey: SzenenThemeKey =
    themeOverride ??
    (selectedModel ? resolveModelThemeKey(selectedModel) : "green");
  const theme = getThemeTokens(themeKey);

  const placeholder =
    dialogStep === 0
      ? `Beschreibe dein Video, ${userName}... Was erschaffen wir heute? 👇`
      : "Oder beschreibe eine neue Szene...";

  const msgs = useMemo(() => loadingMessages(userName), [userName]);

  const handoffReadiness = useMemo(() => {
    if (!preparedInputs) return null;
    const local = buildImgToVideoLocalState({ imageUrl, prompt, aspectRatio });
    return buildToolActionReadiness(preparedInputs, local);
  }, [preparedInputs, imageUrl, prompt, aspectRatio]);

  const { generating, elapsedSec, error, setError, startPolling } = useAkoolJobPoll({
    onSuccess: ({ resultUrl: url, generationId: gid }) => {
      setResultUrl(url);
      setGenerationId(gid ?? null);
      setDialogStep(1);
      showMessage(`Fertig, ${userName}! Deine Szene wartet. ✨`, 5000, 8);
    },
  });

  useEffect(() => {
    if (!preparedInputs) return;
    const hints = applyPreparedInputsToWorkspaceState(preparedInputs, {
      prompt,
      aspectRatio,
    });
    if (hints.aspectRatio === "9:16") {
      setAspectRatio("9:16");
    }
    if (hints.prompt && !prompt.trim()) {
      setPrompt(hints.prompt);
    }
  }, [preparedInputs]); // eslint-disable-line react-hooks/exhaustive-deps -- apply once when handoff arrives

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      const metaName = session?.user?.user_metadata?.full_name as string | undefined;
      const firstName =
        metaName?.trim().split(/\s+/)[0] ||
        session?.user?.email?.split("@")[0] ||
        "Georg";
      setUserName(firstName);
    });
  }, []);

  useEffect(() => {
    if (credits !== null) setDisplayedCredits(credits);
  }, [credits]);

  useEffect(() => {
    const t = setTimeout(() => {
      showMessage(
        `Hi ${userName}, bereit für etwas Großes? Was wollen wir heute erschaffen? 👇`,
        5000,
        3
      );
    }, 1200);
    return () => clearTimeout(t);
  }, [userName, showMessage]);

  useEffect(() => {
    if (dialogStep !== 0) return;
    idleTimer.current = setTimeout(() => {
      if (Date.now() - lastInteraction.current >= 12000) {
        showMessage(
          "Ich warte noch... soll ich schon die Modelle aufwärmen? 🔥",
          4000,
          2
        );
      }
    }, 12000);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [dialogStep, showMessage]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/seedance/models");
        const data = (await res.json()) as {
          models?: AkoolImageToVideoModel[];
          error?: string;
        };
        const apiModels = res.ok ? (data.models ?? []) : [];
        if (!res.ok && !apiModels.length) setLoadError(data.error ?? null);
        const merged = mergeSzenenGeneratorModels(apiModels);
        if (cancelled) return;
        setModels(merged);
        if (merged[0]) {
          setSelectedModel(merged[0]);
          setDuration(getDefaultDuration(merged[0]));
          setResolution(getDefaultResolution(merged[0]));
        }
      } catch {
        if (!cancelled) {
          const merged = mergeSzenenGeneratorModels([]);
          setModels(merged);
          if (merged[0]) {
            setSelectedModel(merged[0]);
            setDuration(getDefaultDuration(merged[0]));
            setResolution(getDefaultResolution(merged[0]));
          }
          setLoadError("Modelle konnten nicht geladen werden");
        }
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!generating) return;
    const iv = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % msgs.length);
    }, 1500);
    return () => clearInterval(iv);
  }, [generating, msgs.length]);

  const filteredModels = useMemo(
    () => filterModels(models, searchQuery),
    [models, searchQuery]
  );
  const groupedModels = useMemo(
    () => groupSzenenModelsByProvider(filteredModels),
    [filteredModels]
  );

  const capabilities = useMemo(() => {
    if (!selectedModel) return null;
    return getModelCapabilities(selectedModel, resolution);
  }, [selectedModel, resolution]);

  const creditCost = useMemo(() => {
    if (!selectedModel) return 0;
    return getModelCreditCost(selectedModel, duration, resolution) * videoCount;
  }, [selectedModel, duration, resolution, videoCount]);

  const { isFast } = useScrollVelocity(modelListRef);

  useEffect(() => {
    if (!isFast) return;
    showMessage(
      `${userName}, bitte etwas langsamer scrollen.`,
      4000,
      5
    );
  }, [isFast, userName, showMessage]);

  useMouseVelocity(canvasRef, {
    onWobble: useCallback(() => {
      showMessage(
        `Alles in Ordnung, ${userName}?`,
        4000,
        3
      );
    }, [userName, showMessage]),
  });

  const selectModel = useCallback(
    (model: SzenenGeneratorModel) => {
      const nextResolution = getDefaultResolution(model);
      const nextDuration = getDefaultDuration(model);
      const caps = getModelCapabilities(model, nextResolution);
      const clamped = clampSelectionToCapabilities(caps, {
        duration: nextDuration,
        resolution: nextResolution,
        aspectRatio: caps.aspectRatios[0],
        videoCount: 1,
        audioMode: "none",
      });

      setSelectedModel(model);
      setDuration(clamped.duration);
      setResolution(clamped.resolution);
      setAspectRatio(clamped.aspectRatio ?? "16:9");
      setVideoCount(clamped.videoCount);
      setAudioMode(clamped.audioMode);
      setExtendPrompt(false);

      if (!caps.supportsEndFrame) {
        setLastFrameUrl("");
        setLastFramePreview(null);
      }
      if (!caps.supportsReference) {
        setReferenceUrl("");
        setReferencePreview(null);
      }
      if (!caps.supportsAudio) {
        setAudioUrl("");
        setAudioName(null);
      }

      applyTheme(null);
      setResultUrl(null);
      setGenerationId(null);
      setSubmitError(null);
      setError(null);
      lastInteraction.current = Date.now();
      requestAnimationFrame(() => {
        modelCardRefs.current.get(model.id)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    },
    [setError, applyTheme]
  );

  useEffect(() => {
    if (!selectedModel || !capabilities) return;
    const clamped = clampSelectionToCapabilities(capabilities, {
      duration,
      resolution,
      aspectRatio,
      videoCount,
      audioMode,
    });
    if (clamped.duration !== duration) setDuration(clamped.duration);
    if (clamped.resolution !== resolution) setResolution(clamped.resolution);
    if (clamped.aspectRatio && clamped.aspectRatio !== aspectRatio) {
      setAspectRatio(clamped.aspectRatio);
    }
    if (clamped.videoCount !== videoCount) setVideoCount(clamped.videoCount);
    if (clamped.audioMode !== audioMode) setAudioMode(clamped.audioMode);
  }, [
    selectedModel,
    capabilities,
    duration,
    resolution,
    aspectRatio,
    videoCount,
    audioMode,
  ]);

  const readFileAsDataUrl = (file: File, onDone: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => onDone(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    lastInteraction.current = Date.now();
    const text = prompt.trim();
    if (dialogStep === 0 && text.length > 10) {
      setDialogStep(1);
      applyTheme("violet");
      showMessage(
        `Gute Idee, ${userName}. Prüfe die Einstellungen und klicke auf Generieren.`,
        6000,
        10
      );
      setPrompt("");
      setTimeout(() => setPulseGenerate(true), 2000);
    }
  };

  const runGenerate = useCallback(async () => {
    if (!selectedModel || !capabilities) return;

    const generationInput: SzenenGenerationInput = {
      model: selectedModel,
      capabilities,
      prompt: prompt.trim(),
      duration,
      resolution,
      aspectRatio: capabilities.supportsMultiRatio ? aspectRatio : undefined,
      imageUrl,
      lastFrameUrl: lastFrameUrl || undefined,
      referenceUrl: referenceUrl || undefined,
      audioUrl: audioUrl || undefined,
      audioMode,
      videoCount,
      extendPrompt,
      cinematic,
      speedRampLabel,
    };

    const validationError = validateGenerationInput(generationInput);
    if (validationError) {
      if (validationError.includes("Startbild")) {
        setUploadError(true);
        showMessage(
          "Bitte lade zuerst ein Startbild hoch.",
          4000,
          6
        );
      } else {
        setSubmitError(validationError);
      }
      return;
    }

    if (
      credits !== null &&
      handleInsufficientCredits(credits, creditCost)
    ) {
      showMessage(`Nicht genug Credits, ${userName}! Zeit für ein Upgrade! 💳`, 5000, 9);
      openBuyModal();
      return;
    }

    setUploadError(false);
    setSubmitError(null);
    setError(null);
    setResultUrl(null);
    setGenerationId(null);
    setPulseGenerate(false);
    showMessage("AI Core berechnet deine Szene... 🔥", 4000, 8);

    if (credits !== null && creditCost > 0) {
      setCreditFlash(true);
      const start = credits;
      const end = Math.max(0, credits - creditCost);
      const steps = 12;
      let step = 0;
      const iv = setInterval(() => {
        step += 1;
        setDisplayedCredits(Math.round(start + ((end - start) * step) / steps));
        if (step >= steps) {
          clearInterval(iv);
          setTimeout(() => setCreditFlash(false), 400);
        }
      }, 40);
    }

    try {
      const requestBody = buildClientRequestBody(generationInput);
      const res = await fetch("/api/akool/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = (await res.json()) as { jobId?: string; error?: string; credits?: number };
      if (handleApiInsufficientCredits(res.status, data, creditCost)) {
        showMessage(`Nicht genug Credits, ${userName}! Zeit für ein Upgrade! 💳`, 5000, 9);
        openBuyModal();
        return;
      }
      if (!res.ok || !data.jobId) throw new Error(data.error ?? "Fehler");
      startPolling(data.jobId, "image2video");
    } catch (err: unknown) {
      setSubmitError(
        sanitizeUserMessage(err instanceof Error ? err.message : "Fehler")
      );
    }
  }, [
    selectedModel,
    capabilities,
    imageUrl,
    prompt,
    duration,
    resolution,
    aspectRatio,
    lastFrameUrl,
    referenceUrl,
    audioUrl,
    audioMode,
    videoCount,
    extendPrompt,
    cinematic,
    speedRampLabel,
    creditCost,
    credits,
    userName,
    startPolling,
    setError,
    showMessage,
    openBuyModal,
  ]);

  const handleModelLongHover = useCallback(() => {
    const now = Date.now();
    if (now - hoverCooldown.current < 10000) return;
    hoverCooldown.current = now;
    showMessage("Ich sehe dich... du darfst klicken. 👀", 4000, 4);
  }, [showMessage]);

  const panel = (
    <div className="flex h-full flex-col px-3 pb-3 pt-3">
      <AiCoreBadge text={badgeText} visible={badgeVisible} />
      <div className="relative mb-3">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Modelle suchen..."
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] py-2.5 pl-9 pr-3 text-[13px] text-white outline-none backdrop-blur-sm placeholder:text-white/25 focus:border-white/20"
        />
      </div>
      <div ref={modelListRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
        {modelsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-[14px] bg-white/[0.04]" />
            ))}
          </div>
        ) : (
          groupedModels.map((group, gi) => (
            <div key={group.provider}>
              {gi > 0 && <div className="my-2 h-[0.5px] bg-white/10" />}
              <p className="px-1 pb-2 pt-1 text-[9px] uppercase tracking-[1.5px] text-white/25">
                {group.provider}
              </p>
              {group.models.map((model) => (
                <div
                  key={model.id}
                  onMouseEnter={() => setHoveredModelId(model.id)}
                  onMouseLeave={() => setHoveredModelId(null)}
                >
                  <ModelCard
                    model={model}
                    active={selectedModel?.id === model.id}
                    neighborHover={
                      hoveredModelId !== null &&
                      hoveredModelId !== model.id &&
                      group.models.some((m) => m.id === hoveredModelId)
                    }
                    onSelect={() => selectModel(model)}
                    onLongHover={handleModelLongHover}
                    cardRef={(el) => {
                      if (el) modelCardRefs.current.set(model.id, el);
                      else modelCardRefs.current.delete(model.id);
                    }}
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {preparedInputs && handoffReadiness ? (
        <div className="mx-auto mb-4 w-full min-w-0 max-w-5xl px-4 pt-2">
          <AgentHandoffPanel prepared={preparedInputs} readiness={handoffReadiness} />
        </div>
      ) : null}
    <div
      className="-mx-4 -mt-4 flex min-h-[calc(100dvh-120px)] flex-col font-sans transition-all duration-700 ease-in-out sm:-mx-6 md:-mx-10 md:-mt-8"
      style={themeCssVars(theme)}
    >
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Middle panel — desktop */}
        <aside
          className="hidden w-[260px] shrink-0 flex-col border-r border-white/[0.05] bg-[#0e0e11] lg:flex"
          style={{ borderRightWidth: "0.5px" }}
        >
          {panel}
        </aside>

        {/* Mobile bottom sheet toggle */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSheetOpen((v) => !v)}
            className="flex w-full items-center justify-center gap-2 border-b border-white/10 bg-[#0e0e11] py-2 text-[12px] text-white/50"
          >
            <ChevronUp
              size={16}
              className={`transition-transform ${mobileSheetOpen ? "rotate-180" : ""}`}
            />
            Modelle {mobileSheetOpen ? "ausblenden" : "anzeigen"}
          </button>
          {mobileSheetOpen && (
            <aside className="max-h-[300px] overflow-hidden border-b border-white/10 bg-[#0e0e11]">
              {panel}
            </aside>
          )}
        </div>

        {/* Right canvas */}
        <div
          ref={canvasRef}
          className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#08080a]"
        >
          <div
            className="pointer-events-none absolute left-1/2 top-[30%] z-0 h-[380px] w-[500px] max-w-[90%] -translate-x-1/2 rounded-full blur-[80px] transition-all duration-[1200ms] ease-in-out"
            style={{
              background: spotlightBackground(theme),
              opacity: theme.spotOpacity + 0.3,
            }}
          />

          <div className="relative z-[1] flex items-start justify-between px-4 pt-4 sm:px-8">
            <h1
              className="font-display text-[36px] font-semibold leading-none tracking-tight text-white transition-all duration-700 ease-in-out"
              style={{ textShadow: `0 0 40px rgba(${theme.rgb},0.3)` }}
            >
              VIDEO GENERATOR
            </h1>
            {selectedModel && (
              <div
                className="rounded-xl border px-3 py-1.5 text-[12px] transition-all duration-700 ease-in-out"
                style={{
                  borderColor: `rgba(${theme.rgb},0.35)`,
                  background: "rgba(255,255,255,0.04)",
                  color: creditFlash ? "#ff6b7a" : "var(--szenen-accent-text-muted)",
                }}
              >
                {displayedCredits !== null
                  ? `${displayedCredits} Credits`
                  : creditCost > 0
                    ? `${creditCost} Credits`
                    : selectedModel.creditEstimate}
              </div>
            )}
          </div>

          <div className="relative z-[1] flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 pb-8 pt-6 sm:px-8">
            <div className="flex w-full max-w-[720px] flex-col items-center">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-[1200ms]"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <Film size={24} style={{ color: "var(--szenen-accent)" }} strokeWidth={2} />
              </div>
              <h2
                className="text-center text-[28px] font-bold leading-tight tracking-[-1px] transition-colors duration-[800ms]"
                style={{
                  color: "var(--szenen-accent-text)",
                  textShadow: `0 0 32px rgba(${theme.rgb},0.25)`,
                }}
              >
                {selectedModel?.name ?? "Modell wählen"}
              </h2>

              <div className="mt-8 w-full max-w-[620px]">
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setIsTyping(true);
                    lastInteraction.current = Date.now();
                  }}
                  onBlur={(e) => {
                    setIsTyping(false);
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  }}
                  onKeyDown={handlePromptKeyDown}
                  placeholder={placeholder}
                  rows={3}
                  className="w-full resize-none rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[14px] text-white outline-none backdrop-blur-[10px] transition-all duration-300 placeholder:text-white/25 focus:shadow-[0_0_0_3px_var(--szenen-accent-10)]"
                  style={{ borderWidth: "0.5px" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.primary;
                  }}
                />

                {selectedModel && capabilities && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <span
                      className="rounded-full border px-3 py-1 text-[11px] transition-all duration-[1200ms]"
                      style={{
                        borderColor: "var(--szenen-accent-30)",
                        background: "var(--szenen-accent-10)",
                        color: "var(--szenen-accent-text-muted)",
                      }}
                    >
                      {selectedModel.name}
                    </span>
                    {capabilities.requiresStartImage && <Pill label="Startbild" />}
                    {capabilities.supportsEndFrame && <Pill label="Endrahmen" />}
                    {capabilities.supportsReference && <Pill label="Referenz" />}
                    {capabilities.supportsAudio && <Pill label="Audio" />}
                    {capabilities.supportsMultiRatio && <Pill label="Multi-Ratio" />}
                    {capabilities.supportsMultiShot && <Pill label="Multi-Shot" />}
                    {capabilities.showResolution && <Pill label={resolution} />}
                    {capabilities.showDuration && <Pill label={`${duration}s`} />}
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {capabilities?.requiresStartImage && (
                    <UploadBox
                      label="Startbild hochladen"
                      accept="image/jpeg,image/png,image/webp"
                      kind="image"
                      previewUrl={imagePreview}
                      error={uploadError}
                      onFile={(file) => {
                        readFileAsDataUrl(file, (url) => {
                          setImageUrl(url);
                          setImagePreview(url);
                          setUploadError(false);
                        });
                      }}
                      onRemove={() => {
                        setImageUrl("");
                        setImagePreview(null);
                      }}
                    />
                  )}
                  {capabilities?.supportsEndFrame && (
                    <UploadBox
                      label="Endrahmen (optional)"
                      accept="image/jpeg,image/png,image/webp"
                      kind="image"
                      previewUrl={lastFramePreview}
                      onFile={(file) => {
                        readFileAsDataUrl(file, (url) => {
                          setLastFrameUrl(url);
                          setLastFramePreview(url);
                        });
                      }}
                      onRemove={() => {
                        setLastFrameUrl("");
                        setLastFramePreview(null);
                      }}
                    />
                  )}
                  {capabilities?.supportsReference && (
                    <UploadBox
                      label="Referenzbild (optional)"
                      accept="image/jpeg,image/png,image/webp"
                      kind="image"
                      previewUrl={referencePreview}
                      onFile={(file) => {
                        readFileAsDataUrl(file, (url) => {
                          setReferenceUrl(url);
                          setReferencePreview(url);
                        });
                      }}
                      onRemove={() => {
                        setReferenceUrl("");
                        setReferencePreview(null);
                      }}
                    />
                  )}
                  {capabilities?.supportsCustomAudio &&
                    (audioMode === "custom" || !capabilities.supportsAiAudio) && (
                    <UploadBox
                      label="Audio hinzufügen (optional)"
                      accept="audio/mpeg,audio/wav,.mp3"
                      kind="audio"
                      previewName={audioName ?? undefined}
                      onFile={(file) => {
                        setAudioName(file.name);
                        readFileAsDataUrl(file, (url) => {
                          setAudioUrl(url);
                          setAudioMode("custom");
                        });
                      }}
                      onRemove={() => {
                        setAudioName(null);
                        setAudioUrl("");
                      }}
                    />
                  )}
                </div>

                {capabilities && (
                  <AdvancedSettingsPanel
                    capabilities={capabilities}
                    duration={duration}
                    resolution={resolution}
                    aspectRatio={aspectRatio}
                    videoCount={videoCount}
                    audioMode={audioMode}
                    extendPrompt={extendPrompt}
                    cinematic={cinematic}
                    speedRampLabel={speedRampLabel}
                    onDuration={setDuration}
                    onResolution={setResolution}
                    onAspectRatio={setAspectRatio}
                    onVideoCount={setVideoCount}
                    onAudioMode={setAudioMode}
                    onExtendPrompt={setExtendPrompt}
                    onCinematic={(key, value) =>
                      setCinematic((prev) => ({ ...prev, [key]: value }))
                    }
                    onSpeedRampLabel={setSpeedRampLabel}
                  />
                )}

                <LoadingButton
                  type="button"
                  mode="tool"
                  isLoading={generating}
                  loadingText={
                    generating
                      ? msgs[loadingMsgIndex]
                      : BUTTON_LOADING_MESSAGES[loadingMsgIndex % BUTTON_LOADING_MESSAGES.length]
                  }
                  disabled={!selectedModel || !prompt.trim()}
                  onClick={() => void runGenerate()}
                  className={`mt-4 h-12 w-full rounded-[10px] font-display text-base tracking-wide disabled:opacity-40 ${
                    pulseGenerate && !generating ? "szenen-gen-pulse" : ""
                  }`}
                  style={{
                    background: generating ? undefined : theme.primary,
                    color: theme.onAccent,
                    fontWeight: 700,
                    boxShadow: `0 4px 20px rgba(${theme.rgb},0.3)`,
                  }}
                >
                  GENERIEREN
                </LoadingButton>

                {generating && (
                  <p className="mt-2 text-center text-[12px] text-white/25">
                    {msgs[loadingMsgIndex]} · {elapsedSec}s
                  </p>
                )}

                {(error || submitError || loadError) && (
                  <p className="mt-3 text-center text-[13px] text-[#ff6b7a]">
                    {error || submitError || loadError}
                  </p>
                )}

                {resultUrl && (
                  <div className="mt-8 w-full">
                    <video
                      src={resultUrl}
                      controls
                      playsInline
                      className="max-h-[400px] w-full rounded-[14px] bg-black"
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      {generationId && (
                        <a
                          href={`/api/generated-video/${generationId}?download=1`}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] text-white/70"
                        >
                          Herunterladen
                        </a>
                      )}
                      <Link
                        href="/dashboard/gallery"
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] text-white/70"
                      >
                        Im Studio-Archiv speichern
                      </Link>
                    </div>
                    <AiOutputDisclaimer />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span
      className="rounded-full border px-3 py-1 text-[11px] text-white/50 transition-all duration-700"
      style={{ borderColor: "var(--szenen-accent-20)" }}
    >
      {label}
    </span>
  );
}

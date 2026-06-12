"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Film, Plus, Search, Upload } from "lucide-react";
import { TablerPhoto } from "@/components/icons/TablerPhoto";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import { useAkoolJobPoll } from "@/hooks/use-akool-job-poll";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import type { AkoolImageToVideoModel } from "@/lib/akool-models";
import { getDurationsForModel } from "@/lib/akool-models";
import {
  getDefaultDuration,
  getDefaultResolution,
  getModelCreditCost,
  groupSzenenModelsByProvider,
  mergeSzenenGeneratorModels,
  modelSupportsTag,
  type SzenenFeatureTag,
  type SzenenGeneratorModel,
} from "@/lib/szenen-generator-models";

const TAG_ICONS: Record<SzenenFeatureTag, string> = {
  Start: "▶",
  End: "◼",
  Audio: "♪",
  Referenz: "◎",
  "Multi-Shot": "⧉",
  "Multi-Ratio": "⬒",
};

function filterModels(
  models: SzenenGeneratorModel[],
  query: string
): SzenenGeneratorModel[] {
  const q = query.trim().toLowerCase();
  if (!q) return models;
  return models.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function SzenenGeneratorStudio() {
  const fileRef = useRef<HTMLInputElement>(null);
  const lastFrameRef = useRef<HTMLInputElement>(null);
  const modelCardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const [modelsLoading, setModelsLoading] = useState(true);
  const [models, setModels] = useState<SzenenGeneratorModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<SzenenGeneratorModel | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState("720p");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lastFrameUrl, setLastFrameUrl] = useState("");
  const [lastFramePreview, setLastFramePreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { generating, elapsedSec, error, setError, startPolling } =
    useAkoolJobPoll({
      onSuccess: ({ resultUrl: url, generationId: gid }) => {
        setResultUrl(url);
        setGenerationId(gid ?? null);
      },
    });

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
        if (!res.ok && !apiModels.length) {
          setLoadError(data.error ?? null);
        }
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

  const filteredModels = useMemo(
    () => filterModels(models, searchQuery),
    [models, searchQuery]
  );

  const groupedModels = useMemo(
    () => groupSzenenModelsByProvider(filteredModels),
    [filteredModels]
  );

  const creditCost = useMemo(() => {
    if (!selectedModel) return 0;
    return getModelCreditCost(selectedModel, duration, resolution);
  }, [selectedModel, duration, resolution]);

  const selectModel = useCallback((model: SzenenGeneratorModel) => {
    setSelectedModel(model);
    setDuration(getDefaultDuration(model));
    setResolution(getDefaultResolution(model));
    setResultUrl(null);
    setGenerationId(null);
    setSubmitError(null);
    setError(null);

    requestAnimationFrame(() => {
      modelCardRefs.current.get(model.id)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, [setError]);

  useEffect(() => {
    if (!selectedModel?.akool) return;
    const durations = getDurationsForModel(selectedModel.akool, resolution);
    if (!durations.includes(duration)) {
      setDuration(durations[0] ?? 5);
    }
  }, [selectedModel, resolution, duration]);

  const handleFile = (file: File, target: "source" | "last") => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (target === "source") {
        setImageUrl(url);
        setImagePreview(url);
      } else {
        setLastFrameUrl(url);
        setLastFramePreview(url);
      }
      setSubmitError(null);
    };
    reader.readAsDataURL(file);
  };

  const runGenerate = useCallback(async () => {
    if (!selectedModel) return;

    if (modelSupportsTag(selectedModel, "Start") && !imageUrl.trim()) {
      setSubmitError("Bitte lade ein Startbild hoch.");
      return;
    }
    if (!prompt.trim()) {
      setSubmitError("Bitte beschreibe dein Video.");
      return;
    }
    if (!selectedModel.apiAvailable || !selectedModel.akool) {
      setSubmitError("Dieses Modell ist derzeit nicht verfügbar.");
      return;
    }

    setSubmitError(null);
    setError(null);
    setResultUrl(null);
    setGenerationId(null);

    try {
      const res = await fetch("/api/akool/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: selectedModel.id,
          imageUrl,
          prompt: prompt.trim(),
          duration,
          resolution,
          lastFrameUrl: lastFrameUrl || undefined,
        }),
      });
      const data = (await res.json()) as { jobId?: string; error?: string };
      if (handleApiInsufficientCredits(res.status, data, creditCost)) return;
      if (!res.ok || !data.jobId) {
        throw new Error(data.error ?? "Fehler");
      }
      startPolling(data.jobId, "image2video");
    } catch (err: unknown) {
      setSubmitError(
        sanitizeUserMessage(err instanceof Error ? err.message : "Fehler")
      );
    }
  }, [
    selectedModel,
    imageUrl,
    prompt,
    duration,
    resolution,
    lastFrameUrl,
    creditCost,
    startPolling,
    setError,
  ]);

  const showStartUpload = selectedModel
    ? modelSupportsTag(selectedModel, "Start")
    : false;
  const showEndUpload = selectedModel
    ? modelSupportsTag(selectedModel, "End")
    : false;

  return (
    <div className="-mx-4 -mt-4 mb-0 flex min-h-[calc(100dvh-120px)] flex-col sm:-mx-6 md:-mx-10 md:-mt-8">
      <div className="border-b border-[#1e1e1e] px-4 py-4 sm:px-6 md:px-8">
        <h1 className="font-display text-[clamp(28px,5vw,40px)] leading-none tracking-wide text-white">
          SZENEN GENERATOR
        </h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left panel — model picker */}
        <aside
          className={`flex shrink-0 flex-col border-[#1e1e1e] bg-[#111] lg:w-[320px] lg:border-r lg:[border-right-width:0.5px] ${
            mobilePanelOpen ? "max-h-[300px] border-b" : "max-h-12 overflow-hidden border-b lg:max-h-none lg:overflow-visible lg:border-b-0"
          }`}
        >
          <button
            type="button"
            onClick={() => setMobilePanelOpen((v) => !v)}
            className="flex items-center justify-between px-4 py-3 text-left lg:hidden"
          >
            <span className="text-[12px] text-[#888]">Alle Modelle</span>
            <ChevronDown
              size={16}
              className={`text-[#888] transition-transform ${mobilePanelOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div className="hidden px-4 pt-4 lg:block">
            <p className="text-[12px] text-[#888]">Alle Modelle</p>
            <div className="relative mt-3">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Modelle suchen..."
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] py-2 pl-9 pr-3 text-[13px] text-[#e0e0e0] outline-none placeholder:text-[#555] focus:border-[#333]"
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:pt-0">
            <div className="px-4 pt-2 lg:hidden">
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Modelle suchen..."
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] py-2 pl-9 pr-3 text-[13px] text-[#e0e0e0] outline-none placeholder:text-[#555] focus:border-[#333]"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 lg:px-0">
              {modelsLoading ? (
                <div className="space-y-2 px-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-lg bg-[#161616]"
                    />
                  ))}
                </div>
              ) : groupedModels.length === 0 ? (
                <p className="px-4 py-6 text-center text-[12px] text-[#555]">
                  Keine Modelle gefunden
                </p>
              ) : (
                groupedModels.map((group, groupIndex) => (
                  <div key={group.provider}>
                    {groupIndex > 0 && (
                      <div className="my-2 h-px bg-[#1e1e1e]" />
                    )}
                    <p
                      className="px-4 pb-2 pt-1 text-[9px] uppercase tracking-[1.5px] text-[#444]"
                      style={{ letterSpacing: "1.5px" }}
                    >
                      {group.provider}
                    </p>
                    {group.models.map((model) => {
                      const active = selectedModel?.id === model.id;
                      return (
                        <button
                          key={model.id}
                          ref={(el) => {
                            if (el) modelCardRefs.current.set(model.id, el);
                            else modelCardRefs.current.delete(model.id);
                          }}
                          type="button"
                          onClick={() => selectModel(model)}
                          className={`relative mb-1 w-full rounded-none px-4 py-3 text-left transition-colors hover:bg-[#161616] ${
                            active
                              ? "border-l-2 border-[#B4FF00] bg-[#161616]"
                              : "border-l-2 border-transparent"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-0.5 flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full border ${
                                active
                                  ? "border-[#B4FF00] bg-[#B4FF00]"
                                  : "border-[#444] bg-transparent"
                              }`}
                            >
                              {active && (
                                <span className="h-[6px] w-[6px] rounded-full bg-[#0a0a0a]" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-[#e0e0e0]">
                                  {model.name}
                                </span>
                                {model.badge && (
                                  <span className="rounded bg-[#1e2a1a] px-1.5 py-0.5 text-[9px] text-[#7ab800]">
                                    {model.badge}
                                  </span>
                                )}
                              </div>
                              <p className="ml-[22px] mt-1 text-[11px] leading-snug text-[#555]">
                                {model.description}
                              </p>
                              <div className="ml-[22px] mt-2 flex flex-wrap gap-1">
                                {model.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-0.5 rounded-full border border-[#2a2a2a] px-1.5 py-0.5 text-[10px] text-[#444]"
                                  >
                                    <span aria-hidden>{TAG_ICONS[tag]}</span>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <span className="shrink-0 text-[10px] text-[#555]">
                              {model.creditEstimate}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Right canvas */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0a]">
          {selectedModel && (
            <div className="absolute right-4 top-4 z-10 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-[#888]">
              {creditCost > 0 ? `${creditCost} Credits` : selectedModel.creditEstimate}
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 py-8 sm:px-8">
            <div className="flex w-full max-w-[720px] flex-col items-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a1a1a]">
                <Film size={24} color="#B4FF00" strokeWidth={2} />
              </div>

              <h2
                className="text-center text-[36px] font-bold leading-tight tracking-[-0.5px] text-white"
                style={{ letterSpacing: "-0.5px" }}
              >
                {selectedModel?.name ?? "Modell wählen"}
              </h2>

              <div className="mt-8 w-full max-w-[620px]">
                <div className="flex items-center gap-2 rounded-2xl border border-[#2a2a2a] bg-[#181818] p-3 focus-within:border-[#333]">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#888] transition-colors hover:text-[#B4FF00]"
                    aria-label="Startbild hochladen"
                  >
                    <TablerPhoto size={20} color="currentColor" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f, "source");
                    }}
                  />
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void runGenerate();
                      }
                    }}
                    placeholder="Beschreibe dein Video..."
                    className="min-w-0 flex-1 bg-transparent text-[14px] text-[#e0e0e0] outline-none placeholder:text-[#555]"
                  />
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e1e1e] text-[#888]"
                    aria-hidden
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {selectedModel && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <span className="rounded-full border border-[#2d4a00] bg-[#0d1a00] px-3 py-1 text-[11px] text-[#7ab800]">
                      {selectedModel.name}
                    </span>
                    {modelSupportsTag(selectedModel, "Start") && (
                      <span className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-[11px] text-[#777]">
                        Startbild
                      </span>
                    )}
                    {modelSupportsTag(selectedModel, "End") && (
                      <span className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-[11px] text-[#777]">
                        Endrahmen
                      </span>
                    )}
                    {modelSupportsTag(selectedModel, "Audio") && (
                      <span className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-[11px] text-[#777]">
                        Audio
                      </span>
                    )}
                    <span className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-[11px] text-[#777]">
                      {selectedModel.resolutionLabel}
                    </span>
                    <span className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-[11px] text-[#777]">
                      {selectedModel.durationLabel}
                    </span>
                  </div>
                )}

                {showStartUpload && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileRef.current?.click();
                      }
                    }}
                    className="mt-4 cursor-pointer rounded-xl border border-dashed border-[#2a2a2a] p-8 text-center transition-colors hover:border-[#333]"
                  >
                    {imagePreview ? (
                      <div className="relative mx-auto h-40 w-full max-w-sm overflow-hidden rounded-lg">
                        <Image
                          src={imagePreview}
                          alt="Startbild"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="mx-auto text-[#555]" />
                        <p className="mt-2 text-[13px] text-[#777]">
                          Startbild hochladen
                        </p>
                      </>
                    )}
                  </div>
                )}

                {showEndUpload && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => lastFrameRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        lastFrameRef.current?.click();
                      }
                    }}
                    className="mt-3 cursor-pointer rounded-xl border border-dashed border-[#2a2a2a] p-6 text-center transition-colors hover:border-[#333]"
                  >
                    <input
                      ref={lastFrameRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f, "last");
                      }}
                    />
                    {lastFramePreview ? (
                      <div className="relative mx-auto h-28 w-full max-w-xs overflow-hidden rounded-lg">
                        <Image
                          src={lastFramePreview}
                          alt="Endrahmen"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <p className="text-[13px] text-[#777]">
                        Endrahmen (optional)
                      </p>
                    )}
                  </div>
                )}

                <LoadingButton
                  type="button"
                  mode="tool"
                  isLoading={generating}
                  loadingText="Wird generiert..."
                  disabled={
                    !selectedModel ||
                    !prompt.trim() ||
                    (showStartUpload && !imageUrl.trim())
                  }
                  onClick={() => void runGenerate()}
                  className="mt-4 rounded-xl bg-[#B4FF00] px-8 py-3 text-[#0a0a0a] disabled:opacity-40"
                >
                  GENERIEREN
                </LoadingButton>

                {generating && elapsedSec > 0 && (
                  <p className="mt-2 text-center text-[12px] text-[#555]">
                    Generierung läuft… {elapsedSec}s
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
                      className="max-h-[400px] w-full rounded-xl bg-black"
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      {generationId && (
                        <a
                          href={`/api/generated-video/${generationId}?download=1`}
                          className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-[#e0e0e0] transition-colors hover:border-[#333]"
                        >
                          Herunterladen
                        </a>
                      )}
                      <Link
                        href="/dashboard/gallery"
                        className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-[#e0e0e0] transition-colors hover:border-[#333]"
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
  );
}

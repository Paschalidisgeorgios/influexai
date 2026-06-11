"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Film, Link2, Upload } from "lucide-react";
import { parseGenerationAssetResult } from "@/lib/generation-asset-types";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import type { AkoolImageToVideoModel } from "@/lib/akool-models";
import { SEEDANCE_UI_NAME } from "@/lib/seedance-config";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { createClient } from "@/lib/supabase/client";
import { useUserCredits } from "@/hooks/use-user-credits";

type GalleryImage = {
  id: string;
  prompt: string;
  previewUrl: string;
};

function getDurationsForSelection(
  model: AkoolImageToVideoModel,
  resolution: string
): number[] {
  const res = model.resolutionList.find(
    (item) => item.value.toLowerCase() === resolution.toLowerCase()
  );
  if (res?.durationList?.length) {
    return [...res.durationList].sort((a, b) => a - b);
  }
  return model.durationList;
}

function calculateTotalCredits(
  model: AkoolImageToVideoModel,
  resolution: string,
  duration: number
): number {
  const res =
    model.resolutionList.find(
      (item) => item.value.toLowerCase() === resolution.toLowerCase()
    ) ?? model.resolutionList[0];
  if (!res) return 0;
  return Math.max(1, Math.round(res.unit_credit * duration));
}

export default function SeedancePage() {
  const searchParams = useSearchParams();
  const { credits, reload: reloadCredits } = useUserCredits();
  const fileRef = useRef<HTMLInputElement>(null);
  const lastFrameRef = useRef<HTMLInputElement>(null);

  const [models, setModels] = useState<AkoolImageToVideoModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [duration, setDuration] = useState<number>(5);
  const [resolution, setResolution] = useState<string>("720p");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lastFrameUrl, setLastFrameUrl] = useState<string | null>(null);
  const [lastFramePreview, setLastFramePreview] = useState<string | null>(null);
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [prompt, setPrompt] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedModel = useMemo(
    () => models.find((model) => model.value === selectedModelId) ?? null,
    [models, selectedModelId]
  );

  const availableDurations = useMemo(() => {
    if (!selectedModel) return [5];
    return getDurationsForSelection(selectedModel, resolution);
  }, [selectedModel, resolution]);

  const creditCost = useMemo(() => {
    if (!selectedModel) return 0;
    return calculateTotalCredits(selectedModel, resolution, duration);
  }, [selectedModel, resolution, duration]);

  const groupedModels = useMemo(() => {
    const groups: Record<string, AkoolImageToVideoModel[]> = {};
    for (const model of models) {
      if (!groups[model.providerLabel]) {
        groups[model.providerLabel] = [];
      }
      groups[model.providerLabel].push(model);
    }
    return groups;
  }, [models]);

  const stopTimers = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimers(), [stopTimers]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setModelsLoading(true);
      setModelsError(null);
      try {
        const res = await fetch("/api/seedance/models");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Modelle konnten nicht geladen werden");
        }
        const loaded = (data.models ?? []) as AkoolImageToVideoModel[];
        if (cancelled) return;
        setModels(loaded);
        if (loaded.length > 0) {
          setSelectedModelId(loaded[0].value);
          setResolution(loaded[0].resolutionList[0]?.value ?? "720p");
          setDuration(loaded[0].durationList[0] ?? 5);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setModelsError(
            sanitizeUserMessage(
              err instanceof Error ? err.message : "Modelle konnten nicht geladen werden"
            )
          );
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
    if (!selectedModel) return;
    if (!availableDurations.includes(duration)) {
      setDuration(availableDurations[0] ?? selectedModel.durationList[0] ?? 5);
    }
    if (
      !selectedModel.resolutionList.some(
        (item) => item.value.toLowerCase() === resolution.toLowerCase()
      )
    ) {
      setResolution(selectedModel.resolutionList[0]?.value ?? "720p");
    }
  }, [selectedModel, availableDurations, duration, resolution]);

  const loadGalleryImages = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("generations")
      .select("id, prompt, result")
      .eq("user_id", user.id)
      .eq("type", "image")
      .order("created_at", { ascending: false })
      .limit(12);

    if (!data) return;

    setGalleryImages(
      data
        .map((row) => {
          const asset = parseGenerationAssetResult(row.result);
          if (!asset?.previewPath && !asset?.finalPath) return null;
          return {
            id: row.id,
            prompt: row.prompt,
            previewUrl: `/api/generated-image/${row.id}?variant=preview`,
          };
        })
        .filter((item): item is GalleryImage => item !== null)
    );
  }, []);

  useEffect(() => {
    loadGalleryImages();
  }, [loadGalleryImages]);

  useEffect(() => {
    const generation = searchParams.get("generation");
    if (generation) {
      setGenerationId(generation);
      setVideoUrl(`/api/generated-video/${generation}`);
    }
    const imageId = searchParams.get("imageId");
    if (imageId) {
      const url = `/api/generated-image/${imageId}?variant=preview`;
      setImageUrl(url);
      setImagePreview(url);
      setGalleryUrlInput(url);
    }
  }, [searchParams]);

  const handleFile = (file: File, target: "source" | "lastFrame") => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (target === "source") {
        setImageUrl(dataUrl);
        setImagePreview(dataUrl);
        setGalleryUrlInput("");
        setVideoUrl(null);
        setGenerationId(null);
      } else {
        setLastFrameUrl(dataUrl);
        setLastFramePreview(dataUrl);
      }
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const applyGalleryUrl = () => {
    const trimmed = galleryUrlInput.trim();
    if (!trimmed) return;
    setImageUrl(trimmed);
    setImagePreview(trimmed);
    setVideoUrl(null);
    setGenerationId(null);
    setError(null);
  };

  const selectGalleryImage = (item: GalleryImage) => {
    setImageUrl(item.previewUrl);
    setImagePreview(item.previewUrl);
    setGalleryUrlInput(item.previewUrl);
    if (!prompt.trim() && item.prompt) {
      setPrompt(item.prompt);
    }
    setVideoUrl(null);
    setGenerationId(null);
    setError(null);
  };

  const pollJobStatus = useCallback(
    async (jobId: string) => {
      try {
        const res = await fetch(
          `/api/seedance/status?jobId=${encodeURIComponent(jobId)}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Status-Abfrage fehlgeschlagen");
        }

        if (data.status === "completed" && data.videoUrl) {
          stopTimers();
          setGenerating(false);
          setVideoUrl(data.videoUrl);
          setGenerationId(data.generationId ?? null);
          reloadCredits();
          window.dispatchEvent(new CustomEvent("credits-updated"));
          await loadGalleryImages();
          return;
        }

        if (data.status === "failed") {
          stopTimers();
          setGenerating(false);
          const refundNote = data.refunded
            ? " Credits wurden zurückerstattet."
            : "";
          setError(
            sanitizeUserMessage(
              (data.error ?? "Video-Generierung fehlgeschlagen") + refundNote
            )
          );
          reloadCredits();
          window.dispatchEvent(new CustomEvent("credits-updated"));
        }
      } catch (err: unknown) {
        stopTimers();
        setGenerating(false);
        setError(
          sanitizeUserMessage(
            err instanceof Error ? err.message : "Video-Generierung fehlgeschlagen"
          )
        );
      }
    },
    [loadGalleryImages, reloadCredits, stopTimers]
  );

  const startPolling = useCallback(
    (jobId: string) => {
      stopTimers();
      setElapsedSec(0);
      elapsedRef.current = setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);
      void pollJobStatus(jobId);
      pollRef.current = setInterval(() => void pollJobStatus(jobId), 3000);
    },
    [pollJobStatus, stopTimers]
  );

  const runGenerate = async () => {
    if (!selectedModel) {
      setError("Bitte wähle ein Video-Modell.");
      return;
    }
    if (!imageUrl?.trim()) {
      setError("Bitte lade zuerst ein Bild hoch oder wähle eines aus der Gallery.");
      return;
    }
    if (!prompt.trim()) {
      setError("Bitte beschreibe die gewünschte Bewegung.");
      return;
    }

    setGenerating(true);
    setError(null);
    setVideoUrl(null);
    setGenerationId(null);
    setElapsedSec(0);
    stopTimers();

    try {
      const res = await fetch("/api/seedance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          prompt: prompt.trim(),
          modelId: selectedModel.value,
          duration,
          resolution,
          lastFrameUrl: lastFrameUrl ?? undefined,
        }),
      });
      const data = await res.json();
      if (
        handleApiInsufficientCredits(
          res.status,
          data as { error?: string; credits?: number },
          creditCost
        )
      ) {
        stopTimers();
        setGenerating(false);
        return;
      }
      if (!res.ok || !data.jobId) {
        throw new Error(data.error ?? "Video-Generierung fehlgeschlagen");
      }
      if (data.generationId) {
        setGenerationId(data.generationId);
      }
      startPolling(data.jobId as string);
    } catch (err: unknown) {
      stopTimers();
      setGenerating(false);
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : "Video-Generierung fehlgeschlagen"
        )
      );
    }
  };

  const hasImage = Boolean(imageUrl?.trim());
  const canGenerate =
    hasImage &&
    prompt.trim().length > 0 &&
    !generating &&
    !modelsLoading &&
    !!selectedModel;

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Film size={32} color="#B4FF00" strokeWidth={2.2} />
          <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(2rem,4vw,3rem)] tracking-wide text-[#F0EFE8]">
            {SEEDANCE_UI_NAME}
          </h1>
        </div>
        <p className="text-[0.95rem] leading-relaxed text-[rgba(255,255,255,0.65)]">
          Statisches Bild in bewegtes Video — Modell, Dauer und Auflösung frei wählen.
          {credits != null && creditCost > 0 && (
            <span className="ml-2 text-[#B4FF00]">
              · Kosten: {creditCost} Credits
            </span>
          )}
        </p>
      </div>

      {modelsLoading && (
        <p className="mb-6 text-sm text-zinc-400">Video-Modelle werden geladen…</p>
      )}
      {modelsError && (
        <p className="mb-6 text-sm text-[#ff6b7a]">{modelsError}</p>
      )}

      {!modelsLoading && models.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold text-[#F0EFE8]">Video-Modell</p>
          <div className="flex flex-col gap-4">
            {Object.entries(groupedModels).map(([providerLabel, providerModels]) => (
              <div key={providerLabel}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)]">
                  {providerLabel}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {providerModels.map((model) => {
                    const active = model.value === selectedModelId;
                    return (
                      <button
                        key={model.value}
                        type="button"
                        onClick={() => {
                          setSelectedModelId(model.value);
                          setResolution(model.resolutionList[0]?.value ?? "720p");
                          setDuration(model.durationList[0] ?? 5);
                          setError(null);
                          if (!model.supportedLastFrame) {
                            setLastFrameUrl(null);
                            setLastFramePreview(null);
                          }
                        }}
                        className={`min-h-[44px] rounded-xl border px-4 py-3 text-left transition-colors ${
                          active
                            ? "border-[#B4FF00]/50 bg-[#B4FF00]/10"
                            : "border-white/12 bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-zinc-100">
                          {model.label}
                          <span className="ml-2 text-xs font-medium text-zinc-400">
                            {model.providerLabel}
                          </span>
                          {model.isPro && (
                            <span className="ml-2 rounded border border-[#B4FF00]/35 bg-[#B4FF00]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#B4FF00]">
                              Pro
                            </span>
                          )}
                        </span>
                        {model.description && (
                          <span className="mt-1 block text-xs text-zinc-400">
                            {model.description}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[2fr_3fr] lg:gap-10">
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-3 text-sm font-semibold text-[#F0EFE8]">Quellbild</p>
            <div
              role="button"
              tabIndex={0}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file, "source");
              }}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
              }}
              className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-8 transition-colors ${
                dragOver
                  ? "border-[#B4FF00] bg-[#B4FF00]/8"
                  : "border-white/15 bg-white/[0.02] hover:border-[#B4FF00]/40"
              }`}
            >
              {imagePreview ? (
                <div className="relative h-40 w-full max-w-[280px] overflow-hidden rounded-xl border border-white/10">
                  <Image
                    src={imagePreview}
                    alt="Quellbild"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : (
                <>
                  <Upload size={28} color="#B4FF00" />
                  <p className="text-center text-sm text-[rgba(255,255,255,0.65)]">
                    Bild hier ablegen oder klicken zum Hochladen
                  </p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file, "source");
                }}
              />
            </div>
          </div>

          {selectedModel?.supportedLastFrame && (
            <div>
              <p className="mb-3 text-sm font-semibold text-[#F0EFE8]">
                Endframe (optional)
              </p>
              <div
                role="button"
                tabIndex={0}
                onClick={() => lastFrameRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") lastFrameRef.current?.click();
                }}
                className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 hover:border-[#B4FF00]/40"
              >
                {lastFramePreview ? (
                  <div className="relative h-24 w-full max-w-[200px] overflow-hidden rounded-xl border border-white/10">
                    <Image
                      src={lastFramePreview}
                      alt="Endframe"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-center text-xs text-[rgba(255,255,255,0.55)]">
                    Optionales Endbild für Übergänge
                  </p>
                )}
                <input
                  ref={lastFrameRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file, "lastFrame");
                  }}
                />
              </div>
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-[#F0EFE8]">
              <Link2 size={16} color="#B4FF00" />
              URL aus Gallery einfügen
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={galleryUrlInput}
                onChange={(e) => setGalleryUrlInput(e.target.value)}
                placeholder="/api/generated-image/… oder https://…"
                className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-[#F0EFE8] outline-none focus:border-[#B4FF00]/40 font-[family-name:var(--font-dm)]"
              />
              <button
                type="button"
                onClick={applyGalleryUrl}
                className="shrink-0 rounded-xl border border-white/12 px-4 py-3 text-sm font-semibold text-[#F0EFE8] hover:border-[#B4FF00]/40"
              >
                Übernehmen
              </button>
            </div>
          </label>

          {galleryImages.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.65)]">
                Aus deiner Gallery
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {galleryImages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectGalleryImage(item)}
                    className={`relative aspect-square overflow-hidden rounded-lg border transition-colors ${
                      imageUrl === item.previewUrl
                        ? "border-[#B4FF00] ring-1 ring-[#B4FF00]/50"
                        : "border-white/10 hover:border-[#B4FF00]/40"
                    }`}
                  >
                    <Image
                      src={item.previewUrl}
                      alt={item.prompt || "Gallery-Bild"}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#F0EFE8]">
              Bewegung beschreiben
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Beschreibe die Bewegung (z.B. Kamera zoomt langsam rein, Wind bewegt die Haare)"
              rows={4}
              className="w-full resize-y rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3.5 text-base leading-relaxed text-[#F0EFE8] outline-none focus:border-[#B4FF00]/40 font-[family-name:var(--font-dm)]"
            />
          </label>

          {selectedModel && (
            <>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#F0EFE8]">Dauer</span>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-[#F0EFE8] outline-none focus:border-[#B4FF00]/40 font-[family-name:var(--font-dm)]"
                >
                  {availableDurations.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec} Sekunden
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#F0EFE8]">Auflösung</span>
                <div className="flex flex-col gap-2">
                  {selectedModel.resolutionList.map((res) => (
                    <button
                      key={res.value}
                      type="button"
                      onClick={() => {
                        setResolution(res.value);
                        const durations = getDurationsForSelection(
                          selectedModel,
                          res.value
                        );
                        if (!durations.includes(duration)) {
                          setDuration(durations[0] ?? duration);
                        }
                      }}
                      className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                        resolution.toLowerCase() === res.value.toLowerCase()
                          ? "border-[#B4FF00]/50 bg-[#B4FF00]/10 text-[#B4FF00]"
                          : "border-white/12 bg-white/[0.02] text-zinc-300 hover:border-white/20"
                      }`}
                    >
                      {res.label} — {res.unit_credit} Credits/s
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm font-semibold text-[#B4FF00]">
                Kosten: {creditCost} Credits
              </p>
            </>
          )}

          <button
            type="button"
            disabled={!canGenerate}
            onClick={runGenerate}
            className="rounded-xl bg-[#B4FF00] py-3.5 font-[family-name:var(--font-bebas)] text-xl tracking-wide text-[#060608] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {generating ? "Video wird generiert…" : "Video generieren"}
          </button>

          {!hasImage && (
            <p className="text-xs text-[rgba(255,255,255,0.45)]">
              Lade ein Bild hoch oder wähle eines aus der Gallery, um fortzufahren.
            </p>
          )}

          {error && <p className="text-sm text-[#ff6b7a]">{error}</p>}
        </div>

        <div className="flex min-h-[420px] select-none flex-col gap-4 rounded-2xl border border-white/8 bg-[#060608] p-4">
          {!videoUrl && !generating && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <Film size={48} color="rgba(255,255,255,0.65)" strokeWidth={1.5} />
              <p className="text-sm text-[rgba(255,255,255,0.65)]">
                Dein generiertes Video erscheint hier
              </p>
            </div>
          )}

          {generating && (
            <div className="flex flex-1 flex-col justify-center gap-5 p-6">
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <div className="h-full w-full animate-pulse rounded-full bg-[#B4FF00]/60" />
              </div>
              <p className="text-center text-sm text-[#B4FF00]">
                Video wird generiert… {elapsedSec}s
              </p>
              <p className="text-center text-xs text-[rgba(255,255,255,0.45)]">
                Typisch 30–120 Sekunden · bitte Tab offen lassen
              </p>
              {imagePreview && (
                <div className="relative mx-auto mt-2 h-32 w-32 overflow-hidden rounded-xl border border-white/10 opacity-60">
                  <Image
                    src={imagePreview}
                    alt="Quellbild"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {videoUrl && !generating && (
            <div className="flex flex-1 flex-col gap-4">
              <video
                src={videoUrl}
                controls
                playsInline
                className="max-h-[520px] w-full rounded-xl border border-[#B4FF00]/25 bg-black"
              />
              <div className="flex flex-wrap gap-2">
                {generationId && (
                  <a
                    href={`/api/generated-video/${generationId}?download=1`}
                    className="rounded-lg bg-[#B4FF00] px-3 py-2 text-sm font-semibold text-[#060608]"
                  >
                    MP4 herunterladen
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setVideoUrl(null);
                    setGenerationId(null);
                  }}
                  className="rounded-lg border border-white/12 px-3 py-2 text-sm text-[rgba(255,255,255,0.65)]"
                >
                  Neues Video
                </button>
              </div>
              <AiOutputDisclaimer />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

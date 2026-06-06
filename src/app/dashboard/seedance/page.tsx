"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Film, Link2, Upload } from "lucide-react";
import { parseGenerationAssetResult } from "@/lib/generation-asset-types";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import { SEEDANCE_CREDIT_COST, SEEDANCE_UI_NAME } from "@/lib/seedance-config";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { createClient } from "@/lib/supabase/client";
import { useUserCredits } from "@/hooks/use-user-credits";

const PROGRESS_TIPS = [
  "Bild wird analysiert…",
  "Bewegung wird berechnet…",
  "Video wird gerendert…",
  "Audio wird synchronisiert…",
  "Fast fertig — das dauert 30–90 Sekunden…",
];

type GalleryImage = {
  id: string;
  prompt: string;
  previewUrl: string;
};

export default function SeedancePage() {
  const searchParams = useSearchParams();
  const { credits, reload: reloadCredits } = useUserCredits();
  const fileRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [prompt, setPrompt] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tipRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimers = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
    if (tipRef.current) {
      clearInterval(tipRef.current);
      tipRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimers(), [stopTimers]);

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

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageUrl(dataUrl);
      setImagePreview(dataUrl);
      setGalleryUrlInput("");
      setVideoUrl(null);
      setGenerationId(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const applyGalleryUrl = () => {
    const trimmed = galleryUrlInput.trim();
    if (!trimmed) return;
    setImageUrl(trimmed);
    setImagePreview(
      trimmed.startsWith("data:") || trimmed.startsWith("http")
        ? trimmed
        : trimmed
    );
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

  const startProgress = () => {
    setProgress(4);
    setTipIndex(0);
    stopTimers();

    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        const step = p < 40 ? 2.5 : p < 75 ? 1.2 : 0.4;
        return Math.min(92, p + step);
      });
    }, 900);

    tipRef.current = setInterval(() => {
      setTipIndex((i) => (i + 1) % PROGRESS_TIPS.length);
    }, 4000);
  };

  const runGenerate = async () => {
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
    startProgress();

    try {
      const res = await fetch("/api/seedance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt: prompt.trim(),
        }),
      });
      const data = await res.json();
      if (
        handleApiInsufficientCredits(
          res.status,
          data as { error?: string; credits?: number },
          SEEDANCE_CREDIT_COST
        )
      ) {
        stopTimers();
        setGenerating(false);
        return;
      }
      if (!res.ok || !data.videoUrl) {
        throw new Error(data.error ?? "Video-Generierung fehlgeschlagen");
      }
      setProgress(100);
      setVideoUrl(data.videoUrl);
      setGenerationId(data.generationId ?? null);
      reloadCredits();
      window.dispatchEvent(new CustomEvent("credits-updated"));
      await loadGalleryImages();
    } catch (err: unknown) {
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : "Video-Generierung fehlgeschlagen"
        )
      );
    } finally {
      stopTimers();
      setGenerating(false);
    }
  };

  const hasImage = Boolean(imageUrl?.trim());
  const canGenerate = hasImage && prompt.trim().length > 0 && !generating;

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
          Wandle dein Bild in ein bewegtes Video — mit KI-generiertem Sound.
          {credits != null && (
            <span className="ml-2 text-[#B4FF00]">
              · {SEEDANCE_CREDIT_COST} Credits pro Video
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_3fr] lg:gap-10">
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-3 text-sm font-semibold text-[#F0EFE8]">
              Quellbild
            </p>
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
                if (file) handleFile(file);
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
                  if (file) handleFile(file);
                }}
              />
            </div>
          </div>

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
                <div
                  className="h-full rounded-full bg-[#B4FF00] transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-[#B4FF00]">
                {PROGRESS_TIPS[tipIndex]}
              </p>
              <p className="text-center text-xs text-[rgba(255,255,255,0.45)]">
                {Math.round(progress)}% · typisch 30–90 Sekunden
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

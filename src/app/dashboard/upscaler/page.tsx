"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Upload, ZoomIn, X } from "lucide-react";
import { ImageCompareSlider } from "@/components/image-generator/ImageCompareSlider";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { parseGenerationAssetResult } from "@/lib/generation-asset-types";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import { createClient } from "@/lib/supabase/client";
import { useUserCredits } from "@/hooks/use-user-credits";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type GalleryImage = {
  id: string;
  prompt: string;
  previewUrl: string;
  hasUpscaled: boolean;
};

type UploadedImage = {
  previewUrl: string;
  dataUrl: string;
  fileName: string;
};

function cardStyle() {
  return {
    padding: 24,
    borderRadius: 16,
    background: "#0f0f12",
    border: "1px solid rgba(255,255,255,0.07)",
  } as const;
}

function UpscalerPageInner() {
  const t = useTranslations("upscalerPage");
  const tImg = useTranslations("imageGenerator");
  const searchParams = useSearchParams();
  const { credits, reload: reloadCredits } = useUserCredits();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadedImage | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compare, setCompare] = useState<{
    originalUrl: string;
    upscaledUrl: string;
  } | null>(null);

  const creditCost = IMAGE_GEN_CREDITS.upscale;
  const hasActiveImage = Boolean(selectedId || upload);

  const loadImages = useCallback(async () => {
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
      .limit(24);

    if (!data) return;

    const rows: GalleryImage[] = [];
    for (const row of data) {
      const asset = parseGenerationAssetResult(row.result);
      if (!asset?.sourcePath && !asset?.previewPath) continue;
      rows.push({
        id: row.id,
        prompt: row.prompt?.slice(0, 80) ?? "",
        previewUrl: `/api/generated-image/${row.id}?variant=preview`,
        hasUpscaled: Boolean(asset.upscaledPath),
      });
    }
    setImages(rows);
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  useEffect(() => {
    const preselect = searchParams.get("generation");
    if (preselect) {
      setSelectedId(preselect);
      setUpload(null);
    }
  }, [searchParams]);

  const selectGalleryImage = (id: string) => {
    setSelectedId(id);
    setUpload(null);
    setCompare(null);
    setError(null);
  };

  const clearUpload = () => {
    setUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("upload_invalid_type"));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(t("upload_too_large"));
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUpload({
        previewUrl: dataUrl,
        dataUrl,
        fileName: file.name,
      });
      setSelectedId(null);
      setCompare(null);
    };
    reader.onerror = () => {
      setError(t("upload_read_error"));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const runUpscale = async () => {
    if (!hasActiveImage) return;
    setLoading(true);
    setError(null);
    setCompare(null);
    try {
      const res = await fetch("/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          upload
            ? { imageDataUrl: upload.dataUrl }
            : { generationId: selectedId }
        ),
      });
      const data = await res.json();
      if (
        handleApiInsufficientCredits(
          res.status,
          data as { error?: string; credits?: number },
          creditCost
        )
      ) {
        return;
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || tImg("error_upscale"));
      }
      setCompare({
        originalUrl: data.originalUrl,
        upscaledUrl: data.upscaledUrl,
      });
      if (data.generationId) {
        setSelectedId(data.generationId);
        setUpload(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
      window.dispatchEvent(new Event("credits-updated"));
      await reloadCredits();
      await loadImages();
    } catch (err: unknown) {
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : tImg("error_upscale")
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#B4FF00]/10 text-[#B4FF00]">
          <ZoomIn size={22} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#F0EFE8]">{t("title")}</h1>
          <p className="mt-1 text-sm text-white/55">{t("subtitle")}</p>
          {credits != null && (
            <p className="mt-2 text-xs text-white/40">
              {t("credits_hint", { cost: creditCost, balance: credits })}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div style={cardStyle()} className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-white/85">
          {t("upload_title")}
        </h2>

        <div
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-4 cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all ${
            dragOver
              ? "border-[#B4FF00] bg-[#B4FF00]/5"
              : "border-white/15 bg-[#0a0a0d] hover:border-white/25"
          }`}
        >
          <Upload
            size={28}
            className={`mx-auto mb-3 ${dragOver ? "text-[#B4FF00]" : "text-white/45"}`}
          />
          <p className="text-sm font-medium text-white/85">{t("upload_drop")}</p>
          <p className="mt-1 text-xs text-white/45">{t("upload_hint")}</p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-white/15 bg-[#141418] px-4 text-sm font-semibold text-[#F0EFE8] transition-colors hover:border-[#B4FF00]/40 hover:text-[#B4FF00]"
          >
            <Upload size={16} />
            {t("upload_button")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {upload && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-medium text-[#B4FF00]">
              {t("upload_active")}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-[#B4FF00] ring-2 ring-[#B4FF00]/30">
                <Image
                  src={upload.previewUrl}
                  alt={upload.fileName}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={clearUpload}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white/90 hover:bg-black/90"
                  aria-label={t("upload_clear")}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        <h2 className="mb-3 text-sm font-semibold text-white/85">
          {t("pick_image")}
        </h2>
        {images.length === 0 ? (
          <p className="text-sm text-white/45">{t("empty_gallery")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {images.map((img) => {
              const active = selectedId === img.id && !upload;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => selectGalleryImage(img.id)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    active
                      ? "border-[#B4FF00] ring-2 ring-[#B4FF00]/30"
                      : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <Image
                    src={img.previewUrl}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  {img.hasUpscaled && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[0.6rem] text-[#B4FF00]">
                      2×
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          disabled={!hasActiveImage || loading}
          onClick={runUpscale}
          className="mt-4 min-h-[44px] w-full rounded-xl bg-[#B4FF00] text-sm font-bold text-[#060608] disabled:opacity-50"
        >
          {loading
            ? tImg("loading_upscale")
            : t("upscale_cta", { cost: creditCost })}
        </button>
      </div>

      {compare && (
        <div style={cardStyle()}>
          <h2 className="mb-3 text-sm font-semibold text-white/85">
            {t("result_title")}
          </h2>
          <ImageCompareSlider
            beforeSrc={compare.originalUrl}
            afterSrc={compare.upscaledUrl}
            beforeAlt={tImg("compare_before")}
            afterAlt={tImg("compare_after")}
          />
          <AiOutputDisclaimer />
        </div>
      )}
    </div>
  );
}

export default function UpscalerPage() {
  return (
    <Suspense fallback={null}>
      <UpscalerPageInner />
    </Suspense>
  );
}

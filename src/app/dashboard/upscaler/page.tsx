"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ZoomIn } from "lucide-react";
import { ImageCompareSlider } from "@/components/image-generator/ImageCompareSlider";
import { parseGenerationAssetResult } from "@/lib/generation-asset-types";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { handleApiInsufficientCredits, handleInsufficientCredits } from "@/lib/client-credits-ui";
import { createClient } from "@/lib/supabase/client";
import { useUserCredits } from "@/hooks/use-user-credits";

type GalleryImage = {
  id: string;
  prompt: string;
  previewUrl: string;
  hasUpscaled: boolean;
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

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compare, setCompare] = useState<{
    originalUrl: string;
    upscaledUrl: string;
  } | null>(null);

  const creditCost = IMAGE_GEN_CREDITS.upscale;

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
    if (preselect) setSelectedId(preselect);
  }, [searchParams]);

  const runUpscale = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    setCompare(null);
    try {
      const res = await fetch("/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId: selectedId }),
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
          {t("pick_image")}
        </h2>
        {images.length === 0 ? (
          <p className="text-sm text-white/45">{t("empty_gallery")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {images.map((img) => {
              const active = selectedId === img.id;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(img.id);
                    setCompare(null);
                  }}
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
          disabled={!selectedId || loading}
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

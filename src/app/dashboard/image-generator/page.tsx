"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ImageCompareSlider } from "@/components/image-generator/ImageCompareSlider";
import { ProtectedGeneratedImage } from "@/components/generated/ProtectedGeneratedImage";
import { TablerPhoto } from "@/components/icons/TablerPhoto";
import { parseGenerationAssetResult } from "@/lib/generation-asset-types";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import {
  CATEGORY_PROMPTS,
  IMAGE_CATEGORY_KEYS,
  type FalImageSize,
  type ImageCategoryKey,
  uiFormatToImageSize,
} from "@/lib/generation-config";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import {
  IMAGE_GEN_CREDITS,
} from "@/lib/image-generator-credits";
import { createClient } from "@/lib/supabase/client";

type UiFormat = "1:1" | "16:9" | "9:16" | "4:3";

const CATEGORY_ICONS: Record<ImageCategoryKey, string> = {
  portrait: "👤",
  creator: "🎬",
  cinematic: "🎥",
  product: "📦",
  thumbnail: "▶️",
  avatar: "🤖",
  background: "🖼️",
  lifestyle: "✨",
  viral: "🔥",
  darknoir: "🌃",
};

type GenerationMeta = {
  generationId: string;
  imageUrl: string;
  model?: string;
  width?: number;
  height?: number;
  generationTimeMs?: number;
  downloadPaid?: boolean;
  upscaledUrl?: string;
  originalUrl?: string;
};

export default function ImageGeneratorPage() {
  const t = useTranslations("imageGenerator");
  const searchParams = useSearchParams();
  const loraId = searchParams.get("loraId");
  const loraTrigger = searchParams.get("trigger");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<ImageCategoryKey>("creator");
  const [format, setFormat] = useState<UiFormat>("16:9");
  const [loading, setLoading] = useState(false);
  const [loadingHighRes, setLoadingHighRes] = useState(false);
  const [upscaleLoading, setUpscaleLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [variationLoading, setVariationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationMeta | null>(null);
  const [variation, setVariation] = useState<GenerationMeta | null>(null);
  const [compare, setCompare] = useState<{
    originalUrl: string;
    upscaledUrl: string;
  } | null>(null);
  const [history, setHistory] = useState<
    {
      id: string;
      prompt: string;
      created_at: string;
      result: ReturnType<typeof parseGenerationAssetResult>;
    }[]
  >([]);

  const aspectRatio: FalImageSize = uiFormatToImageSize(format);

  const loadHistory = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("generations")
      .select("id, prompt, created_at, result")
      .eq("user_id", user.id)
      .eq("type", "image")
      .order("created_at", { ascending: false })
      .limit(8);
    if (data) {
      setHistory(
        data.map((row) => ({
          id: row.id,
          prompt: row.prompt,
          created_at: row.created_at,
          result: parseGenerationAssetResult(row.result),
        }))
      );
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const runGenerate = async (highRes: boolean) => {
    if (!prompt.trim()) {
      setError(t("error_missing_prompt"));
      return;
    }
    setError(null);
    if (highRes) setLoadingHighRes(true);
    else setLoading(true);
    setCompare(null);
    setVariation(null);

    try {
      const endpoint = loraId ? "/api/lora/generate" : "/api/generate-image";
      const body = loraId
        ? {
            loraId,
            prompt: loraTrigger ? `${prompt}, ${loraTrigger}` : prompt,
            imageSize: aspectRatio,
          }
        : {
            prompt,
            category,
            aspectRatio,
            highRes,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const creditCost = highRes
        ? IMAGE_GEN_CREDITS.highRes
        : IMAGE_GEN_CREDITS.standard;
      if (
        handleApiInsufficientCredits(
          res.status,
          data as { error?: string; credits?: number },
          creditCost
        )
      ) {
        return;
      }
      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error || t("error_generic"));
      }
      setResult({
        generationId: data.generationId,
        imageUrl: data.imageUrl,
        model: data.model,
        width: data.width,
        height: data.height,
        generationTimeMs: data.generationTimeMs,
        downloadPaid: false,
      });
      window.dispatchEvent(new Event("credits-updated"));
      await loadHistory();
    } catch (err: unknown) {
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : t("error_generic")
        )
      );
    } finally {
      setLoading(false);
      setLoadingHighRes(false);
    }
  };

  const runVariation = async () => {
    if (!prompt.trim() || !result?.generationId) return;
    setVariationLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          category,
          aspectRatio,
          highRes: false,
          variation: true,
          parentGenerationId: result.generationId,
        }),
      });
      const data = await res.json();
      if (
        handleApiInsufficientCredits(
          res.status,
          data as { error?: string; credits?: number },
          IMAGE_GEN_CREDITS.variation
        )
      ) {
        return;
      }
      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error || t("error_generic"));
      }
      setVariation({
        generationId: data.generationId,
        imageUrl: data.imageUrl,
        model: data.model,
        width: data.width,
        height: data.height,
        generationTimeMs: data.generationTimeMs,
      });
      window.dispatchEvent(new Event("credits-updated"));
      await loadHistory();
    } catch (err: unknown) {
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : t("error_generic")
        )
      );
    } finally {
      setVariationLoading(false);
    }
  };

  const runUpscale = async () => {
    if (!result?.generationId) return;
    setUpscaleLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId: result.generationId }),
      });
      const data = await res.json();
      if (
        handleApiInsufficientCredits(
          res.status,
          data as { error?: string; credits?: number },
          IMAGE_GEN_CREDITS.upscale
        )
      ) {
        return;
      }
      if (!res.ok) throw new Error(data.error || t("error_upscale"));
      setCompare({
        originalUrl: data.originalUrl,
        upscaledUrl: data.upscaledUrl,
      });
      setResult((r) =>
        r
          ? {
              ...r,
              upscaledUrl: data.upscaledUrl,
              originalUrl: data.originalUrl,
            }
          : r
      );
      window.dispatchEvent(new Event("credits-updated"));
    } catch (err: unknown) {
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : t("error_generic")
        )
      );
    } finally {
      setUpscaleLoading(false);
    }
  };

  const runDownloadPurchase = async () => {
    if (!result?.generationId) return;
    setDownloadLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/purchase-image-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId: result.generationId }),
      });
      const data = await res.json();
      if (
        handleApiInsufficientCredits(
          res.status,
          data as { error?: string; credits?: number },
          IMAGE_GEN_CREDITS.download
        )
      ) {
        return;
      }
      if (!res.ok) throw new Error(data.error || t("error_download"));
      setResult((r) =>
        r
          ? {
              ...r,
              imageUrl: data.imageUrl,
              downloadPaid: true,
            }
          : r
      );
      window.dispatchEvent(new Event("credits-updated"));
    } catch (err: unknown) {
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : t("error_generic")
        )
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  const isBusy =
    loading || loadingHighRes || upscaleLoading || downloadLoading || variationLoading;

  const formats: { id: UiFormat; labelKey: string }[] = [
    { id: "1:1", labelKey: "format_1_1" },
    { id: "16:9", labelKey: "format_16_9" },
    { id: "9:16", labelKey: "format_9_16" },
    { id: "4:3", labelKey: "format_4_3" },
  ];

  const restoreFromHistory = (entry: (typeof history)[number]) => {
    if (!entry.result?.previewPath) return;
    setCompare(null);
    setVariation(null);
    const paid = entry.result.downloadPaid === true;
    setResult({
      generationId: entry.id,
      imageUrl: `/api/generated-image/${entry.id}?variant=${paid ? "final" : "preview"}`,
      downloadPaid: paid,
      width: entry.result.width,
      height: entry.result.height,
      upscaledUrl: entry.result.upscaledPath
        ? `/api/generated-image/${entry.id}?variant=upscaled`
        : undefined,
    });
    if (entry.result.upscaledPath) {
      setCompare({
        originalUrl: `/api/generated-image/${entry.id}?variant=source`,
        upscaledUrl: `/api/generated-image/${entry.id}?variant=upscaled`,
      });
    }
  };

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <TablerPhoto size={32} color="#B4FF00" strokeWidth={2.2} />
          <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(2rem,4vw,3rem)] tracking-wide text-[#F0EFE8]">
            {t("title")}
          </h1>
        </div>
        <p className="text-[0.95rem] leading-relaxed text-[rgba(255,255,255,0.65)]">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[2fr_3fr] lg:gap-10" style={{ width: "100%" }}>
        {/* Left column — 40% */}
        <div className="flex min-w-0 flex-col gap-5" style={{ width: "100%" }}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#F0EFE8]">
              {t("prompt_label")}
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("prompt_placeholder")}
              rows={5}
              className="w-full resize-y rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3.5 text-base leading-relaxed text-[#F0EFE8] outline-none focus:border-[#B4FF00]/40 font-[family-name:var(--font-dm)]"
            />
          </label>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#F0EFE8]">
              {t("category_label")}
            </p>
            <div className="flex flex-wrap gap-2">
              {IMAGE_CATEGORY_KEYS.map((key) => {
                const active = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                      active
                        ? "border-[#B4FF00] bg-[#B4FF00]/12 text-[#B4FF00]"
                        : "border-white/12 text-[#F0EFE8]/65 hover:border-white/20"
                    }`}
                  >
                    <span className="text-lg" aria-hidden>
                      {CATEGORY_ICONS[key]}
                    </span>
                    <span className="whitespace-nowrap">
                      {t(`cat_${key}` as "cat_portrait")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[#F0EFE8]">
              {t("format_label")}
            </p>
            <div className="flex flex-wrap gap-2">
              {formats.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-semibold ${
                    format === f.id
                      ? "border-[#B4FF00] bg-[#B4FF00]/12 text-[#B4FF00]"
                      : "border-white/12 text-[#F0EFE8]/65"
                  }`}
                >
                  {t(f.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row" style={{ width: "100%" }}>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => runGenerate(false)}
              className="rounded-xl bg-[#B4FF00] py-3.5 font-[family-name:var(--font-bebas)] text-xl tracking-wide text-[#060608] disabled:opacity-80"
              style={{ flex: 1, minWidth: 0 }}
            >
              {loading ? t("loading_standard") : t("generate_standard")}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => runGenerate(true)}
              className="rounded-xl border border-[#B4FF00]/50 bg-[#B4FF00]/10 py-3.5 font-[family-name:var(--font-bebas)] text-xl tracking-wide text-[#B4FF00] disabled:opacity-80"
              style={{ flex: 1, minWidth: 0 }}
            >
              {loadingHighRes ? t("loading_highres") : t("generate_highres")}
            </button>
          </div>

          {error && (
            <p className="text-sm text-[#ff6b7a]">{error}</p>
          )}

          {history.length > 0 && (
            <div className="mt-2 border-t border-white/8 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.65)]">
                {t("history_title")}
              </p>
              <ul className="max-h-36 space-y-1 overflow-y-auto text-xs">
                {history.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => restoreFromHistory(h)}
                      disabled={!h.result?.previewPath}
                      className="w-full truncate rounded-lg border border-transparent px-2 py-1.5 text-left text-[rgba(255,255,255,0.65)] hover:border-white/10 hover:bg-white/[0.03] hover:text-[#F0EFE8] disabled:opacity-40"
                    >
                      {h.prompt || "—"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column — 60% */}
        <div className="flex min-h-[420px] select-none flex-col gap-4 rounded-2xl border border-white/8 bg-[#060608] p-4">
          {!result && !loading && !loadingHighRes && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <TablerPhoto size={48} color="rgba(255,255,255,0.65)" strokeWidth={1.5} />
              <p className="text-sm text-[rgba(255,255,255,0.65)]">{t("preview_empty")}</p>
            </div>
          )}

          {(loading || loadingHighRes) && (
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="h-full min-h-[320px] animate-pulse rounded-xl bg-white/5" />
              <p className="text-center text-sm text-[rgba(255,255,255,0.65)]">
                {loadingHighRes ? t("loading_highres") : t("loading_standard")}
              </p>
            </div>
          )}

          {result && !loading && !loadingHighRes && (
            <>
              {compare ? (
                <ImageCompareSlider
                  beforeSrc={compare.originalUrl}
                  afterSrc={compare.upscaledUrl}
                  beforeAlt={t("compare_before")}
                  afterAlt={t("compare_after")}
                />
              ) : (
                <ProtectedGeneratedImage
                  src={result.imageUrl}
                  alt={t("result_alt")}
                  locked={!result.downloadPaid}
                  unlockHint={t("watermark_hint")}
                  aspectClassName="min-h-[360px] max-h-[520px] w-full"
                />
              )}

              {variation && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10">
                    <Image
                      src={result.imageUrl}
                      alt={t("variation_a")}
                      fill
                      unoptimized
                      className="object-cover"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-[#B4FF00]/30">
                    <Image
                      src={variation.imageUrl}
                      alt={t("variation_b")}
                      fill
                      unoptimized
                      className="object-cover"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-xs text-[rgba(255,255,255,0.65)]">
                {result.width && result.height && (
                  <span>
                    {t("info_resolution", {
                      w: result.width,
                      h: result.height,
                    })}
                  </span>
                )}
                {result.generationTimeMs != null && (
                  <span>
                    · {t("info_time", { sec: (result.generationTimeMs / 1000).toFixed(1) })}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {!compare && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={runUpscale}
                    className="rounded-lg border border-white/12 px-3 py-2 text-sm font-semibold text-[#F0EFE8] hover:border-[#B4FF00]/40 disabled:opacity-80"
                  >
                    {upscaleLoading ? t("loading_upscale") : t("upscale_button")}
                  </button>
                )}
                <button
                  type="button"
                  disabled={isBusy || result.downloadPaid}
                  onClick={runDownloadPurchase}
                  className="rounded-lg border border-[#B4FF00]/40 bg-[#B4FF00]/10 px-3 py-2 text-sm font-semibold text-[#B4FF00] disabled:opacity-80"
                >
                  {downloadLoading
                    ? t("loading_download")
                    : result.downloadPaid
                      ? t("download_ready")
                      : t("download_button")}
                </button>
                {result.downloadPaid && (
                  <a
                    href={`/api/download/${result.generationId}`}
                    className="rounded-lg bg-[#B4FF00] px-3 py-2 text-sm font-semibold text-[#060608]"
                  >
                    {t("download_file")}
                  </a>
                )}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    setResult(null);
                    setVariation(null);
                    setCompare(null);
                  }}
                  className="rounded-lg border border-white/12 px-3 py-2 text-sm text-[rgba(255,255,255,0.65)]"
                >
                  {t("regenerate")}
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={runVariation}
                  className="rounded-lg border border-white/12 px-3 py-2 text-sm font-semibold text-[#F0EFE8] disabled:opacity-80"
                >
                  {variationLoading ? t("loading_variation") : t("variation_button")}
                </button>
              </div>
              <AiOutputDisclaimer />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Image as ImageIcon } from "lucide-react";
import { ImageCompareSlider } from "@/components/image-generator/ImageCompareSlider";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import {
  CATEGORY_PROMPTS,
  IMAGE_CATEGORY_KEYS,
  type FalImageSize,
  type ImageCategoryKey,
  uiFormatToImageSize,
} from "@/lib/generation-config";
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
    { id: string; prompt: string; created_at: string }[]
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
      .select("id, prompt, created_at")
      .eq("user_id", user.id)
      .eq("type", "image")
      .order("created_at", { ascending: false })
      .limit(8);
    if (data) setHistory(data);
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
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          category,
          aspectRatio,
          highRes,
        }),
      });
      const data = await res.json();
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
      const res = await fetch("/api/upscale-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId: result.generationId }),
      });
      const data = await res.json();
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

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="mb-8">
        <h1
          className="mb-2 font-[family-name:var(--font-bebas)] text-[clamp(2rem,4vw,3rem)] tracking-wide text-[#F0EFE8]"
        >
          {t("title")}
        </h1>
        <p className="text-[0.95rem] leading-relaxed text-[#505055]">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
              {IMAGE_CATEGORY_KEYS.map((key) => {
                const active = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                      active
                        ? "border-[#B4FF00] bg-[#B4FF00]/12 text-[#B4FF00]"
                        : "border-white/12 text-[#F0EFE8]/65 hover:border-white/20"
                    }`}
                  >
                    <span className="text-lg" aria-hidden>
                      {CATEGORY_ICONS[key]}
                    </span>
                    <span className="truncate">
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

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => runGenerate(false)}
              className="flex-1 rounded-xl bg-[#B4FF00] py-3.5 font-[family-name:var(--font-bebas)] text-xl tracking-wide text-[#060608] disabled:opacity-50"
            >
              {loading ? t("loading_standard") : t("generate_standard")}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => runGenerate(true)}
              className="flex-1 rounded-xl border border-[#B4FF00]/50 bg-[#B4FF00]/10 py-3.5 font-[family-name:var(--font-bebas)] text-xl tracking-wide text-[#B4FF00] disabled:opacity-50"
            >
              {loadingHighRes ? t("loading_highres") : t("generate_highres")}
            </button>
          </div>

          {error && (
            <p className="text-sm text-[#ff6b7a]">{error}</p>
          )}

          {history.length > 0 && (
            <div className="mt-2 border-t border-white/8 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#505055]">
                {t("history_title")}
              </p>
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-[#505055]">
                {history.map((h) => (
                  <li key={h.id} className="truncate">
                    {h.prompt || "—"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex min-h-[420px] flex-col gap-4 rounded-2xl border border-white/8 bg-[#060608] p-4">
          {!result && !loading && !loadingHighRes && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <ImageIcon className="h-12 w-12 text-[#505055]" strokeWidth={1.2} />
              <p className="text-sm text-[#505055]">{t("preview_empty")}</p>
            </div>
          )}

          {(loading || loadingHighRes) && (
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="h-full min-h-[320px] animate-pulse rounded-xl bg-white/5" />
              <p className="text-center text-sm text-[#505055]">
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
                <div className="relative aspect-square max-h-[520px] w-full overflow-hidden rounded-xl border border-white/12 sm:aspect-auto sm:min-h-[360px]">
                  <Image
                    src={result.imageUrl}
                    alt={t("result_alt")}
                    fill
                    unoptimized
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`object-contain ${
                      !result.downloadPaid ? "blur-[1px]" : ""
                    }`}
                  />
                  {!result.downloadPaid && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="rotate-[-24deg] text-4xl font-bold text-white/15">
                        InfluexAI
                      </span>
                    </div>
                  )}
                </div>
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

              <div className="flex flex-wrap gap-2 text-xs text-[#505055]">
                {result.width && result.height && (
                  <span>
                    {t("info_resolution", {
                      w: result.width,
                      h: result.height,
                    })}
                  </span>
                )}
                {result.model && (
                  <span>· {t("info_model", { model: result.model })}</span>
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
                    className="rounded-lg border border-white/12 px-3 py-2 text-sm font-semibold text-[#F0EFE8] hover:border-[#B4FF00]/40 disabled:opacity-50"
                  >
                    {upscaleLoading ? t("loading_upscale") : t("upscale_button")}
                  </button>
                )}
                <button
                  type="button"
                  disabled={isBusy || result.downloadPaid}
                  onClick={runDownloadPurchase}
                  className="rounded-lg border border-[#B4FF00]/40 bg-[#B4FF00]/10 px-3 py-2 text-sm font-semibold text-[#B4FF00] disabled:opacity-50"
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
                  className="rounded-lg border border-white/12 px-3 py-2 text-sm text-[#505055]"
                >
                  {t("regenerate")}
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={runVariation}
                  className="rounded-lg border border-white/12 px-3 py-2 text-sm font-semibold text-[#F0EFE8] disabled:opacity-50"
                >
                  {variationLoading ? t("loading_variation") : t("variation_button")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

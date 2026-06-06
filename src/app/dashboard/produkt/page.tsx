"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import {
  PRODUCT_AD_CREDITS,
  PRODUCT_AD_LOCALES,
  PRODUCT_AD_PLATFORMS,
  PRODUCT_AD_STYLES,
  PRODUCT_AD_TEMPLATES,
  type ProductAdPlatform,
  type ProductAdStyle,
} from "@/lib/product-ad-config";
import type { ProductAdScript } from "@/lib/product-ad-script";
import { LOCALE_LANGUAGE_NAMES, type Locale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/client";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";

type Step = "input" | "loading" | "result";

type ScrapedProduct = {
  name: string | null;
  image: string | null;
  price: string | null;
  description: string | null;
  url: string;
};

type AdResult = {
  generationId: string;
  videoUrl: string;
  script: ProductAdScript;
  scriptText: string;
  platform: ProductAdPlatform;
  style: ProductAdStyle;
  variationFocus?: string;
  creditsUsed?: number;
  creditsLeft?: number;
  seed?: number;
};

const LOADING_STEPS = ["scrape", "script", "video"] as const;

function fieldStyle(focused = false) {
  return {
    width: "100%",
    padding: "14px 16px",
    minHeight: 48,
    borderRadius: 10,
    background: "#18181d",
    border: `1px solid ${focused ? "rgba(180,255,0,0.4)" : "rgba(255,255,255,0.09)"}`,
    color: "#F0EFE8",
    fontSize: "16px",
    outline: "none",
    fontFamily: "var(--font-dm), sans-serif",
  } as const;
}

function cardStyle() {
  return {
    padding: 24,
    borderRadius: 16,
    background: "#0f0f12",
    border: "1px solid rgba(255,255,255,0.07)",
  } as const;
}

function ProduktWerbungPageInner() {
  const t = useTranslations("flows.productAd");
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("input");
  const [productUrl, setProductUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState<ProductAdPlatform>("tiktok");
  const [style, setStyle] = useState<ProductAdStyle>("lifestyle");
  const [language, setLanguage] = useState<Locale>("de");
  const [ctaText, setCtaText] = useState("Jetzt kaufen");
  const [upscale, setUpscale] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapePreview, setScrapePreview] = useState<ScrapedProduct | null>(
    null
  );
  const [dragOver, setDragOver] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdResult | null>(null);
  const [batchResults, setBatchResults] = useState<AdResult[] | null>(null);
  const [editingScript, setEditingScript] = useState(false);
  const [editedScriptText, setEditedScriptText] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [history, setHistory] = useState<
    { id: string; prompt: string; created_at: string }[]
  >([]);

  const fileRef = useRef<HTMLInputElement>(null);

  const creditSingle =
    PRODUCT_AD_CREDITS.standard +
    (upscale ? PRODUCT_AD_CREDITS.upscaleExtra : 0);
  const creditBatch =
    PRODUCT_AD_CREDITS.batch +
    (upscale ? PRODUCT_AD_CREDITS.upscaleExtra : 0);

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
      .eq("type", "product_ad")
      .order("created_at", { ascending: false })
      .limit(6);
    if (data) setHistory(data);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const title = searchParams.get("title");
    const description = searchParams.get("description");
    if (title) setProductName(title);
    if (description) setProductDescription(description);
  }, [searchParams]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageUrl(dataUrl);
      setImagePreview(dataUrl);
      setScrapePreview(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleScrape = async () => {
    if (!productUrl.trim()) return;
    setScraping(true);
    setError(null);
    try {
      const res = await fetch("/api/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_scrape"));
      const p = data.product as ScrapedProduct;
      setScrapePreview(p);
      if (p.name) setProductName(p.name);
      if (p.description) setProductDescription(p.description);
      if (p.price) setProductPrice(p.price);
      if (p.image) {
        setImageUrl(p.image);
        setImagePreview(p.image);
      }
    } catch (err) {
      setError(
        sanitizeUserMessage(err instanceof Error ? err.message : t("error_scrape"))
      );
    } finally {
      setScraping(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const tpl = PRODUCT_AD_TEMPLATES.find((x) => x.id === templateId);
    if (!tpl) return;
    setStyle(tpl.style);
    setAudience(tpl.audience);
    setCtaText(tpl.cta);
    if (!productDescription) {
      setProductDescription(tpl.tone);
    }
  };

  const canGenerate = Boolean(productName.trim() && imageUrl && audience.trim());

  const runGenerate = async (opts: { batch?: boolean; variation?: boolean; editedScript?: ProductAdScript }) => {
    if (!canGenerate || !imageUrl) return;
    setError(null);
    setStep("loading");
    setLoadingStep(0);
    setBatchResults(null);
    setResult(null);

    const interval = window.setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 4000);

    try {
      const res = await fetch("/api/product-ad/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName.trim(),
          productDescription: [productDescription, productPrice && `Price: ${productPrice}`]
            .filter(Boolean)
            .join("\n"),
          imageUrl,
          audience: audience.trim(),
          platform,
          style,
          language,
          ctaText: ctaText.trim(),
          batch: opts.batch,
          upscale,
          variation: opts.variation,
          editedScript: opts.editedScript,
          parentGenerationId: result?.generationId,
        }),
      });
      const data = await res.json();
      clearInterval(interval);

      const creditCost = opts.batch ? creditBatch : creditSingle;
      if (
        handleApiInsufficientCredits(
          res.status,
          data as { error?: string; credits?: number },
          creditCost
        )
      ) {
        setStep("input");
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || t("error_generic"));
      }

      if (data.batch && Array.isArray(data.variations)) {
        setBatchResults(data.variations as AdResult[]);
      } else {
        setResult(data as AdResult);
        setEditedScriptText(data.scriptText ?? "");
      }

      setStep("result");
      loadHistory();
      window.dispatchEvent(new Event("credits-updated"));
    } catch (err) {
      clearInterval(interval);
      setError(
        sanitizeUserMessage(err instanceof Error ? err.message : t("error_generic"))
      );
      setStep("input");
    }
  };

  const handleRegenerateWithScript = async () => {
    if (!result) return;
    setRegenerating(true);
    try {
      const parsed: ProductAdScript = {
        hook: result.script.hook,
        story: result.script.story,
        proof: result.script.proof,
        cta: result.script.cta,
        visual_style: result.script.visual_style,
      };
      if (editingScript && editedScriptText) {
        const sections = editedScriptText.split(/\n\n+/);
        sections.forEach((block) => {
          if (block.includes("[HOOK"))
            parsed.hook = block.replace(/^\[HOOK[^\]]*\]\n?/i, "").trim();
          else if (block.includes("[STORY"))
            parsed.story = block.replace(/^\[STORY[^\]]*\]\n?/i, "").trim();
          else if (block.includes("[PROOF"))
            parsed.proof = block.replace(/^\[PROOF[^\]]*\]\n?/i, "").trim();
          else if (block.includes("[CTA"))
            parsed.cta = block.replace(/^\[CTA[^\]]*\]\n?/i, "").trim();
        });
      }
      await runGenerate({ variation: true, editedScript: parsed });
      setEditingScript(false);
    } finally {
      setRegenerating(false);
    }
  };

  const downloadVideo = (generationId: string) => {
    const a = document.createElement("a");
    a.href = `/api/generated-video/${generationId}?download=1`;
    a.download = `product-ad-${generationId.slice(0, 8)}.mp4`;
    a.click();
  };

  const reset = () => {
    setStep("input");
    setResult(null);
    setBatchResults(null);
    setError(null);
  };

  const renderResultPanel = (item: AdResult, label?: string) => (
    <div
      key={item.generationId}
      style={{
        ...cardStyle(),
        display: "flex",
        flexDirection: "column",
        gap: 16,
        flex: 1,
        minWidth: 0,
      }}
    >
      {label && (
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
            color: "#B4FF00",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          aspectRatio: "9/16",
          maxHeight: 480,
          width: "100%",
          margin: "0 auto",
          borderRadius: 12,
          overflow: "hidden",
          background: "#060608",
        }}
      >
        <video
          src={item.videoUrl}
          controls
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: "rgba(180,255,0,0.08)",
          border: "1px solid rgba(180,255,0,0.25)",
        }}
      >
        <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#B4FF00", marginBottom: 8, letterSpacing: "0.12em" }}>
          HOOK
        </div>
        <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#F0EFE8", lineHeight: 1.4 }}>
          {item.script.hook}
        </p>
      </div>
      <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
        {item.scriptText}
      </p>
      <button
        type="button"
        onClick={() => downloadVideo(item.generationId)}
        style={{
          padding: "12px 16px",
          borderRadius: 10,
          border: "none",
          background: "#B4FF00",
          color: "#060608",
          fontWeight: 700,
          cursor: "pointer",
          minHeight: 48,
        }}
      >
        {t("download_mp4")}
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 4px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "0.02em",
            color: "#F0EFE8",
            marginBottom: 6,
          }}
        >
          {t("title")}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}>{t("description")}</p>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
            fontSize: "0.88rem",
          }}
        >
          {error}
        </div>
      )}

      {step === "input" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Templates */}
          <div style={cardStyle()}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {t("templates_label")}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PRODUCT_AD_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl.id)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 99,
                    border: "1px solid rgba(255,255,255,0.09)",
                    background: "#18181d",
                    color: "#F0EFE8",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    minHeight: 44,
                  }}
                >
                  {tpl.icon} {t(`template_${tpl.id}`)}
                </button>
              ))}
            </div>
          </div>

          {/* URL Scrape */}
          <div style={cardStyle()}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {t("url_label")}
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="url"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder={t("url_placeholder")}
                style={fieldStyle()}
              />
              <button
                type="button"
                onClick={handleScrape}
                disabled={!productUrl.trim() || scraping}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(180,255,0,0.35)",
                  background: scraping ? "#18181d" : "rgba(180,255,0,0.12)",
                  color: "#B4FF00",
                  cursor: productUrl.trim() && !scraping ? "pointer" : "default",
                  minHeight: 48,
                  fontWeight: 700,
                }}
              >
                {scraping ? t("scraping") : t("scrape_button")}
              </button>
            </div>
            {scrapePreview && (
              <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: "#18181d", display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                {scrapePreview.image && (
                  <img src={scrapePreview.image} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8 }} />
                )}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 700, color: "#F0EFE8", marginBottom: 4 }}>{scrapePreview.name}</div>
                  {scrapePreview.price && <div style={{ color: "#B4FF00", fontSize: "0.85rem", marginBottom: 4 }}>{scrapePreview.price}</div>}
                  {scrapePreview.description && <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", lineHeight: 1.5 }}>{scrapePreview.description.slice(0, 160)}…</div>}
                </div>
              </div>
            )}
          </div>

          {/* Image upload */}
          <div style={cardStyle()}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {t("image_label")}
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#B4FF00" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 12,
                padding: imagePreview ? 12 : 32,
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "rgba(180,255,0,0.05)" : "#18181d",
                minHeight: 120,
              }}
            >
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {imagePreview ? (
                <img src={imagePreview} alt="" style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 8, margin: "0 auto" }} />
              ) : (
                <p style={{ color: "rgba(255,255,255,0.65)", margin: 0 }}>{t("image_drop")}</p>
              )}
            </div>
          </div>

          {/* Product details */}
          <div style={{ ...cardStyle(), display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("name_label")}</label>
              <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder={t("name_placeholder")} style={fieldStyle()} />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("audience_label")}</label>
              <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder={t("audience_placeholder")} style={fieldStyle()} />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("cta_label")}</label>
              <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder={t("cta_placeholder")} style={fieldStyle()} />
            </div>
          </div>

          {/* Platform */}
          <div style={cardStyle()}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("platform_label")}</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {PRODUCT_AD_PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: platform === p.id ? `${p.color}18` : "#18181d",
                    border: `1px solid ${platform === p.id ? p.color + "55" : "rgba(255,255,255,0.07)"}`,
                    color: platform === p.id ? "#F0EFE8" : "rgba(255,255,255,0.65)",
                    minHeight: 48,
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  {t(`platform_${p.id}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Style + Language */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div style={cardStyle()}>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("style_label")}</label>
              <select value={style} onChange={(e) => setStyle(e.target.value as ProductAdStyle)} style={{ ...fieldStyle(), cursor: "pointer" }}>
                {PRODUCT_AD_STYLES.map((s) => (
                  <option key={s} value={s}>{t(`style_${s}`)}</option>
                ))}
              </select>
            </div>
            <div style={cardStyle()}>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", display: "block", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("language_label")}</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value as Locale)} style={{ ...fieldStyle(), cursor: "pointer" }}>
                {PRODUCT_AD_LOCALES.map((loc) => (
                  <option key={loc} value={loc}>{LOCALE_LANGUAGE_NAMES[loc]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Upscale */}
          <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12, background: "#0f0f12", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", minHeight: 48 }}>
            <input type="checkbox" checked={upscale} onChange={(e) => setUpscale(e.target.checked)} style={{ width: 20, height: 20, accentColor: "#B4FF00" }} />
            <span style={{ color: "#F0EFE8", fontSize: "0.9rem" }}>{t("upscale_label", { credits: PRODUCT_AD_CREDITS.upscaleExtra })}</span>
          </label>

          {/* Actions */}
          <button
            type="button"
            onClick={() => runGenerate({ batch: false })}
            disabled={!canGenerate}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 12,
              border: "none",
              background: canGenerate ? "#B4FF00" : "#2a2a2a",
              color: canGenerate ? "#060608" : "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.3rem",
              letterSpacing: "0.04em",
              cursor: canGenerate ? "pointer" : "default",
              minHeight: 52,
            }}
          >
            {t("generate_button", { credits: creditSingle })}
          </button>
          <button
            type="button"
            onClick={() => runGenerate({ batch: true })}
            disabled={!canGenerate}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "1px solid rgba(180,255,0,0.35)",
              background: "transparent",
              color: canGenerate ? "#B4FF00" : "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.1rem",
              letterSpacing: "0.04em",
              cursor: canGenerate ? "pointer" : "default",
              minHeight: 52,
            }}
          >
            {t("batch_button", { credits: creditBatch })}
          </button>

          {history.length > 0 && (
            <div style={cardStyle()}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("history_title")}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.map((h) => (
                  <div key={h.id} style={{ fontSize: "0.82rem", color: "rgba(240,239,232,0.7)", display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{h.prompt || "Product Ad"}</span>
                    <span style={{ color: "rgba(255,255,255,0.65)", flexShrink: 0 }}>{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === "loading" && (
        <div style={{ ...cardStyle(), textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid #B4FF00", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 24px" }} />
          <h2 style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", fontSize: "1.8rem", color: "#F0EFE8", marginBottom: 10 }}>
            {t(`loading_${LOADING_STEPS[loadingStep]}`)}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}>{t("loading_hint")}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {step === "result" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <button type="button" onClick={reset} style={{ alignSelf: "flex-start", padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.65)", cursor: "pointer", minHeight: 44 }}>
            ← {t("back_button")}
          </button>

          {batchResults ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {batchResults.map((item, i) =>
                renderResultPanel(
                  item,
                  [t("variation_hook"), t("variation_lifestyle"), t("variation_problem")][i]
                )
              )}
            </div>
          ) : result ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "start" }}>
              <div style={{ width: "100%" }}>
                <div style={{ aspectRatio: "9/16", maxWidth: 360, margin: "0 auto", borderRadius: 16, overflow: "hidden", background: "#060608" }}>
                  <video src={result.videoUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <p style={{ textAlign: "center", fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", marginTop: 10 }}>{t("mobile_download_hint")}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14, maxWidth: 360, margin: "14px auto 0" }}>
                  <button type="button" onClick={() => downloadVideo(result.generationId)} style={{ padding: "12px", borderRadius: 10, border: "none", background: "#B4FF00", color: "#060608", fontWeight: 700, cursor: "pointer", minHeight: 48 }}>
                    {t("download_mp4")}
                  </button>
                  <button type="button" onClick={() => runGenerate({ variation: true })} disabled={regenerating} style={{ padding: "12px", borderRadius: 10, border: "1px solid rgba(180,255,0,0.35)", background: "transparent", color: "#B4FF00", fontWeight: 700, cursor: "pointer", minHeight: 48 }}>
                    {t("variation_button")}
                  </button>
                </div>
              </div>
              <div style={{ ...cardStyle(), display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ padding: 16, borderRadius: 12, background: "rgba(180,255,0,0.08)", border: "1px solid rgba(180,255,0,0.25)" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#B4FF00", marginBottom: 8, letterSpacing: "0.12em" }}>HOOK</div>
                  <p style={{ margin: 0, fontSize: "clamp(1.1rem, 3vw, 1.45rem)", fontWeight: 700, color: "#F0EFE8", lineHeight: 1.35 }}>{result.script.hook}</p>
                </div>
                {editingScript ? (
                  <textarea
                    value={editedScriptText}
                    onChange={(e) => setEditedScriptText(e.target.value)}
                    rows={12}
                    style={{ ...fieldStyle(), resize: "vertical", lineHeight: 1.65, fontSize: "0.9rem" }}
                  />
                ) : (
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "rgba(240,239,232,0.8)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{result.scriptText}</p>
                )}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setEditingScript(!editingScript)} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.09)", background: "#18181d", color: "#F0EFE8", cursor: "pointer", minHeight: 44 }}>
                    {editingScript ? t("script_cancel") : t("script_edit")}
                  </button>
                  {editingScript && (
                    <button type="button" onClick={handleRegenerateWithScript} disabled={regenerating} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#B4FF00", color: "#060608", fontWeight: 700, cursor: "pointer", minHeight: 44 }}>
                      {t("script_apply")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function ProduktWerbungPage() {
  const t = useTranslations("flows.productAd");
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.65)" }}>{t("loading_page")}</div>}>
      <ProduktWerbungPageInner />
    </Suspense>
  );
}

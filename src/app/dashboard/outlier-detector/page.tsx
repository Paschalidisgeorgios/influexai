"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeSearchParam, scriptGeneratorTopicUrl } from "@/lib/safe-url-param";
import { Flame } from "lucide-react";
import { detectOutliers } from "@/app/actions/detect-outliers";
import type { OutlierConcept, ViralMechanism } from "@/lib/outlier-analysis";
import { onGenerationActionResult } from "@/lib/handle-generation-result";
import { useOptimisticGeneration } from "@/hooks/use-optimistic-generation";
import { useUserCredits } from "@/hooks/use-user-credits";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

const CREDIT_COST = 3;

type Step = "input" | "loading" | "results";

const LOADING_MESSAGES = [
  "Scanne virale Videos...",
  "Berechne Outlier-Score...",
  "Analysiere Erfolgs-Muster...",
  "Bereite Insights vor...",
];

const PERIOD_OPTIONS = [
  "Letzte 7 Tage",
  "Letzter Monat",
  "Letztes Quartal",
  "Letztes Jahr",
];

const PLATFORM_OPTIONS = ["YouTube Shorts", "YouTube Long-form", "Beide"];

const LANGUAGE_OPTIONS = [
  { code: "de", label: "🇩🇪 Deutsch" },
  { code: "en", label: "🇬🇧 English" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "tr", label: "🇹🇷 Türkçe" },
];

const CHANNEL_SIZES = [
  { id: "Nano (< 10K)", label: "Nano (< 10K)" },
  { id: "Micro (10K-100K)", label: "Micro (10K-100K)" },
  { id: "Mid (100K-1M)", label: "Mid (100K-1M)" },
  { id: "Alle", label: "Alle" },
];

const MECHANISM_META: Record<
  ViralMechanism,
  { label: string; color: string; bg: string }
> = {
  curiosity_gap: {
    label: "Curiosity Gap",
    color: "#c084fc",
    bg: "rgba(168,85,247,0.15)",
  },
  contrarian: {
    label: "Contrarian",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
  },
  transformation: {
    label: "Transformation",
    color: "#10b981",
    bg: "rgba(16,185,129,0.15)",
  },
  list: { label: "List", color: "#06b6d4", bg: "rgba(6,182,212,0.15)" },
  secret: { label: "Secret", color: "#ff6b7a", bg: "rgba(255,107,122,0.15)" },
  controversy: {
    label: "Controversy",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.15)",
  },
};

function scoreColor(score: number) {
  if (score >= 8) return "#B4FF00";
  if (score >= 5) return "#f59e0b";
  return "#ff6b7a";
}

function OutlierDetectorPageInner() {
  const t = useTranslations("flows.outlier");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("input");
  const [niche, setNiche] = useState("");
  const [period, setPeriod] = useState(PERIOD_OPTIONS[1]);
  const [platform, setPlatform] = useState(PLATFORM_OPTIONS[0]);
  const [channelSize, setChannelSize] = useState(CHANNEL_SIZES[3].id);
  const [language, setLanguage] = useState("de");
  const [outliers, setOutliers] = useState<OutlierConcept[]>([]);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [progress, setProgress] = useState(0);
  const analyzeStarted = useRef(false);
  const { credits } = useUserCredits();
  const { generate } = useOptimisticGeneration();

  useEffect(() => {
    const nicheParam = getSafeSearchParam(searchParams, "niche");
    if (nicheParam) setNiche(nicheParam);
  }, [searchParams]);

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    background: "#18181d",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#F0EFE8",
    fontSize: "0.95rem",
    outline: "none" as const,
    fontFamily: "var(--font-dm), sans-serif",
  };

  const labelStyle = {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "rgba(255,255,255,0.65)",
    display: "block" as const,
    marginBottom: 6,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  };

  useEffect(() => {
    if (step !== "loading") return;
    setLoadingMsg(LOADING_MESSAGES[0]);
    setProgress(8);
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIndex]);
    }, 1500);
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 6, 92));
    }, 400);
    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, [step]);

  const runDetect = async () => {
    if (!niche.trim() || analyzeStarted.current) return;
    if (credits === null) {
      setError("Credits werden geladen…");
      return;
    }
    if (credits < CREDIT_COST) {
      onGenerationActionResult({
        success: false,
        error: "Nicht genug Credits.",
        credits,
        required: CREDIT_COST,
      });
      return;
    }
    analyzeStarted.current = true;
    setError(null);
    setSaveWarning(null);
    setStep("loading");
    setProgress(5);

    try {
      const result = await generate(
        () =>
          detectOutliers(niche, period, platform, channelSize, language),
        CREDIT_COST,
        credits
      );
      if (!result.success) {
        onGenerationActionResult(result);
        setError(sanitizeUserMessage(result.error));
        setStep("input");
        setProgress(0);
        return;
      }
      onGenerationActionResult(result);
      setProgress(100);
      setOutliers(result.outliers);
      setSaveWarning(result.saveWarning ?? null);
      setStep("results");
    } catch {
      setError("Analyse fehlgeschlagen.");
      setStep("input");
      setProgress(0);
    } finally {
      analyzeStarted.current = false;
    }
  };

  const goToScript = (item: OutlierConcept) => {
    router.push(scriptGeneratorTopicUrl(item.title));
  };

  const reset = () => {
    setStep("input");
    setOutliers([]);
    setError(null);
    setSaveWarning(null);
    setProgress(0);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 6,
          }}
        >
          <Flame size={32} color="#B4FF00" strokeWidth={2} />
          <h1
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "0.02em",
              color: "#F0EFE8",
            }}
          >
            {t("title")}
          </h1>
        </div>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}>
          {t("description")}
        </p>
      </div>

      <div
        style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}
      >
        {[
          { key: "input", label: "1. Eingabe" },
          { key: "loading", label: "2. Scan" },
          { key: "results", label: "3. Outliers" },
        ].map((s) => {
          const order = ["input", "loading", "results"];
          const current = order.indexOf(step);
          const idx = order.indexOf(s.key);
          const done = current > idx;
          const active = current === idx;
          return (
            <div
              key={s.key}
              style={{
                padding: "5px 14px",
                borderRadius: 99,
                fontSize: "0.78rem",
                fontWeight: 700,
                background: done
                  ? "rgba(180,255,0,0.15)"
                  : active
                    ? "rgba(180,255,0,0.08)"
                    : "rgba(255,255,255,0.04)",
                border: `1px solid ${done ? "rgba(180,255,0,0.4)" : active ? "rgba(180,255,0,0.25)" : "rgba(255,255,255,0.07)"}`,
                color: done || active ? "#B4FF00" : "rgba(255,255,255,0.65)",
              }}
            >
              {done ? "✓ " : ""}
              {s.label}
            </div>
          );
        })}
      </div>

      {error && step === "input" && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 16,
            background: "rgba(255,71,87,0.08)",
            border: "1px solid rgba(255,71,87,0.25)",
            color: "#ff6b7a",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      {step === "input" && (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "#0f0f12",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <label style={labelStyle}>Nische oder Keyword</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="z.B. Morning Routine, Budget Travel, AI Tools"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Zeitraum</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Sprache der Ergebnisse</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {LANGUAGE_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Plattform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {PLATFORM_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Subscriber-Größe des Kanals</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CHANNEL_SIZES.map((cs) => (
                <label
                  key={cs.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    fontSize: "0.88rem",
                    color: channelSize === cs.id ? "#B4FF00" : "rgba(255,255,255,0.65)",
                  }}
                >
                  <input
                    type="radio"
                    name="channelSize"
                    checked={channelSize === cs.id}
                    onChange={() => setChannelSize(cs.id)}
                    style={{ accentColor: "#B4FF00" }}
                  />
                  {cs.label}
                </label>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={runDetect}
            disabled={
              !niche.trim() ||
              credits === null ||
              (credits !== null && credits < CREDIT_COST)
            }
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 11,
              border: "none",
              background: niche.trim() ? "#B4FF00" : "#2a2a2a",
              color: niche.trim() ? "#060608" : "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.2rem",
              letterSpacing: "0.04em",
              cursor: niche.trim() ? "pointer" : "default",
            }}
          >
            OUTLIER FINDEN →
          </button>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            Kostet 3 Credits
          </p>
        </div>
      )}

      {step === "loading" && (
        <div className="space-y-6">
          <div
            style={{
              padding: 40,
              borderRadius: 16,
              background: "#0f0f12",
              border: "1px solid rgba(255,255,255,0.07)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#F0EFE8",
                marginBottom: 20,
                minHeight: 24,
              }}
            >
              {loadingMsg}
            </p>
            <div
              style={{
                height: 6,
                background: "#222228",
                borderRadius: 99,
                overflow: "hidden",
                maxWidth: 400,
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "#B4FF00",
                  borderRadius: 99,
                  transition: "width 0.35s ease",
                }}
              />
            </div>
          </div>
          <CardGridSkeleton count={3} />
        </div>
      )}

      {step === "results" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {saveWarning && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.35)",
                color: "#f59e0b",
                fontSize: "0.875rem",
              }}
            >
              {saveWarning} Die Analyse wurde trotzdem angezeigt.
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <p
              style={{
                color: "#B4FF00",
                fontWeight: 700,
                fontSize: "0.9rem",
                margin: 0,
              }}
            >
              ✓ {outliers.length} Outlier-Konzepte für „{niche}“
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(255,255,255,0.65)",
                fontSize: "0.82rem",
                cursor: "pointer",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              Neue Suche
            </button>
          </div>

          {outliers.map((item, index) => {
            const meta = MECHANISM_META[item.viralMechanism];
            const sc = scoreColor(item.outlierScore);
            return (
              <div
                key={`${item.title}-${index}`}
                style={{
                  padding: 22,
                  borderRadius: 16,
                  background: "#0f0f12",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 99,
                        background: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.color}44`,
                      }}
                    >
                      {meta.label}
                    </span>
                    <h3
                      style={{
                        fontFamily:
                          "var(--font-bebas), 'Bebas Neue', sans-serif",
                        fontSize: "1.35rem",
                        letterSpacing: "0.02em",
                        color: "#F0EFE8",
                        margin: "10px 0 0",
                        lineHeight: 1.15,
                      }}
                    >
                      {item.title}
                    </h3>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.65)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: 4,
                      }}
                    >
                      Outlier Score
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-bebas), sans-serif",
                        fontSize: "clamp(2.5rem, 8vw, 3.5rem)",
                        lineHeight: 1,
                        color: sc,
                      }}
                    >
                      {item.outlierScore}
                    </div>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "rgba(240,239,232,0.65)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  <strong style={{ color: "#F0EFE8" }}>Thumbnail:</strong>{" "}
                  {item.thumbnailConcept}
                </p>

                <div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.65)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    Warum es funktionierte
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      color: "rgba(255,255,255,0.85)",
                      fontSize: "0.85rem",
                      lineHeight: 1.65,
                    }}
                  >
                    {item.whyItWorked.map((b) => (
                      <li key={b} style={{ marginBottom: 4 }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "rgba(180,255,0,0.06)",
                    border: "1px solid rgba(180,255,0,0.15)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: "#B4FF00",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Hook (erste 3 Sekunden)
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.88rem",
                      color: "#F0EFE8",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.hook}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => goToScript(item)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 10,
                    border: "none",
                    background: "#B4FF00",
                    color: "#060608",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    fontFamily: "var(--font-dm), sans-serif",
                  }}
                >
                  Script generieren →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OutlierDetectorPage() {
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <OutlierDetectorPageInner />
    </Suspense>
  );
}

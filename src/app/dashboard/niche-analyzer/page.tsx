"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import {
  analyzeNiche,
  saveNicheChoice,
  type NicheIdea,
} from "@/app/actions/analyze-niche";
import { onGenerationActionResult, shouldShowInlineGenerationError } from "@/lib/handle-generation-result";
import { useOptimisticGeneration } from "@/hooks/use-optimistic-generation";
import { useUserCredits } from "@/hooks/use-user-credits";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { ProgrammaticToolLink } from "@/components/tools/programmatic-tool-link";
import { resolveNicheSlug } from "@/lib/programmatic-seo";

const CREDIT_COST = 2;

type Step = "input" | "loading" | "results";

const LOADING_MESSAGES = [
  "Analysiere Markt...",
  "Suche Outlier-Chancen...",
  "Bewerte Konkurrenz...",
  "Generiere Ideen...",
];

const AUDIENCE_OPTIONS = ["18-24", "25-34", "35-44", "Alle"];
const FORMAT_OPTIONS = ["YouTube Shorts", "Long-form", "Beide"];

const competitionLabel: Record<NicheIdea["competition"], string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
};

const trendLabel: Record<NicheIdea["trend"], string> = {
  rising: "↑ steigend",
  stable: "→ stabil",
  declining: "↓ fallend",
};

function potentialStars(n: number) {
  return "⭐".repeat(Math.min(5, Math.max(1, n)));
}

export default function NicheAnalyzerPage() {
  const t = useTranslations("flows.niche");
  const [step, setStep] = useState<Step>("input");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState(AUDIENCE_OPTIONS[0]);
  const [format, setFormat] = useState(FORMAT_OPTIONS[0]);
  const [niches, setNiches] = useState<NicheIdea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [progress, setProgress] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set());
  const analyzeStarted = useRef(false);
  const { credits } = useUserCredits();
  const { generate } = useOptimisticGeneration();

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

  const runAnalyze = async () => {
    if (!topic.trim() || analyzeStarted.current || credits === null) return;
    analyzeStarted.current = true;
    setError(null);
    setStep("loading");
    setProgress(5);

    try {
      const result = await generate(
        () => analyzeNiche(topic, audience, format),
        CREDIT_COST,
        credits
      );
      if (!result.success) {
        onGenerationActionResult(result);
        if (shouldShowInlineGenerationError(result)) {
          setError(sanitizeUserMessage(result.error));
        }
        setStep("input");
        return;
      }
      onGenerationActionResult(result);
      setProgress(100);
      setNiches(result.niches);
      setStep("results");
    } catch {
      setError("Analyse fehlgeschlagen.");
      setStep("input");
    } finally {
      analyzeStarted.current = false;
    }
  };

  const handleSave = async (niche: NicheIdea) => {
    setSavingId(niche.title);
    const res = await saveNicheChoice(niche);
    setSavingId(null);
    if (res.success) {
      setSavedTitles((prev) => new Set(prev).add(niche.title));
    } else {
      alert(res.error);
    }
  };

  const reset = () => {
    setStep("input");
    setNiches([]);
    setError(null);
    setProgress(0);
    setSavedTitles(new Set());
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 6,
          }}
        >
          <TrendingUp size={32} color="#B4FF00" strokeWidth={2} />
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
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 6,
              background: "rgba(180,255,0,0.12)",
              border: "1px solid rgba(180,255,0,0.35)",
              color: "#B4FF00",
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
            }}
          >
            NEU
          </span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}>
          {t("description")}
        </p>
      </div>

      {/* Step indicator */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}
      >
        {[
          { key: "input", label: "1. Eingabe" },
          { key: "loading", label: "2. Analyse" },
          { key: "results", label: "3. Ergebnisse" },
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

      {/* STEP 1 */}
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
            <label htmlFor="niche-topic" style={labelStyle}>
              Dein Thema / Interesse
            </label>
            <input
              id="niche-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. Fitness, Tech, Kochen, Gaming..."
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Zielgruppe</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Content-Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {FORMAT_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={runAnalyze}
            disabled={!topic.trim()}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 11,
              border: "none",
              background: topic.trim() ? "#B4FF00" : "#2a2a2a",
              color: topic.trim() ? "#060608" : "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.2rem",
              letterSpacing: "0.04em",
              cursor: topic.trim() ? "pointer" : "default",
            }}
          >
            ANALYSIEREN →
          </button>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            Kostet 2 Credits
          </p>
        </div>
      )}

      {/* STEP 2 */}
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

      {/* STEP 3 */}
      {step === "results" && (
        <div
          data-testid="generation-result"
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
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
              ✓ {niches.length} Nischen-Ideen für „{topic}“
            </p>
            {resolveNicheSlug(topic) && (
              <ProgrammaticToolLink
                feature="niche-analyzer"
                nicheText={topic}
                className="text-sm text-[#B4FF00] hover:underline"
              />
            )}
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
              Neue Analyse
            </button>
          </div>

          {niches.map((niche) => (
            <div
              key={niche.title}
              data-testid="niche-card"
              style={{
                padding: 22,
                borderRadius: 16,
                background: "#0f0f12",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                  fontSize: "1.4rem",
                  letterSpacing: "0.02em",
                  color: "#F0EFE8",
                  marginBottom: 8,
                }}
              >
                {niche.title}
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "rgba(240,239,232,0.65)",
                  lineHeight: 1.7,
                  marginBottom: 14,
                }}
              >
                {niche.description}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#F0EFE8",
                  }}
                >
                  Wettbewerb: {competitionLabel[niche.competition]}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: "rgba(180,255,0,0.08)",
                    border: "1px solid rgba(180,255,0,0.2)",
                    color: "#B4FF00",
                  }}
                >
                  Potenzial: {potentialStars(niche.potential)}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#F0EFE8",
                  }}
                >
                  Trend: {trendLabel[niche.trend]}
                </span>
              </div>

              <ul
                style={{
                  margin: "0 0 16px",
                  paddingLeft: 18,
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "0.85rem",
                  lineHeight: 1.65,
                }}
              >
                {niche.videoIdeas.map((idea) => (
                  <li
                    key={idea}
                    data-testid="video-idea"
                    style={{ marginBottom: 4 }}
                  >
                    {idea}
                  </li>
                ))}
              </ul>

              {resolveNicheSlug(niche.title) && (
                <ProgrammaticToolLink
                  feature="niche-analyzer"
                  nicheText={niche.title}
                  className="mb-3 block text-xs text-[#B4FF00]/80 hover:underline"
                />
              )}

              <button
                type="button"
                onClick={() => handleSave(niche)}
                disabled={
                  savingId === niche.title || savedTitles.has(niche.title)
                }
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: 10,
                  border: "none",
                  background: savedTitles.has(niche.title)
                    ? "rgba(180,255,0,0.15)"
                    : "#B4FF00",
                  color: savedTitles.has(niche.title) ? "#B4FF00" : "#060608",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: savedTitles.has(niche.title) ? "default" : "pointer",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                {savingId === niche.title
                  ? "Wird gespeichert..."
                  : savedTitles.has(niche.title)
                    ? "✓ Gespeichert"
                    : "Diese Niche wählen"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

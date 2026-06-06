"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";
import { generateTrendScript } from "@/app/actions/generate-trend-script";
import {
  trendToThumbnailTopic,
  TREND_SCRIPT_CREDIT_COST,
  type GenerateTrendScriptInput,
  type TrendScriptResult,
} from "@/lib/trend-script-analysis";
import { parseScriptBlocks } from "@/lib/script-format";
import { onGenerationActionResult, shouldShowInlineGenerationError } from "@/lib/handle-generation-result";
import { useOptimisticGeneration } from "@/hooks/use-optimistic-generation";
import { useUserCredits } from "@/hooks/use-user-credits";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

const CREDIT_COST = TREND_SCRIPT_CREDIT_COST;

type Step = "input" | "loading" | "results";

const PLATFORMS = ["TikTok", "YouTube Shorts", "Instagram Reels", "Alle"];
const TONES = ["Energetisch", "Informativ", "Emotional"];

const LOADING_MESSAGES = [
  "Analysiere Trend…",
  "Identifiziere Zielgruppe…",
  "Passe an deine Nische an…",
  "Schreibe Script…",
];

const BLOCK_LABELS: Record<string, string> = {
  hook: "HOOK",
  main: "MAIN",
  cta: "CTA",
};

function cardStyle() {
  return {
    padding: 24,
    borderRadius: 16,
    background: "#0f0f12",
    border: "1px solid rgba(255,255,255,0.07)",
  } as const;
}

const labelStyle = {
  fontSize: "0.78rem",
  fontWeight: 700,
  color: "rgba(255,255,255,0.65)",
  display: "block",
  marginBottom: 8,
} as const;

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 10,
  background: "#18181d",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#F0EFE8",
  fontSize: "0.95rem",
  outline: "none",
  fontFamily: "var(--font-dm), sans-serif",
} as const;

function TrendToScriptPageInner() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [trend, setTrend] = useState("");
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [language, setLanguage] = useState<"de" | "en">("de");
  const [result, setResult] = useState<TrendScriptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const { credits } = useUserCredits();
  const { generate } = useOptimisticGeneration();

  const runGenerate = async () => {
    setError(null);
    setStep("loading");
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 2200);

    const payload: GenerateTrendScriptInput = {
      trend,
      niche,
      platform,
      tone,
      language,
    };

    try {
      const res = await generate(
        () => generateTrendScript(payload),
        CREDIT_COST,
        credits ?? 0
      );
      clearInterval(interval);
      onGenerationActionResult(res);
      if (!res.success) {
        if (shouldShowInlineGenerationError(res)) {
          setError(sanitizeUserMessage(res.error));
        }
        setStep("input");
        return;
      }
      setResult(res.result);
      setStep("results");
    } catch (err) {
      clearInterval(interval);
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : "Generierung fehlgeschlagen."
        )
      );
      setStep("input");
    }
  };

  const openThumbnail = () => {
    if (!result) return;
    const blocks = parseScriptBlocks(result.script);
    const hookText =
      blocks.find((b) => b.tag === "hook")?.lines.join(" ").trim() ||
      result.script.split("\n")[0] ||
      trend;
    const q = new URLSearchParams({
      topic: trendToThumbnailTopic(trend, niche, hookText),
    });
    router.push(`/dashboard/thumbnail-concept?${q.toString()}`);
  };

  const copyScript = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.script);
    } catch {
      /* ignore */
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 48 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Rocket size={32} color="#B4FF00" strokeWidth={2} />
          <div>
            <h1
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                letterSpacing: "0.02em",
                color: "#F0EFE8",
                margin: 0,
                lineHeight: 1,
              }}
            >
              TREND → SCRIPT
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", margin: "6px 0 0" }}>
              Aktuellen Trend erkennen → sofort passendes Script
            </p>
          </div>
        </div>
      </div>

      {error && (
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
        <div style={{ ...cardStyle(), display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
          <div>
            <label style={labelStyle}>Trend-Thema oder Keyword</label>
            <input
              value={trend}
              onChange={(e) => setTrend(e.target.value)}
              placeholder='z.B. "AI Agents", "Silent Walking", "BookTok"'
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Deine Nische</label>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="z.B. Productivity, Fitness, Tech Reviews"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Plattform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={inputStyle}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ton</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} style={inputStyle}>
              {TONES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Sprache</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "de" | "en")}
              style={inputStyle}
            >
              <option value="de">Deutsch</option>
              <option value="en">Englisch</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => void runGenerate()}
            disabled={!trend.trim() || !niche.trim()}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 12,
              border: "none",
              background: trend.trim() && niche.trim() ? "#B4FF00" : "#2a2a2a",
              color: trend.trim() && niche.trim() ? "#060608" : "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.3rem",
              cursor: trend.trim() && niche.trim() ? "pointer" : "default",
            }}
          >
            Script generieren — {CREDIT_COST} Credits
          </button>
          {credits !== null && (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.55)", fontSize: "0.78rem" }}>
              {credits} Credits verfügbar
            </p>
          )}
        </div>
      )}

      {step === "loading" && (
        <div style={{ ...cardStyle(), textAlign: "center", padding: 48 }}>
          <p style={{ color: "#B4FF00" }}>{loadingMsg}</p>
        </div>
      )}

      {step === "results" && result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={cardStyle()}>
            <h2 style={{ fontSize: "0.78rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
              TREND-ANALYSE
            </h2>
            <p style={{ color: "#F0EFE8", fontSize: "0.9rem", lineHeight: 1.55 }}>
              <strong>Warum viral:</strong> {result.trendAnalysis.whyViral}
            </p>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.88rem", marginTop: 8 }}>
              Zielgruppe: {result.trendAnalysis.audience} · Emotion: {result.trendAnalysis.emotion}
            </p>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.88rem", marginTop: 8 }}>
              {result.nicheAdaptation}
            </p>
          </div>

          <div style={cardStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: "0.78rem", fontWeight: 800, color: "#B4FF00", margin: 0 }}>
                DEIN SCRIPT
              </h2>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                {result.wordCount} Wörter · ~{result.estimatedSeconds}s
              </span>
            </div>

            {parseScriptBlocks(result.script).map((block, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 14,
                  padding: 14,
                  borderRadius: 10,
                  background: "#18181d",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {block.tag && (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      color: "#B4FF00",
                      marginBottom: 8,
                    }}
                  >
                    [{BLOCK_LABELS[block.tag] ?? block.tag.toUpperCase()}]
                  </span>
                )}
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--font-dm), sans-serif",
                    fontSize: "0.88rem",
                    lineHeight: 1.55,
                    color: "#F0EFE8",
                  }}
                >
                  {block.lines.join("\n").trim()}
                </pre>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={openThumbnail}
              style={{
                flex: 1,
                minWidth: 180,
                padding: "14px",
                borderRadius: 12,
                border: "none",
                background: "#B4FF00",
                color: "#060608",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Thumbnail erstellen →
            </button>
            <button
              type="button"
              onClick={() => void copyScript()}
              style={{
                padding: "14px 18px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
                color: "rgba(255,255,255,0.75)",
                cursor: "pointer",
              }}
            >
              Kopieren
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setResult(null);
              }}
              style={{
                padding: "14px 18px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
                color: "rgba(255,255,255,0.75)",
                cursor: "pointer",
              }}
            >
              Neu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrendToScriptPage() {
  return (
    <Suspense fallback={null}>
      <TrendToScriptPageInner />
    </Suspense>
  );
}

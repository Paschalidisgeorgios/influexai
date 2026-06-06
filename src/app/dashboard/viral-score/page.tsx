"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { ViralScoreResult } from "@/lib/viral-score";
import {
  VIRAL_SCORE_CREDIT_COST,
  VIRAL_SCORE_LANGUAGE_OPTIONS,
} from "@/lib/viral-score";
import { TablerChartBar } from "@/components/icons/TablerChartBar";
import { onGenerationActionResult, shouldShowInlineGenerationError } from "@/lib/handle-generation-result";
import { useOptimisticGeneration } from "@/hooks/use-optimistic-generation";
import { useUserCredits } from "@/hooks/use-user-credits";
import { createClient } from "@/lib/supabase/client";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

const CREDIT_COST = VIRAL_SCORE_CREDIT_COST;

type Step = "input" | "loading" | "results";

type HistoryRow = {
  id: string;
  prompt: string;
  created_at: string;
  result: ViralScoreResult | null;
};

const SUB_SCORES: {
  key: keyof Pick<
    ViralScoreResult,
    "hook_score" | "retention_score" | "ctr_score" | "trend_score"
  >;
  labelKey: "hook" | "retention" | "ctr" | "trend";
  max: number;
}[] = [
  { key: "hook_score", labelKey: "hook", max: 25 },
  { key: "retention_score", labelKey: "retention", max: 25 },
  { key: "ctr_score", labelKey: "ctr", max: 25 },
  { key: "trend_score", labelKey: "trend", max: 25 },
];

function useAnimatedScore(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    const start = performance.now();
    const duration = 1400;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);

  return value;
}

function ScoreRing({
  displayScore,
  size = 200,
}: {
  displayScore: number;
  size?: number;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (displayScore / 100) * c;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", display: "block" }}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#B4FF00"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "2.75rem",
            fontWeight: 800,
            color: "#B4FF00",
            fontFamily: "var(--font-syne), sans-serif",
            lineHeight: 1,
          }}
        >
          {displayScore}
        </span>
        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
          / 100
        </span>
      </div>
    </div>
  );
}

function SubScoreBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
          fontSize: "0.82rem",
        }}
      >
        <span style={{ color: "rgba(240,239,232,0.7)", fontWeight: 600 }}>
          {label}
        </span>
        <span style={{ color: "#B4FF00", fontWeight: 700 }}>
          {value}/{max}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 99,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, #8fcc00, #B4FF00)",
            borderRadius: 99,
            transition: "width 1s ease-out",
          }}
        />
      </div>
    </div>
  );
}

function ViralScorePageInner() {
  const t = useTranslations("flows.viral_score");
  const [step, setStep] = useState<Step>("input");
  const [script, setScript] = useState("");
  const [thumbnailIdea, setThumbnailIdea] = useState("");
  const [niche, setNiche] = useState("");
  const [language, setLanguage] = useState("de");
  const [score, setScore] = useState<ViralScoreResult | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const { credits } = useUserCredits();
  const { generate } = useOptimisticGeneration();

  const animatedTotal = useAnimatedScore(score?.total_score ?? 0, step === "results");

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
      .eq("type", "viral_score")
      .order("created_at", { ascending: false })
      .limit(8);

    setHistory(
      (data ?? []).map((row) => ({
        id: row.id,
        prompt: row.prompt,
        created_at: row.created_at,
        result: (row.result as ViralScoreResult | null) ?? null,
      }))
    );
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

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

  const runAnalyze = async () => {
    if (started.current || credits === null) return;
    if (!script.trim() || !thumbnailIdea.trim() || !niche.trim()) {
      setError(t("error_missing_fields"));
      return;
    }

    started.current = true;
    setError(null);
    setStep("loading");

    try {
      const res = await generate(
        async () => {
          const r = await fetch("/api/viral-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              script,
              thumbnail_idea: thumbnailIdea,
              niche,
              language,
            }),
          });
          const data = await r.json();
          if (!r.ok) {
            return {
              success: false as const,
              error: data.error ?? t("error_generic"),
              credits: data.credits,
              required: data.required,
            };
          }
          return {
            success: true as const,
            score: data.score as ViralScoreResult,
            creditsLeft: data.creditsLeft as number,
          };
        },
        CREDIT_COST,
        credits
      );

      if (!res.success) {
        onGenerationActionResult(res);
        if (shouldShowInlineGenerationError(res)) {
          setError(sanitizeUserMessage(res.error));
        }
        setStep("input");
        return;
      }

      onGenerationActionResult({
        success: true,
        creditsLeft: res.creditsLeft,
      });
      setScore(res.score);
      setStep("results");
      void loadHistory();
    } catch {
      setError(t("error_generic"));
      setStep("input");
    } finally {
      started.current = false;
    }
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <TablerChartBar size={28} color="#B4FF00" strokeWidth={2.2} />
        <h1
          style={{
            margin: 0,
            fontSize: "1.65rem",
            fontWeight: 800,
            color: "#F0EFE8",
            fontFamily: "var(--font-syne), sans-serif",
          }}
        >
          {t("title")}
        </h1>
      </div>
      <p style={{ color: "rgba(255,255,255,0.65)", margin: "0 0 28px", fontSize: "0.95rem" }}>
        {t("description")}
      </p>

      {step === "input" && (
        <div
          style={{
            background: "#0f0f12",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <label style={labelStyle}>{t("script_label")}</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder={t("script_placeholder")}
            rows={8}
            style={{ ...inputStyle, resize: "vertical", marginBottom: 18 }}
          />

          <label style={labelStyle}>{t("thumbnail_label")}</label>
          <input
            value={thumbnailIdea}
            onChange={(e) => setThumbnailIdea(e.target.value)}
            placeholder={t("thumbnail_placeholder")}
            style={{ ...inputStyle, marginBottom: 18 }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>{t("niche_label")}</label>
              <input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder={t("niche_placeholder")}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{t("language_label")}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {VIRAL_SCORE_LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p style={{ color: "#ff6b7a", marginTop: 16, fontSize: "0.9rem" }}>{error}</p>
          )}

          <button
            type="button"
            onClick={() => void runAnalyze()}
            disabled={credits !== null && credits < CREDIT_COST}
            style={{
              marginTop: 22,
              width: "100%",
              padding: "14px 20px",
              borderRadius: 10,
              border: "none",
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 800,
              fontSize: "1rem",
              cursor: "pointer",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            {t("button", { cost: CREDIT_COST })}
          </button>
        </div>
      )}

      {step === "loading" && (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            background: "#0f0f12",
            borderRadius: 16,
            border: "1px solid rgba(180,255,0,0.15)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              margin: "0 auto 16px",
              border: "3px solid rgba(180,255,0,0.2)",
              borderTopColor: "#B4FF00",
              borderRadius: "50%",
              animation: "spin 0.9s linear infinite",
            }}
          />
          <p style={{ color: "#B4FF00", fontWeight: 700 }}>{t("analyzing")}</p>
        </div>
      )}

      {step === "results" && score && (
        <div>
          <div
            className="viral-score-results-top"
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 32,
              alignItems: "center",
              background: "#0f0f12",
              border: "1px solid rgba(180,255,0,0.2)",
              borderRadius: 16,
              padding: 28,
              marginBottom: 20,
            }}
          >
            <ScoreRing displayScore={animatedTotal} />
            <div>
              {SUB_SCORES.map((s) => (
                <SubScoreBar
                  key={s.key}
                  label={t(`sub_${s.labelKey}`)}
                  value={score[s.key]}
                  max={s.max}
                />
              ))}
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              color: "rgba(240,239,232,0.85)",
              fontSize: "1.05rem",
              marginBottom: 24,
              fontStyle: "italic",
            }}
          >
            {score.verdict}
          </p>

          <div
            className="viral-score-strengths-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 12,
                padding: 18,
              }}
            >
              <h3 style={{ color: "#10b981", margin: "0 0 12px", fontSize: "0.9rem" }}>
                {t("strengths_title")}
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#c8c8c8" }}>
                {score.strengths.map((s, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div
              style={{
                background: "rgba(255,107,122,0.08)",
                border: "1px solid rgba(255,107,122,0.25)",
                borderRadius: 12,
                padding: 18,
              }}
            >
              <h3 style={{ color: "#ff6b7a", margin: "0 0 12px", fontSize: "0.9rem" }}>
                {t("improvements_title")}
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#c8c8c8" }}>
                {score.improvements.map((s, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            style={{
              background: "#18181d",
              border: "1px solid rgba(180,255,0,0.25)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <h3
              style={{
                color: "#B4FF00",
                margin: "0 0 10px",
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("improved_hook_title")}
            </h3>
            <p style={{ margin: 0, color: "#F0EFE8", lineHeight: 1.6 }}>
              {score.improved_hook}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setStep("input");
              setScore(null);
            }}
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "#F0EFE8",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {t("analyze_again")}
          </button>
        </div>
      )}

      {history.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2
            style={{
              fontSize: "1rem",
              color: "rgba(255,255,255,0.65)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 14,
            }}
          >
            {t("history_title")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  if (h.result) {
                    setScore(h.result);
                    setStep("results");
                  }
                }}
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "#0f0f12",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "#F0EFE8",
                  cursor: h.result ? "pointer" : "default",
                }}
              >
                <span style={{ color: "#B4FF00", fontWeight: 800, marginRight: 10 }}>
                  {h.result?.total_score ?? "—"}
                </span>
                {h.prompt}
              </button>
            ))}
          </div>
        </section>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .viral-score-results-top {
            grid-template-columns: 1fr !important;
            justify-items: center;
          }
          .viral-score-strengths-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ViralScorePage() {
  return (
    <Suspense fallback={null}>
      <ViralScorePageInner />
    </Suspense>
  );
}

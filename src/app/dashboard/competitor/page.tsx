"use client";

import { Suspense, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Target } from "lucide-react";
import type {
  CompetitorAnalysisResponse,
  CompetitorAnalysisResult,
} from "@/lib/competitor-analysis";
import { COMPETITOR_ANALYSIS_CREDIT_COST } from "@/lib/competitor-analysis";
import { onGenerationActionResult } from "@/lib/handle-generation-result";
import { useOptimisticGeneration } from "@/hooks/use-optimistic-generation";
import { useUserCredits } from "@/hooks/use-user-credits";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

const CREDIT_COST = COMPETITOR_ANALYSIS_CREDIT_COST;

type Step = "input" | "loading" | "results";

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("de-DE");
}

function TagList({
  items,
  color,
  borderColor,
  bg,
}: {
  items: string[];
  color: string;
  borderColor: string;
  bg: string;
}) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map((item) => (
        <span
          key={item}
          style={{
            padding: "6px 12px",
            borderRadius: 99,
            fontSize: "0.82rem",
            color,
            background: bg,
            border: `1px solid ${borderColor}`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CompetitorPageInner() {
  const t = useTranslations("flows.competitor");
  const [step, setStep] = useState<Step>("input");
  const [channelUrl, setChannelUrl] = useState("");
  const [data, setData] = useState<CompetitorAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
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

  const runAnalyze = async () => {
    if (started.current || credits === null || !channelUrl.trim()) return;
    started.current = true;
    setError(null);
    setStep("loading");

    try {
      const res = await generate(
        async () => {
          const r = await fetch("/api/competitor-analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channel_url: channelUrl }),
          });
          const json = await r.json();
          if (!r.ok || !json.success) {
            return {
              success: false as const,
              error: json.error ?? t("error_generic"),
              credits: json.credits,
              required: json.required,
            };
          }
          return {
            success: true as const,
            creditsLeft: json.creditsLeft as number,
            channel: json.channel as CompetitorAnalysisResponse["channel"],
            topVideos: json.topVideos as CompetitorAnalysisResponse["topVideos"],
            analysis: json.analysis as CompetitorAnalysisResult,
          };
        },
        CREDIT_COST,
        credits
      );

      if (!res.success) {
        onGenerationActionResult(res);
        setError(sanitizeUserMessage(res.error));
        setStep("input");
        return;
      }

      onGenerationActionResult({
        success: true,
        creditsLeft: res.creditsLeft,
      });

      setData({
        channel: res.channel,
        topVideos: res.topVideos,
        analysis: res.analysis,
      });
      setStep("results");
    } catch {
      setError(t("error_generic"));
      setStep("input");
    } finally {
      started.current = false;
    }
  };

  const analysis: CompetitorAnalysisResult | null = data?.analysis ?? null;

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Target size={28} color="#B4FF00" strokeWidth={2.2} />
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
      <p style={{ color: "#505055", margin: "0 0 28px", fontSize: "0.95rem" }}>
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
          <label
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#505055",
              display: "block",
              marginBottom: 6,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {t("url_label")}
          </label>
          <input
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder={t("url_placeholder")}
            style={{ ...inputStyle, marginBottom: 16 }}
          />
          {error && (
            <p style={{ color: "#ff6b7a", marginBottom: 12, fontSize: "0.9rem" }}>
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => void runAnalyze()}
            disabled={credits !== null && credits < CREDIT_COST}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: 10,
              border: "none",
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 800,
              fontSize: "1rem",
              cursor: "pointer",
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

      {step === "results" && data && analysis && (
        <div>
          <div
            style={{
              display: "flex",
              gap: 20,
              alignItems: "center",
              padding: 24,
              borderRadius: 16,
              background: "#0f0f12",
              border: "1px solid rgba(180,255,0,0.2)",
              marginBottom: 20,
            }}
          >
            {data.channel.thumbnailUrl && (
              <img
                src={data.channel.thumbnailUrl}
                alt=""
                width={72}
                height={72}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            )}
            <div>
              <h2 style={{ margin: "0 0 6px", color: "#F0EFE8", fontSize: "1.35rem" }}>
                {data.channel.title}
              </h2>
              <p style={{ margin: 0, color: "#B4FF00", fontWeight: 700 }}>
                {formatNum(data.channel.subscriberCount)} {t("subscribers")}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              { label: t("stat_avg_views"), value: formatNum(analysis.avg_views) },
              {
                label: t("stat_posting"),
                value: analysis.posting_frequency,
              },
              {
                label: t("stat_videos"),
                value: formatNum(data.channel.videoCount),
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "#18181d",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p style={{ margin: "0 0 6px", fontSize: "0.72rem", color: "#505055" }}>
                  {s.label}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "#B4FF00",
                  }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              color: "rgba(240,239,232,0.8)",
              lineHeight: 1.6,
              marginBottom: 24,
              fontSize: "0.95rem",
            }}
          >
            {analysis.summary}
          </p>

          <section style={{ marginBottom: 20 }}>
            <h3 style={{ color: "#F0EFE8", fontSize: "0.9rem", marginBottom: 10 }}>
              {t("top_topics")}
            </h3>
            <TagList
              items={analysis.top_topics}
              color="#F0EFE8"
              borderColor="rgba(255,255,255,0.15)"
              bg="rgba(255,255,255,0.05)"
            />
          </section>

          <section style={{ marginBottom: 20 }}>
            <h3 style={{ color: "#10b981", fontSize: "0.9rem", marginBottom: 10 }}>
              {t("content_gaps")}
            </h3>
            <TagList
              items={analysis.content_gaps}
              color="#10b981"
              borderColor="rgba(16,185,129,0.35)"
              bg="rgba(16,185,129,0.08)"
            />
          </section>

          <section style={{ marginBottom: 20 }}>
            <h3 style={{ color: "#f59e0b", fontSize: "0.9rem", marginBottom: 10 }}>
              {t("weaknesses")}
            </h3>
            <TagList
              items={analysis.weaknesses}
              color="#f59e0b"
              borderColor="rgba(245,158,11,0.35)"
              bg="rgba(245,158,11,0.08)"
            />
          </section>

          <section style={{ marginBottom: 24 }}>
            <h3 style={{ color: "#B4FF00", fontSize: "0.9rem", marginBottom: 10 }}>
              {t("opportunities")}
            </h3>
            <TagList
              items={analysis.opportunities}
              color="#B4FF00"
              borderColor="rgba(180,255,0,0.35)"
              bg="rgba(180,255,0,0.08)"
            />
          </section>

          {analysis.best_performing_format && (
            <p
              style={{
                marginBottom: 24,
                fontSize: "0.88rem",
                color: "#505055",
              }}
            >
              <strong style={{ color: "#F0EFE8" }}>{t("best_format")}:</strong>{" "}
              {analysis.best_performing_format}
            </p>
          )}

          <h3 style={{ color: "#F0EFE8", marginBottom: 12 }}>{t("top_videos")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.topVideos.map((v, i) => (
              <a
                key={v.videoId}
                href={`https://www.youtube.com/watch?v=${v.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  gap: 14,
                  padding: 14,
                  borderRadius: 12,
                  background: "#0f0f12",
                  border: "1px solid rgba(255,255,255,0.07)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {v.thumbnailUrl && (
                  <img
                    src={v.thumbnailUrl}
                    alt=""
                    width={96}
                    height={54}
                    style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <span style={{ color: "#B4FF00", fontWeight: 800, fontSize: "0.75rem" }}>
                    #{i + 1}
                  </span>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#F0EFE8",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      lineHeight: 1.35,
                    }}
                  >
                    {v.title}
                  </p>
                  <p style={{ margin: "6px 0 0", color: "#505055", fontSize: "0.8rem" }}>
                    {formatNum(v.viewCount)} Views
                  </p>
                </div>
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setStep("input");
              setData(null);
            }}
            style={{
              marginTop: 28,
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function CompetitorPage() {
  return (
    <Suspense fallback={null}>
      <CompetitorPageInner />
    </Suspense>
  );
}

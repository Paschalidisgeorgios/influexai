"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Repeat2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { remixVideo, type RemixConcept } from "@/app/actions/remix-video";
import { onGenerationActionResult } from "@/lib/handle-generation-result";
import { useOptimisticGeneration } from "@/hooks/use-optimistic-generation";
import { useUserCredits } from "@/hooks/use-user-credits";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

const CREDIT_COST = 2;

type Step = "input" | "loading" | "results";
type InputMode = "url" | "manual";

const LOADING_MESSAGES = [
  "Analysiere Original-Struktur...",
  "Identifiziere virale Elemente...",
  "Generiere Remix-Varianten...",
];

const NICHE_OPTIONS = [
  "Tech",
  "Fitness",
  "Finance",
  "Kochen",
  "Travel",
  "Gaming",
  "Beauty",
  "Business",
  "Sonstiges",
];

const REMIX_STYLES = [
  "Gleiche Idee, andere Zielgruppe",
  "Konträre Meinung / Gegendarstellung",
  "Selbes Format, anderes Thema",
  "Erweiterte Version (mehr Tiefe)",
  "Simplified Version (für Anfänger)",
  "Lokale Adaption (für DACH-Raum)",
];

function similarityColor(percent: number) {
  if (percent >= 60) return "#f59e0b";
  if (percent >= 40) return "#B4FF00";
  return "#06b6d4";
}

export default function VideoRemixPage() {
  const t = useTranslations("flows.remix");
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("input");
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [niche, setNiche] = useState(NICHE_OPTIONS[0]);
  const [remixStyle, setRemixStyle] = useState(REMIX_STYLES[0]);
  const [remixes, setRemixes] = useState<RemixConcept[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [progress, setProgress] = useState(0);
  const remixStarted = useRef(false);
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
    color: "#505055",
    display: "block" as const,
    marginBottom: 6,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  };

  useEffect(() => {
    const loadProfileNiche = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("creator_niche")
        .eq("id", user.id)
        .single();
      if (data?.creator_niche && NICHE_OPTIONS.includes(data.creator_niche)) {
        setNiche(data.creator_niche);
      }
    };
    loadProfileNiche();
  }, [supabase]);

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
      setProgress((p) => Math.min(p + 8, 92));
    }, 450);
    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, [step]);

  const canSubmit =
    inputMode === "url"
      ? youtubeUrl.trim().length > 0
      : videoDescription.trim().length > 0;

  const runRemix = async () => {
    if (!canSubmit || remixStarted.current || credits === null) return;
    remixStarted.current = true;
    setError(null);
    setStep("loading");
    setProgress(5);

    try {
      const result = await generate(
        () =>
          remixVideo({
            mode: inputMode,
            url: inputMode === "url" ? youtubeUrl : undefined,
            originalTitle: originalTitle || undefined,
            videoDescription:
              inputMode === "manual" ? videoDescription : undefined,
            niche,
            remixStyle,
          }),
        CREDIT_COST,
        credits
      );
      if (!result.success) {
        onGenerationActionResult(result);
        setError(result.error);
        setStep("input");
        return;
      }
      onGenerationActionResult(result);
      setProgress(100);
      setRemixes(result.remixes);
      setStep("results");
    } catch {
      setError("Remix fehlgeschlagen.");
      setStep("input");
    } finally {
      remixStarted.current = false;
    }
  };

  const applyRemixConcept = (item: RemixConcept) => {
    const structureText = [
      `Intro: ${item.structure.intro}`,
      `Middle: ${item.structure.middle}`,
      `CTA: ${item.structure.cta}`,
    ].join("\n");
    const description = [
      item.description,
      item.uniqueAngle ? `Twist: ${item.uniqueAngle}` : "",
      structureText,
    ]
      .filter(Boolean)
      .join("\n\n");

    const params = new URLSearchParams({
      title: item.remixTitle,
      hook: item.hook,
      description,
    });
    router.push(`/dashboard/video-ad?${params.toString()}`);
  };

  const reset = () => {
    setStep("input");
    setRemixes([]);
    setError(null);
    setProgress(0);
  };

  const tabStyle = (active: boolean) => ({
    flex: 1,
    padding: "10px 14px",
    borderRadius: 10,
    border: active
      ? "1px solid rgba(180,255,0,0.4)"
      : "1px solid rgba(255,255,255,0.07)",
    background: active ? "rgba(180,255,0,0.1)" : "#18181d",
    color: active ? "#B4FF00" : "#505055",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    fontFamily: "var(--font-dm), sans-serif",
  });

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
          <Repeat2 size={32} color="#B4FF00" strokeWidth={2} />
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
        <p style={{ color: "#505055", fontSize: "0.9rem" }}>
          Virale Videos mit deinem eigenen Twist neu interpretieren
        </p>
      </div>

      <div
        style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}
      >
        {[
          { key: "input", label: "1. Original" },
          { key: "loading", label: "2. Remix" },
          { key: "results", label: "3. Ideen" },
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
                color: done || active ? "#B4FF00" : "#505055",
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
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={tabStyle(inputMode === "url")}
              onClick={() => setInputMode("url")}
            >
              YouTube URL
            </button>
            <button
              type="button"
              style={tabStyle(inputMode === "manual")}
              onClick={() => setInputMode("manual")}
            >
              Manuell beschreiben
            </button>
          </div>

          {inputMode === "url" ? (
            <>
              <div>
                <label style={labelStyle}>
                  YouTube URL des Original-Videos
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  style={inputStyle}
                />
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "0.78rem",
                    color: "#505055",
                  }}
                >
                  Wir analysieren Titel, Hook und Struktur (kein Download)
                </p>
              </div>
              <div>
                <label style={labelStyle}>Original-Titel (optional)</label>
                <input
                  type="text"
                  value={originalTitle}
                  onChange={(e) => setOriginalTitle(e.target.value)}
                  placeholder="Falls bekannt — verbessert die Analyse"
                  style={inputStyle}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Beschreibe das Video</label>
                <textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Was passiert darin? Was macht es viral? Hook, Struktur, Emotionen…"
                  rows={5}
                  style={{
                    ...inputStyle,
                    resize: "vertical" as const,
                    minHeight: 120,
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>Original-Titel</label>
                <input
                  type="text"
                  value={originalTitle}
                  onChange={(e) => setOriginalTitle(e.target.value)}
                  placeholder="Titel des Original-Videos"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <div>
            <label style={labelStyle}>Deine Nische</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {NICHE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Remix-Stil</label>
            <select
              value={remixStyle}
              onChange={(e) => setRemixStyle(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {REMIX_STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={runRemix}
            disabled={!canSubmit}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 11,
              border: "none",
              background: canSubmit ? "#B4FF00" : "#2a2a2a",
              color: canSubmit ? "#060608" : "#505055",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.2rem",
              letterSpacing: "0.04em",
              cursor: canSubmit ? "pointer" : "default",
            }}
          >
            REMIXEN →
          </button>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.78rem",
              color: "#505055",
              margin: 0,
            }}
          >
            Kostet 2 Credits
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
              ✓ {remixes.length} Remix-Konzepte bereit
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#505055",
                fontSize: "0.82rem",
                cursor: "pointer",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              Neuer Remix
            </button>
          </div>

          {remixes.map((item) => {
            const simColor = similarityColor(item.similarityPercent);
            return (
              <div
                key={item.remixTitle}
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
                    gap: 10,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                      fontSize: "1.35rem",
                      letterSpacing: "0.02em",
                      color: "#F0EFE8",
                      margin: 0,
                      lineHeight: 1.15,
                      flex: 1,
                      minWidth: 200,
                    }}
                  >
                    {item.remixTitle}
                  </h3>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      padding: "4px 12px",
                      borderRadius: 99,
                      background: `${simColor}22`,
                      color: simColor,
                      border: `1px solid ${simColor}55`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.similarityPercent}% ähnlich
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "0.88rem",
                    color: "rgba(240,239,232,0.7)",
                    lineHeight: 1.65,
                  }}
                >
                  {item.description}
                </p>

                {item.uniqueAngle && (
                  <p
                    style={{ margin: 0, fontSize: "0.82rem", color: "#B4FF00" }}
                  >
                    <strong>Twist:</strong> {item.uniqueAngle}
                  </p>
                )}

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

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 10,
                  }}
                >
                  {(
                    [
                      ["Intro", item.structure.intro],
                      ["Middle", item.structure.middle],
                      ["CTA", item.structure.cta],
                    ] as const
                  ).map(([label, text]) => (
                    <div
                      key={label}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#18181d",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          color: "#505055",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: 6,
                        }}
                      >
                        {label}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8rem",
                          color: "#F0EFE8",
                          lineHeight: 1.5,
                        }}
                      >
                        {text}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => applyRemixConcept(item)}
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
                  Diesen Remix nutzen →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

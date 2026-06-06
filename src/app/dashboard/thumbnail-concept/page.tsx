"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Image as ImageIcon } from "lucide-react";
import {
  generateThumbnailConcepts,
  saveThumbnailConcept,
  type ThumbnailConcept,
} from "@/app/actions/generate-thumbnail";
import { onGenerationActionResult, shouldShowInlineGenerationError } from "@/lib/handle-generation-result";
import { useOptimisticGeneration } from "@/hooks/use-optimistic-generation";
import { useUserCredits } from "@/hooks/use-user-credits";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";

const CREDIT_COST = 1;
import { ThumbnailPreview } from "@/components/thumbnail-preview";
import {
  getSafeSearchParam,
  scriptGeneratorTopicUrl,
} from "@/lib/safe-url-param";

type Step = "input" | "loading" | "results";

const LOADING_MESSAGES = [
  "Analysiere Top-Thumbnails...",
  "Entwickle Konzepte...",
  "Optimiere für CTR...",
];

const STYLES = [
  "Gesicht + Emotion (Creator zeigt starke Emotion)",
  "Text-dominant (großer Text, wenig Bild)",
  "Vorher/Nachher (Split-Screen)",
  "Neugier-Gap (etwas verdeckt/mystery)",
  "Liste / Number (5 Tipps, 3 Fehler etc.)",
  "Schock-Wert (controversial, surprising visual)",
];

const COLOR_ENERGIES = [
  "Warm & Energetisch (rot, orange, gelb)",
  "Cool & Premium (blau, weiß, schwarz)",
  "Acid & Viral (#B4FF00 style, neon)",
  "Minimalistisch (weiß/schwarz, viel Weißraum)",
];

function ctrStyle(level: ThumbnailConcept["ctrPrediction"]) {
  if (level === "high") return { color: "#B4FF00", label: "Hoch" };
  if (level === "medium") return { color: "#f59e0b", label: "Mittel" };
  return { color: "rgba(255,255,255,0.65)", label: "Niedrig" };
}

function ThumbnailConceptPageInner() {
  const t = useTranslations("flows.thumbnail");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("input");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState(STYLES[0]);
  const [colorEnergy, setColorEnergy] = useState(COLOR_ENERGIES[2]);
  const [concepts, setConcepts] = useState<ThumbnailConcept[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [progress, setProgress] = useState(0);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
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

  const labelStyle = {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "rgba(255,255,255,0.65)",
    display: "block" as const,
    marginBottom: 6,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  };

  const selectStyle = {
    ...inputStyle,
    cursor: "pointer" as const,
  };

  useEffect(() => {
    const topicParam = getSafeSearchParam(searchParams, "topic");
    if (topicParam) setTopic(topicParam);
  }, [searchParams]);

  useEffect(() => {
    if (step !== "loading") return;
    setLoadingMsg(LOADING_MESSAGES[0]);
    setProgress(10);
    let i = 0;
    const msgIv = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[i]);
    }, 1400);
    const progIv = setInterval(
      () => setProgress((p) => Math.min(p + 8, 92)),
      350
    );
    return () => {
      clearInterval(msgIv);
      clearInterval(progIv);
    };
  }, [step]);

  const runGenerate = async () => {
    if (!topic.trim() || started.current || credits === null) return;
    started.current = true;
    setError(null);
    setStep("loading");
    setProgress(5);

    try {
      const res = await generate(
        () => generateThumbnailConcepts({ topic, style, colorEnergy }),
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
      onGenerationActionResult(res);
      setConcepts(res.concepts);
      setSavedIndices(new Set());
      setProgress(100);
      setStep("results");
    } catch {
      setError("Generierung fehlgeschlagen.");
      setStep("input");
    } finally {
      started.current = false;
    }
  };

  const handleSave = async (index: number) => {
    const concept = concepts[index];
    if (!concept) return;
    setSavingIndex(index);
    const res = await saveThumbnailConcept({ topic, concept });
    setSavingIndex(null);
    if (res.success) {
      setSavedIndices((prev) => new Set(prev).add(index));
    } else {
      setError(sanitizeUserMessage(res.error));
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(180,255,0,0.1)",
              border: "1px solid rgba(180,255,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageIcon size={22} color="#B4FF00" aria-hidden />
          </div>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
                letterSpacing: "0.02em",
                color: "#F0EFE8",
                margin: 0,
                lineHeight: 1,
              }}
            >
              {t("title")}
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                color: "rgba(255,255,255,0.65)",
                fontSize: "0.88rem",
              }}
            >
              {t("description")}
            </p>
          </div>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.65rem",
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 6,
              background: "#B4FF00",
              color: "#060608",
              letterSpacing: "0.06em",
            }}
          >
            NEU
          </span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.82rem" }}>
          ⚡ 1 Credit pro Generierung · 4 Konzepte · CSS-Vorschau (keine
          Bild-Generierung)
        </p>
      </div>

      {step === "input" && (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "#0f0f12",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <label style={labelStyle}>Dein Prompt</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="z.B. Schockiertes Gesicht, roter Hintergrund, Text: 3 Fehler die dich Follower kosten"
            rows={4}
            style={{
              ...inputStyle,
              marginBottom: 20,
              minHeight: 100,
              resize: "vertical" as const,
            }}
          />

          <label style={labelStyle}>Thumbnail Stil</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            style={{ ...selectStyle, marginBottom: 20 }}
          >
            {STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Farb-Energie</label>
          <select
            value={colorEnergy}
            onChange={(e) => setColorEnergy(e.target.value)}
            style={{ ...selectStyle, marginBottom: 24 }}
          >
            {COLOR_ENERGIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {error && (
            <p
              style={{
                color: "#ff6b7a",
                fontSize: "0.88rem",
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={runGenerate}
            disabled={!topic.trim()}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: 10,
              border: "none",
              background: topic.trim() ? "#B4FF00" : "#333",
              color: "#060608",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: topic.trim() ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}
          >
            Konzepte generieren (1 Credit)
          </button>
        </div>
      )}

      {step === "loading" && (
        <div className="space-y-6">
          <div
            style={{
              padding: 48,
              textAlign: "center",
              borderRadius: 16,
              background: "#0f0f12",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                margin: "0 auto 20px",
                borderRadius: "50%",
                border: "3px solid #B4FF00",
                borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ color: "#F0EFE8", fontWeight: 600, marginBottom: 16 }}>
              {loadingMsg}
            </p>
            <div
              style={{
                height: 4,
                maxWidth: 280,
                margin: "0 auto",
                background: "#222228",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "#B4FF00",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
          <CardGridSkeleton count={3} columns={1} />
        </div>
      )}

      {step === "results" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", margin: 0 }}>
              Thema: <strong style={{ color: "#F0EFE8" }}>{topic}</strong>
            </p>
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setError(null);
              }}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "#B4FF00",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ← Neue Generierung
            </button>
          </div>

          {error && (
            <p
              style={{
                color: "#ff6b7a",
                fontSize: "0.88rem",
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {concepts.map((concept, index) => {
              const ctr = ctrStyle(concept.ctrPrediction);
              return (
                <article
                  key={index}
                  style={{
                    padding: 22,
                    borderRadius: 16,
                    background: "#0f0f12",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <ThumbnailPreview layout={concept.cssLayout} />

                  <h2
                    style={{
                      margin: "16px 0 10px",
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: "#F0EFE8",
                    }}
                  >
                    {concept.conceptTitle}
                  </h2>

                  <p
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "0.88rem",
                      lineHeight: 1.65,
                      marginBottom: 16,
                    }}
                  >
                    {concept.layoutDescription}
                  </p>

                  <div style={{ marginBottom: 14 }}>
                    <p style={{ ...labelStyle, marginBottom: 8 }}>
                      Text Overlays
                    </p>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 18,
                        color: "#c8c8c8",
                        fontSize: "0.85rem",
                      }}
                    >
                      {concept.textOverlays.map((o, i) => (
                        <li key={i} style={{ marginBottom: 6 }}>
                          <strong style={{ color: "#F0EFE8" }}>{o.text}</strong>
                          {" — "}
                          {o.position}, {o.size}, {o.color}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    {(
                      [
                        ["Background", concept.colorPalette.background],
                        ["Main Text", concept.colorPalette.mainText],
                        ["Accent", concept.colorPalette.accent],
                      ] as const
                    ).map(([label, hex]) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            background: hex,
                            border: "1px solid rgba(255,255,255,0.15)",
                          }}
                        />
                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)" }}>
                          {label}:{" "}
                          <code style={{ color: "#B4FF00" }}>{hex}</code>
                        </span>
                      </div>
                    ))}
                  </div>

                  {concept.emotion && (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#c8c8c8",
                        marginBottom: 8,
                      }}
                    >
                      <strong style={{ color: "rgba(255,255,255,0.65)" }}>Emotion:</strong>{" "}
                      {concept.emotion}
                    </p>
                  )}

                  {concept.props.length > 0 && (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#c8c8c8",
                        marginBottom: 12,
                      }}
                    >
                      <strong style={{ color: "rgba(255,255,255,0.65)" }}>Props:</strong>{" "}
                      {concept.props.join(" · ")}
                    </p>
                  )}

                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.65)",
                        fontWeight: 700,
                      }}
                    >
                      CTR-Prognose:{" "}
                    </span>
                    <span style={{ color: ctr.color, fontWeight: 800 }}>
                      {ctr.label}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem" }}>
                      {" "}
                      — {concept.ctrReasoning}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => handleSave(index)}
                      disabled={
                        savingIndex === index || savedIndices.has(index)
                      }
                      style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "1px solid rgba(180,255,0,0.35)",
                        background: savedIndices.has(index)
                          ? "rgba(180,255,0,0.15)"
                          : "rgba(180,255,0,0.08)",
                        color: "#B4FF00",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: savedIndices.has(index) ? "default" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {savedIndices.has(index)
                        ? "✓ Gespeichert"
                        : savingIndex === index
                          ? "Speichern…"
                          : "Dieses Konzept speichern"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          scriptGeneratorTopicUrl(
                            topic.trim() || concept.conceptTitle
                          )
                        )
                      }
                      style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "transparent",
                        color: "#F0EFE8",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Script dazu generieren →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <p style={{ marginTop: 24, textAlign: "center" }}>
        <Link
          href="/dashboard"
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "0.82rem",
            textDecoration: "none",
          }}
        >
          ← Zurück zum Dashboard
        </Link>
      </p>
    </div>
  );
}

export default function ThumbnailConceptPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.65)" }}>
          Laden…
        </div>
      }
    >
      <ThumbnailConceptPageInner />
    </Suspense>
  );
}

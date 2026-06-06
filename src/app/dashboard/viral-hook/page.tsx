"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import {
  extractViralHook,
  VIRAL_HOOK_CREDIT_COST,
  type ExtractViralHookInput,
} from "@/app/actions/extract-viral-hook";
import { viralHookToScriptTopic, type ViralHookResult } from "@/lib/viral-hook-analysis";
import { scriptGeneratorTopicUrl } from "@/lib/safe-url-param";
import { onGenerationActionResult, shouldShowInlineGenerationError } from "@/lib/handle-generation-result";
import { useOptimisticGeneration } from "@/hooks/use-optimistic-generation";
import { useUserCredits } from "@/hooks/use-user-credits";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

const CREDIT_COST = VIRAL_HOOK_CREDIT_COST;

type Step = "input" | "loading" | "results";
type InputMode = "url" | "manual";

const LOADING_MESSAGES = [
  "Lade Video-Metadaten…",
  "Analysiere Hook-Struktur…",
  "Erkenne Storytelling-Muster…",
  "Baue Nischen-Version…",
];

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

function ViralHookPageInner() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [mode, setMode] = useState<InputMode>("url");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [userNiche, setUserNiche] = useState("");
  const [result, setResult] = useState<ViralHookResult | null>(null);
  const [usedYouTubeApi, setUsedYouTubeApi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const { credits } = useUserCredits();
  const { generate } = useOptimisticGeneration();

  const runExtract = async () => {
    setError(null);
    setStep("loading");
    let msgIdx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 2200);

    const payload: ExtractViralHookInput =
      mode === "url"
        ? { mode: "url", youtubeUrl, userNiche: userNiche || undefined }
        : {
            mode: "manual",
            manualDescription,
            userNiche: userNiche || undefined,
          };

    try {
      const res = await generate(
        () => extractViralHook(payload),
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
      setUsedYouTubeApi(res.usedYouTubeApi);
      setStep("results");
    } catch (err) {
      clearInterval(interval);
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : "Extraktion fehlgeschlagen."
        )
      );
      setStep("input");
    }
  };

  const openScriptGenerator = () => {
    if (!result) return;
    router.push(scriptGeneratorTopicUrl(viralHookToScriptTopic(result)));
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 48 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Zap size={32} color="#B4FF00" strokeWidth={2} />
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
              VIRAL HOOK EXTRAKTOR
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", margin: "6px 0 0" }}>
              YouTube URL → Hook + Storytelling-Struktur → direkt als Script
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
        <div style={{ ...cardStyle(), display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {(["url", "manual"] as InputMode[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMode(tab)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${mode === tab ? "#B4FF00" : "rgba(255,255,255,0.1)"}`,
                  background: mode === tab ? "rgba(180,255,0,0.1)" : "transparent",
                  color: mode === tab ? "#B4FF00" : "rgba(255,255,255,0.75)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                {tab === "url" ? "YouTube URL" : "Manuell beschreiben"}
              </button>
            ))}
          </div>

          {mode === "url" ? (
            <div>
              <label style={labelStyle}>YouTube Link</label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/shorts/…"
                style={inputStyle}
              />
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Video beschreiben</label>
              <textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                rows={5}
                placeholder="Was passiert im Video? Wie startet der Hook? Welche Emotion?"
                style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Deine Nische (optional)</label>
            <input
              type="text"
              value={userNiche}
              onChange={(e) => setUserNiche(e.target.value)}
              placeholder="z.B. Fitness, KI, Finance"
              style={inputStyle}
            />
          </div>

          <button
            type="button"
            onClick={() => void runExtract()}
            disabled={
              mode === "url" ? !youtubeUrl.trim() : manualDescription.trim().length < 20
            }
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 12,
              border: "none",
              background: "#B4FF00",
              color: "#060608",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.3rem",
              letterSpacing: "0.04em",
              cursor: "pointer",
              opacity:
                mode === "url"
                  ? youtubeUrl.trim()
                    ? 1
                    : 0.45
                  : manualDescription.trim().length >= 20
                    ? 1
                    : 0.45,
            }}
          >
            Hook extrahieren — {CREDIT_COST} Credits
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
          <p style={{ color: "#B4FF00", fontSize: "1rem", marginBottom: 8 }}>{loadingMsg}</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>Claude analysiert…</p>
        </div>
      )}

      {step === "results" && result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {usedYouTubeApi && (
            <p style={{ fontSize: "0.78rem", color: "rgba(180,255,0,0.85)" }}>
              ✓ YouTube-Metadaten geladen
            </p>
          )}
          {result.sourceTitle && (
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.82rem" }}>
              Quelle: {result.sourceTitle}
            </p>
          )}

          <Section title="Der Hook (erste 3 Sekunden)" accent>
            {result.hook}
          </Section>

          <Section title="Storytelling-Struktur">
            <p><strong style={{ color: "#B4FF00" }}>Problem</strong> — {result.storytellingStructure.problem}</p>
            <p style={{ marginTop: 8 }}><strong style={{ color: "#B4FF00" }}>Lösung</strong> — {result.storytellingStructure.solution}</p>
            <p style={{ marginTop: 8 }}><strong style={{ color: "#B4FF00" }}>CTA</strong> — {result.storytellingStructure.cta}</p>
          </Section>

          <Section title="Warum es viral wurde">{result.whyViral}</Section>
          <Section title="Psychologie">{result.psychology}</Section>
          <Section title="Angepasst für deine Nische">{result.adaptedForNiche}</Section>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={openScriptGenerator}
              style={{
                flex: 1,
                minWidth: 200,
                padding: "14px",
                borderRadius: 12,
                border: "none",
                background: "#B4FF00",
                color: "#060608",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              In Script umwandeln →
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
              Neu analysieren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div style={cardStyle()}>
      <h2
        style={{
          fontSize: "0.78rem",
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: accent ? "#B4FF00" : "rgba(255,255,255,0.55)",
          marginBottom: 10,
        }}
      >
        {title}
      </h2>
      <div style={{ color: "#F0EFE8", fontSize: "0.92rem", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export default function ViralHookPage() {
  return (
    <Suspense fallback={null}>
      <ViralHookPageInner />
    </Suspense>
  );
}

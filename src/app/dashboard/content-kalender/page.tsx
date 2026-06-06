"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { generateContentCalendar } from "@/app/actions/generate-content-calendar";
import {
  calendarToExportText,
  CONTENT_CALENDAR_CREDIT_COST,
  type ContentCalendarDay,
  type ContentCalendarResult,
  type ContentCalendarFrequency,
  type GenerateContentCalendarInput,
} from "@/lib/content-calendar-analysis";
import { scriptGeneratorTopicUrl } from "@/lib/safe-url-param";
import { onGenerationActionResult, shouldShowInlineGenerationError } from "@/lib/handle-generation-result";
import { useOptimisticGeneration } from "@/hooks/use-optimistic-generation";
import { useUserCredits } from "@/hooks/use-user-credits";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

const CREDIT_COST = CONTENT_CALENDAR_CREDIT_COST;

type Step = "input" | "loading" | "results";

const PLATFORMS = [
  "TikTok",
  "YouTube Shorts",
  "Instagram Reels",
  "Alle Plattformen",
];

const FREQUENCIES: { id: ContentCalendarFrequency; label: string }[] = [
  { id: "daily", label: "1× / Tag" },
  { id: "three_per_week", label: "3× / Woche" },
  { id: "weekly", label: "1× / Woche" },
];

const LOADING_MESSAGES = [
  "Analysiere deine Nische…",
  "Plane 30 Tage Content…",
  "Generiere Hooks & Hashtags…",
  "Optimiere Posting-Zeiten…",
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

function ContentKalenderPageInner() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS[3]);
  const [frequency, setFrequency] = useState<ContentCalendarFrequency>("daily");
  const [language, setLanguage] = useState<"de" | "en">("de");
  const [result, setResult] = useState<ContentCalendarResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const { credits } = useUserCredits();
  const { generate } = useOptimisticGeneration();

  const exportText = useMemo(
    () => (result ? calendarToExportText(result) : ""),
    [result]
  );

  const runGenerate = async () => {
    setError(null);
    setStep("loading");
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 2400);

    const payload: GenerateContentCalendarInput = {
      niche,
      platform,
      frequency,
      language,
    };

    try {
      const res = await generate(
        () => generateContentCalendar(payload),
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

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const openScript = (day: ContentCalendarDay) => {
    const topic = `[HOOK] ${day.hook}\n\n[MAIN] Thema: ${day.topic}\n\n[CTA] Follow für mehr ${niche}-Content`;
    router.push(scriptGeneratorTopicUrl(topic));
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 48 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Calendar size={32} color="#B4FF00" strokeWidth={2} />
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
              CONTENT KALENDER KI
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", margin: "6px 0 0" }}>
              30-Tage Content-Plan mit Themen, Hooks und Posting-Zeiten
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
            <label style={labelStyle}>Deine Nische</label>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="z.B. Fitness, KI Tools, Personal Finance"
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
            <label style={labelStyle}>Posting-Frequenz</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ContentCalendarFrequency)}
              style={inputStyle}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
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
            disabled={!niche.trim()}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 12,
              border: "none",
              background: niche.trim() ? "#B4FF00" : "#2a2a2a",
              color: niche.trim() ? "#060608" : "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.3rem",
              cursor: niche.trim() ? "pointer" : "default",
            }}
          >
            Kalender generieren — {CREDIT_COST} Credits
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
          {result.summary && (
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              {result.summary}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => void copyExport()}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid rgba(180,255,0,0.35)",
                background: "rgba(180,255,0,0.08)",
                color: "#B4FF00",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copied ? "Kopiert ✓" : "Als Text exportieren"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setResult(null);
              }}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
                color: "rgba(255,255,255,0.75)",
                cursor: "pointer",
              }}
            >
              Neu generieren
            </button>
          </div>

          <div style={{ overflowX: "auto", ...cardStyle(), padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Tag", "Datum", "Thema", "Hook", "Format", "Zeit", "Hashtags", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 10px",
                        color: "rgba(255,255,255,0.5)",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.days.map((day) => (
                  <tr key={`${day.day}-${day.topic}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "10px", color: "#B4FF00", fontWeight: 700 }}>{day.day}</td>
                    <td style={{ padding: "10px", color: "rgba(255,255,255,0.65)", whiteSpace: "nowrap" }}>{day.dateLabel}</td>
                    <td style={{ padding: "10px", color: "#F0EFE8", maxWidth: 160 }}>{day.topic}</td>
                    <td style={{ padding: "10px", color: "rgba(255,255,255,0.85)", maxWidth: 200 }}>{day.hook}</td>
                    <td style={{ padding: "10px", whiteSpace: "nowrap" }}>{day.format}</td>
                    <td style={{ padding: "10px", whiteSpace: "nowrap" }}>{day.bestPostingTime}</td>
                    <td style={{ padding: "10px", color: "rgba(255,255,255,0.55)", maxWidth: 140 }}>
                      {day.hashtags.map((h) => `#${h}`).join(" ")}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <button
                        type="button"
                        onClick={() => openScript(day)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: "rgba(180,255,0,0.12)",
                          color: "#B4FF00",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Script →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContentKalenderPage() {
  return (
    <Suspense fallback={null}>
      <ContentKalenderPageInner />
    </Suspense>
  );
}

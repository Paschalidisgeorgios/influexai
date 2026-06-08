"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Rocket } from "lucide-react";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import {
  formatViewsCompact,
  TREND_SCRIPT_PLATFORMS,
  TREND_SCRIPT_REGIONS,
  TREND_SCRIPT_TOOL_CREDIT_COST,
  type TrendScriptRegion,
  type TrendScriptSource,
} from "@/lib/trend-script-tool";
import { useUserCredits } from "@/hooks/use-user-credits";

const CREDIT_COST = TREND_SCRIPT_TOOL_CREDIT_COST;

type Step = "input" | "loading" | "results";

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
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
};

const fieldStyle = {
  width: "100%",
  padding: "14px 16px",
  minHeight: 48,
  borderRadius: 10,
  background: "#18181d",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#F0EFE8",
  fontSize: "16px",
  outline: "none",
  fontFamily: "var(--font-dm), sans-serif",
} as const;

function TrendScriptPageInner() {
  const [step, setStep] = useState<Step>("input");
  const [thema, setThema] = useState("");
  const [plattform, setPlattform] = useState<string>(TREND_SCRIPT_PLATFORMS[0]);
  const [region, setRegion] = useState<TrendScriptRegion>("DE");
  const [script, setScript] = useState("");
  const [sources, setSources] = useState<TrendScriptSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { credits } = useUserCredits();

  const runGenerate = async () => {
    if (!thema.trim()) return;
    setError(null);
    setStep("loading");
    setScript("");
    setSources([]);

    try {
      const res = await fetch("/api/trend-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thema: thema.trim(),
          plattform,
          region,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        script?: string;
        sources?: TrendScriptSource[];
        credits?: number;
      };

      if (handleApiInsufficientCredits(res.status, data, CREDIT_COST)) {
        setStep("input");
        return;
      }

      if (res.status === 401) {
        setError("Bitte einloggen, um ein Script zu generieren.");
        setStep("input");
        return;
      }

      if (!res.ok || !data.success || !data.script) {
        throw new Error(data.error ?? "Generierung fehlgeschlagen.");
      }

      setScript(data.script);
      setSources(Array.isArray(data.sources) ? data.sources : []);
      setStep("results");
      window.dispatchEvent(new Event("credits-updated"));
    } catch (err) {
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : "Generierung fehlgeschlagen."
        )
      );
      setStep("input");
    }
  };

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const canGenerate = thema.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#060608] text-[#F0EFE8]">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-[#B4FF00]">
            Influex<span className="text-[#F0EFE8]">AI</span>
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/tools" className="text-white/70 hover:text-[#B4FF00]">
              Alle Tools
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#B4FF00] px-4 py-2 font-semibold text-[#060608] hover:bg-[#c8ff33]"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 64px" }}>
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
              <p
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: "0.9rem",
                  margin: "6px 0 0",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                Aktuelle YouTube-Trends → Script für deine Plattform
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
            {error.includes("einloggen") && (
              <Link
                href="/auth/sign-in"
                style={{ display: "block", marginTop: 8, color: "#B4FF00" }}
              >
                Zum Login →
              </Link>
            )}
          </div>
        )}

        {step === "input" && (
          <div
            style={{
              ...cardStyle(),
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 560,
            }}
          >
            <div>
              <label style={labelStyle}>Nische / Thema</label>
              <input
                type="text"
                value={thema}
                onChange={(e) => setThema(e.target.value)}
                placeholder='z.B. "AI Agents", Fitness, Productivity'
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Plattform</label>
              <select
                value={plattform}
                onChange={(e) => setPlattform(e.target.value)}
                style={fieldStyle}
              >
                {TREND_SCRIPT_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Region (Trend-Recherche)</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as TrendScriptRegion)}
                style={fieldStyle}
              >
                {TREND_SCRIPT_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => void runGenerate()}
              disabled={!canGenerate}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: 12,
                border: "none",
                background: canGenerate ? "#B4FF00" : "#2a2a2a",
                color: canGenerate ? "#060608" : "rgba(255,255,255,0.5)",
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "1.3rem",
                letterSpacing: "0.04em",
                cursor: canGenerate ? "pointer" : "default",
              }}
            >
              Script aus Trends generieren — {CREDIT_COST} Credits
            </button>

            {credits !== null && (
              <p
                style={{
                  textAlign: "center",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "0.78rem",
                  margin: 0,
                }}
              >
                {credits} Credits verfügbar
              </p>
            )}
          </div>
        )}

        {step === "loading" && (
          <div style={{ ...cardStyle(), textAlign: "center", padding: 48 }}>
            <p style={{ color: "#B4FF00", fontSize: "1rem", marginBottom: 8 }}>
              Lade YouTube-Trends & generiere Script…
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>
              InfluexAI Brain analysiert die Top-Videos der letzten 30 Tage.
            </p>
          </div>
        )}

        {step === "results" && script && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: "0.85rem",
                  margin: 0,
                }}
              >
                Script für {thema} · {plattform}
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep("input");
                  setScript("");
                  setSources([]);
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.75)",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                }}
              >
                Neu generieren
              </button>
            </div>

            {sources.length > 0 && (
              <div style={{ ...cardStyle(), padding: 16 }}>
                <p
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.45)",
                    margin: "0 0 10px",
                    textTransform: "uppercase",
                  }}
                >
                  Quellen-Videos (Trend-Basis)
                </p>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {sources.map((source, i) => (
                    <li
                      key={`${source.title}-${i}`}
                      style={{
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.65)",
                        lineHeight: 1.4,
                        fontFamily: "var(--font-dm), sans-serif",
                      }}
                    >
                      <span style={{ color: "#B4FF00", marginRight: 6 }}>
                        {formatViewsCompact(source.views)}
                      </span>
                      {source.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div
              style={{
                ...cardStyle(),
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    color: "#B4FF00",
                  }}
                >
                  DEIN SCRIPT
                </span>
                <button
                  type="button"
                  onClick={() => void copyScript()}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(180,255,0,0.35)",
                    background: "rgba(180,255,0,0.08)",
                    color: "#B4FF00",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {copied ? "Kopiert ✓" : "Kopieren"}
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  fontFamily: "var(--font-dm), sans-serif",
                  fontSize: "0.92rem",
                  lineHeight: 1.6,
                  color: "#F0EFE8",
                }}
              >
                {script}
              </pre>
            </div>
            <AiOutputDisclaimer />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrendScriptPage() {
  return (
    <Suspense fallback={null}>
      <TrendScriptPageInner />
    </Suspense>
  );
}

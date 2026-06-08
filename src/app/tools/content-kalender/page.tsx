"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import {
  CONTENT_KALENDER_FREQUENCIES,
  CONTENT_KALENDER_PLATFORMS,
  CONTENT_KALENDER_TOOL_CREDIT_COST,
  contentKalenderToExportText,
  type ContentKalenderEntry,
  type ContentKalenderFrequency,
} from "@/lib/content-kalender-tool";
import { useUserCredits } from "@/hooks/use-user-credits";

const CREDIT_COST = CONTENT_KALENDER_TOOL_CREDIT_COST;

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

function ContentKalenderPageInner() {
  const [step, setStep] = useState<Step>("input");
  const [nische, setNische] = useState("");
  const [plattform, setPlattform] = useState<string>(CONTENT_KALENDER_PLATFORMS[0]);
  const [frequenz, setFrequenz] = useState<ContentKalenderFrequency>("3x_woche");
  const [entries, setEntries] = useState<ContentKalenderEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const { credits } = useUserCredits();

  const frequenzLabel =
    CONTENT_KALENDER_FREQUENCIES.find((f) => f.id === frequenz)?.label ?? frequenz;

  const exportText = useMemo(
    () =>
      contentKalenderToExportText(entries, {
        nische,
        plattform,
        frequenz: frequenzLabel,
      }),
    [entries, nische, plattform, frequenzLabel]
  );

  const runGenerate = async () => {
    if (!nische.trim()) return;
    setError(null);
    setStep("loading");
    setEntries([]);

    try {
      const res = await fetch("/api/content-kalender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nische: nische.trim(),
          plattform,
          frequenz,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        entries?: ContentKalenderEntry[];
        credits?: number;
      };

      if (handleApiInsufficientCredits(res.status, data, CREDIT_COST)) {
        setStep("input");
        return;
      }

      if (res.status === 401) {
        setError("Bitte einloggen, um einen Kalender zu generieren.");
        setStep("input");
        return;
      }

      if (!res.ok || !data.success || !Array.isArray(data.entries)) {
        throw new Error(data.error ?? "Generierung fehlgeschlagen.");
      }

      setEntries(data.entries);
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

  const copyCalendar = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const canGenerate = nische.trim().length > 0;

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

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 64px" }}>
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
              <p
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: "0.9rem",
                  margin: "6px 0 0",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                Nische + Plattform + Frequenz → 4-Wochen Content-Plan
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
          <div style={{ ...cardStyle(), display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
            <div>
              <label style={labelStyle}>Nische</label>
              <input
                type="text"
                value={nische}
                onChange={(e) => setNische(e.target.value)}
                placeholder="z.B. Fitness, KI Tools, Personal Finance"
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
                {CONTENT_KALENDER_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Posting-Frequenz</label>
              <select
                value={frequenz}
                onChange={(e) =>
                  setFrequenz(e.target.value as ContentKalenderFrequency)
                }
                style={fieldStyle}
              >
                {CONTENT_KALENDER_FREQUENCIES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
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
              Kalender generieren — {CREDIT_COST} Credits
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
              InfluexAI Brain plant deinen Kalender…
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>
              Das kann einen Moment dauern.
            </p>
          </div>
        )}

        {step === "results" && entries.length > 0 && (
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
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", margin: 0 }}>
                {entries.length} Posts · {nische} · {plattform}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => void copyCalendar()}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(180,255,0,0.35)",
                    background: "rgba(180,255,0,0.08)",
                    color: "#B4FF00",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                  }}
                >
                  {copiedAll ? "Kopiert ✓" : "Kalender kopieren"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("input");
                    setEntries([]);
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
            </div>

            {/* Desktop table */}
            <div className="hidden md:block" style={{ ...cardStyle(), padding: 0, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Tag", "Content-Idee", "Format"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "14px 16px",
                          color: "rgba(255,255,255,0.5)",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr
                      key={`${entry.tag}-${i}`}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#B4FF00",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          verticalAlign: "top",
                        }}
                      >
                        {entry.tag}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#F0EFE8",
                          lineHeight: 1.5,
                          verticalAlign: "top",
                        }}
                      >
                        {entry.idee}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "rgba(255,255,255,0.65)",
                          whiteSpace: "nowrap",
                          verticalAlign: "top",
                        }}
                      >
                        {entry.format}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {entries.map((entry, i) => (
                <div key={`mobile-${entry.tag}-${i}`} style={cardStyle()}>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      color: "#B4FF00",
                    }}
                  >
                    {entry.tag}
                  </span>
                  <p
                    style={{
                      margin: "8px 0 10px",
                      fontSize: "0.92rem",
                      lineHeight: 1.55,
                      color: "#F0EFE8",
                      fontFamily: "var(--font-dm), sans-serif",
                    }}
                  >
                    {entry.idee}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.72rem",
                      padding: "4px 10px",
                      borderRadius: 99,
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.65)",
                    }}
                  >
                    {entry.format}
                  </span>
                </div>
              ))}
            </div>
            <AiOutputDisclaimer />
          </div>
        )}
      </div>
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

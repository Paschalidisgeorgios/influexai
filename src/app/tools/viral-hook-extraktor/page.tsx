"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import { VIRAL_HOOK_EXTRACTOR_CREDIT_COST } from "@/lib/viral-hook-extraktor";
import { useUserCredits } from "@/hooks/use-user-credits";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";

const CREDIT_COST = VIRAL_HOOK_EXTRACTOR_CREDIT_COST;

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

const inputStyle = {
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
  resize: "vertical" as const,
};

function ViralHookExtraktorPageInner() {
  const [step, setStep] = useState<Step>("input");
  const [input, setInput] = useState("");
  const [hooks, setHooks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { credits } = useUserCredits();

  const runGenerate = async () => {
    if (!input.trim()) return;
    setError(null);
    setStep("loading");
    setHooks([]);

    try {
      const res = await fetch("/api/viral-hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        hooks?: string[];
        credits?: number;
        creditsLeft?: number;
      };

      if (
        handleApiInsufficientCredits(res.status, data, CREDIT_COST)
      ) {
        setStep("input");
        return;
      }

      if (res.status === 401) {
        setError("Bitte einloggen, um Hooks zu generieren.");
        setStep("input");
        return;
      }

      if (!res.ok || !data.success || !Array.isArray(data.hooks)) {
        throw new Error(data.error ?? "Generierung fehlgeschlagen.");
      }

      setHooks(data.hooks);
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

  const copyHook = async (hook: string, index: number) => {
    try {
      await navigator.clipboard.writeText(hook);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const canGenerate = input.trim().length >= 10;

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
              <p
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: "0.9rem",
                  margin: "6px 0 0",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                Thema, Nische oder Transkript → virale Hooks für die ersten 3 Sekunden
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
                href="/login"
                style={{ display: "block", marginTop: 8, color: "#B4FF00" }}
              >
                Zum Login →
              </Link>
            )}
          </div>
        )}

        {step === "input" && (
          <div style={{ ...cardStyle(), display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Thema, Nische oder Transkript</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={6}
                placeholder="z.B. Fitness-Nische, Morning-Routine-Video-Idee, oder ein Transkript-Snippet…"
                style={{ ...inputStyle, minHeight: 160 }}
              />
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
              Hooks generieren — {CREDIT_COST} Credit
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
              InfluexAI Brain generiert Hooks…
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>
              Das dauert nur wenige Sekunden.
            </p>
          </div>
        )}

        {step === "results" && hooks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", margin: 0 }}>
                {hooks.length} Hooks generiert
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep("input");
                  setHooks([]);
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

            {hooks.map((hook, index) => (
              <div
                key={`${index}-${hook.slice(0, 24)}`}
                style={{
                  ...cardStyle(),
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      color: "#B4FF00",
                    }}
                  >
                    HOOK {index + 1}
                  </span>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "0.95rem",
                      lineHeight: 1.55,
                      color: "#F0EFE8",
                      fontFamily: "var(--font-dm), sans-serif",
                    }}
                  >
                    {hook}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void copyHook(hook, index)}
                  style={{
                    flexShrink: 0,
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
                  {copiedIndex === index ? "Kopiert ✓" : "Kopieren"}
                </button>
              </div>
            ))}
            <AiOutputDisclaimer />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ViralHookExtraktorPage() {
  return (
    <Suspense fallback={null}>
      <ViralHookExtraktorPageInner />
    </Suspense>
  );
}

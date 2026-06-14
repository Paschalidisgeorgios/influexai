"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { AssetLoadingShader } from "@/components/canvas/AssetLoadingShader";
import { IntentLink, useIntentTracking, type IntentKey } from "@/hooks/useIntentTracking";
import { TURNSTILE_SITE_KEY } from "@/lib/security/turnstile";
import "@/styles/canvas.css";

const DEMO_INTENT: IntentKey = "agent-autopilot";

type LandingLiveDemoPlaygroundProps = {
  className?: string;
};

export function LandingLiveDemoPlayground({ className = "" }: LandingLiveDemoPlaygroundProps) {
  const { setIntent } = useIntentTracking();
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [idea, setIdea] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const progressTimer = useRef<number | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const stopProgress = useCallback(() => {
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    stopProgress();
    setProgress(8);
    progressTimer.current = window.setInterval(() => {
      setProgress((p) => (p >= 92 ? 92 : p + Math.random() * 9 + 3));
    }, 280);
  }, [stopProgress]);

  useEffect(() => () => stopProgress(), [stopProgress]);

  const generate = async () => {
    const value = niche.trim();
    if (value.length < 2 || loading || !turnstileToken) return;

    setLoading(true);
    setError(null);
    setIdea(null);
    setIntent(DEMO_INTENT);
    startProgress();

    try {
      const res = await fetch("/api/generate/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: value, turnstileToken }),
      });
      const data = (await res.json()) as { success?: boolean; idea?: string; error?: string };

      if (!res.ok || !data.success || !data.idea) {
        setError(data.error ?? "Generierung fehlgeschlagen.");
        return;
      }

      setProgress(100);
      setIdea(data.idea);
    } catch {
      setError("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      stopProgress();
      setLoading(false);
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  };

  return (
    <article
      className={`flex min-h-[280px] flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5 backdrop-blur-md sm:min-h-[320px] ${className}`}
    >
      <div>
        <span className="inline-flex rounded-full border border-[#ccff00]/30 bg-[#ccff00]/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#ccff00]">
          Live-Demo
        </span>
        <h3
          className="mt-3 font-mono text-[15px] font-bold uppercase tracking-tight text-white"
        >
          Teste das KI-Gehirn
        </h3>

        <div className="mt-4 space-y-2.5">
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void generate();
            }}
            placeholder="Deine Nische (z.B. Krypto, Fitness, Fashion)..."
            disabled={loading}
            className="w-full rounded-lg border border-zinc-800 bg-black/40 p-2.5 text-xs text-white placeholder:text-white/60 focus:border-[#ccff00] focus:outline-none disabled:opacity-60"
            maxLength={80}
            aria-label="Deine Nische"
          />
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading || niche.trim().length < 2 || !turnstileToken}
            className="w-full rounded-lg bg-[#ccff00] px-3 py-2 text-xs font-bold text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Generiert…"
              : !turnstileToken
                ? "Sicherheitsprüfung läuft…"
                : "Idee generieren"}
          </button>
          <div className="sr-only" aria-hidden>
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={setTurnstileToken}
              onExpire={() => {
                setTurnstileToken(null);
                turnstileRef.current?.reset();
              }}
              options={{ size: "invisible" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 min-h-[120px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AssetLoadingShader
                progress={progress}
                label="KI analysiert Trends"
                accent="green"
                className="h-[120px] rounded-lg"
              />
            </motion.div>
          ) : idea ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-lg border border-[#ccff00]/20 bg-black/30 p-3"
            >
              <p
                className="text-[12px] leading-relaxed text-white/85"
                style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
              >
                <span className="text-[#ccff00]">💡 Deine virale Idee:</span> {idea}
              </p>
            </motion.div>
          ) : error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] leading-relaxed text-red-400"
            >
              {error}
            </motion.p>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] leading-relaxed text-white/60"
            >
              Claude analysiert deine Nische und liefert einen scroll-stoppenden Hook — ohne
              Registrierung.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <IntentLink
        href="/signup"
        className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[#ccff00] no-underline transition-opacity hover:opacity-80"
        onClick={() => setIntent(DEMO_INTENT)}
      >
        Im App Studio weiterbearbeiten
        <ArrowRight size={12} aria-hidden />
      </IntentLink>
    </article>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { IntentLink, useIntentTracking } from "@/hooks/useIntentTracking";
import { AssetLoadingShader } from "@/components/dashboard/viewer/AssetLoadingShader";
import {
  CONCIERGE_TOOL_ROUTES,
  type ConciergeToolId,
} from "@/lib/claude-concierge";
import { LandingHeroBackground } from "./LandingHeroBackground";
import { HeroKineticHeadline } from "./HeroKineticHeadline";
import { LANDING_HERO_2026 } from "@/lib/landing-copy-2026";
import { TURNSTILE_SITE_KEY } from "@/lib/security/turnstile";
import "@/styles/canvas.css";

const CONCIERGE_PLACEHOLDER =
  "Frage unser Studio-Gehirn (z.B. Wie erstelle ich Content für meine Modemarke?)...";

type ConciergeState = {
  answer: string;
  tool: ConciergeToolId;
} | null;

export function HeroSection() {
  const { setIntent } = useIntentTracking();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConciergeState>(null);
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
    setProgress(6);
    progressTimer.current = window.setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + Math.random() * 8 + 4));
    }, 260);
  }, [stopProgress]);

  useEffect(() => () => stopProgress(), [stopProgress]);

  useEffect(() => {
    if (result) {
      setIntent(CONCIERGE_TOOL_ROUTES[result.tool].intent);
    }
  }, [result, setIntent]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanQuestion = question.trim();
    if (!cleanQuestion || loading || !turnstileToken) return;

    setLoading(true);
    setError(null);
    setResult(null);
    startProgress();

    try {
      const res = await fetch("/api/generate/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion, turnstileToken }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        answer?: string;
        tool?: ConciergeToolId;
        error?: string;
      };

      if (!res.ok || !data.success || !data.answer || !data.tool) {
        setError(data.error ?? "Berater nicht erreichbar. Bitte erneut versuchen.");
        return;
      }

      setProgress(100);
      setResult({ answer: data.answer, tool: data.tool });
    } catch {
      setError("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      stopProgress();
      setLoading(false);
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  };

  const ctaRoute = result ? CONCIERGE_TOOL_ROUTES[result.tool] : null;
  const conciergeHref = ctaRoute?.href ?? "/signup";

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#030304]">
      <LandingHeroBackground />

      <div
        className="pointer-events-none absolute inset-0 z-[15] overflow-hidden"
        aria-hidden
      >
        <div className="landing-hero-content-glow landing-hero-content-glow--green blur-[120px]" />
        <div className="landing-hero-content-glow landing-hero-content-glow--cyan-violet blur-[120px]" />
      </div>

      <div className="relative z-20 w-full px-5 pt-24 pb-16 sm:px-8 md:px-[max(2rem,7vw)] lg:px-[max(3rem,9vw)]">
        <div className="mx-auto w-full max-w-xl text-center md:mx-0 md:max-w-[min(560px,38vw)] md:text-left">
          <p className="landing-neon-kicker mb-6 font-mono text-sm tracking-[0.14em] drop-shadow-[0_1px_10px_rgba(0,0,0,0.9)]">
            {LANDING_HERO_2026.kicker}
          </p>

          <HeroKineticHeadline />

          <div className="mb-0 flex justify-center md:justify-start">
            <IntentLink href="/signup" className="landing-glass-btn-cta">
              {LANDING_HERO_2026.ctaPrimary}
            </IntentLink>
          </div>

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="relative z-20 w-full"
          >
            <div className="landing-glass-surface mt-8 flex w-full max-w-xl items-center gap-2 rounded-xl border border-[#ccff00]/40 bg-zinc-950/40 p-3 shadow-[0_0_15px_rgba(204,255,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-300 focus-within:border-[#B4FF00] focus-within:ring-2 focus-within:ring-[#B4FF00] focus-within:shadow-[0_0_25px_rgba(180,255,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={CONCIERGE_PLACEHOLDER}
                disabled={loading}
                autoComplete="off"
                maxLength={400}
                aria-label="Frage an das Studio-Gehirn"
                className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-white/60 focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !question.trim() || !turnstileToken}
                aria-label="Frage senden"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#ccff00]/50 bg-[#ccff00]/10 text-[#ccff00] transition-all duration-300 hover:scale-105 hover:border-[#ccff00] hover:bg-[#ccff00]/20 hover:shadow-[0_0_20px_rgba(204,255,0,0.45)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
              </button>
            </div>

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

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="shader"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 overflow-hidden"
                >
                  <AssetLoadingShader
                    progress={progress}
                    label="Studio-Gehirn"
                    accent="green"
                    className="h-[100px] rounded-xl"
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {error ? (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-left font-sans text-xs leading-relaxed text-red-400"
                >
                  {error}
                </motion.p>
              ) : null}

              {result ? (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="landing-glass-surface mt-4 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-300 hover:border-zinc-500"
                >
                  <p className="text-left font-sans text-sm leading-relaxed tracking-wide text-white/80">
                    {result.answer}
                  </p>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.35 }}
                    className="mt-4"
                  >
                    <IntentLink
                      href={conciergeHref}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ccff00] px-4 py-3 text-sm font-bold text-black no-underline transition-all hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(204,255,0,0.35)] sm:w-auto"
                      onClick={() => {
                        if (ctaRoute) setIntent(ctaRoute.intent);
                      }}
                    >
                      App Studio öffnen →
                      <ArrowRight size={15} aria-hidden />
                    </IntentLink>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </section>
  );
}

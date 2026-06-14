"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type {
  CampaignExecution,
  CampaignGoal,
  CampaignMode,
  CampaignPlatform,
  CampaignResult,
  CampaignTone,
  ContentItem,
  ContentScores,
} from "@/lib/agent/types";
import {
  CAMPAIGN_AUTOPILOT_IS_PREVIEW,
  CAMPAIGN_SPECS,
  CAMPAIGN_STEPS,
} from "@/lib/agent/campaignPlanner";
import { qualityDecision } from "@/lib/agent/qualityScoring";
import { needsGuard, type GuardConfig } from "@/lib/agent/guards";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { GuardModal } from "@/components/dashboard/GuardModal";
import { saveFeedback } from "@/lib/agent/persistExecution";
import { openNoCreditsModal } from "@/lib/client-credits-ui";

type Phase = "idle" | "running" | "done";

type GuardState = {
  open: boolean;
  action: () => void;
  config: GuardConfig;
} | null;

type GuardCheck = {
  action: string;
  credits?: number;
};

const TOTAL_STEPS = 12;
const STEP_INTERVAL_MS = 400;

const MODE_OPTIONS: { id: CampaignMode; label: string }[] = [
  { id: "sprint", label: "2–3 Tage" },
  { id: "weekly", label: "7 Tage" },
  { id: "monthly", label: "30 Tage" },
  { id: "product_launch", label: "Produktkampagne" },
];

const PLATFORM_OPTIONS: { id: CampaignPlatform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube_shorts", label: "YouTube Shorts" },
  { id: "linkedin", label: "LinkedIn" },
];

const GOAL_OPTIONS: { id: CampaignGoal; label: string }[] = [
  { id: "reach", label: "Reichweite" },
  { id: "leads", label: "Leads" },
  { id: "trust", label: "Vertrauen" },
  { id: "product_sales", label: "Produktverkauf" },
  { id: "branding", label: "Branding" },
];

const TONE_OPTIONS: { id: CampaignTone; label: string }[] = [
  { id: "professional", label: "Professionell" },
  { id: "modern", label: "Modern" },
  { id: "direct", label: "Direkt" },
  { id: "trustworthy", label: "Vertrauensvoll" },
  { id: "bold", label: "Frech" },
];

const TYPE_LABELS: Record<ContentItem["type"], string> = {
  reel: "Reel",
  carousel: "Carousel",
  story: "Story",
  post: "Post",
  ad: "Ad",
  visual_briefing: "Visual",
};

function chipStyle(active: boolean) {
  return {
    borderRadius: 4,
    border: active
      ? "1px solid rgba(180,255,0,0.4)"
      : "1px solid rgba(255,255,255,0.1)",
    background: active ? "rgba(180,255,0,0.08)" : "rgba(255,255,255,0.04)",
    color: active ? "#B4FF00" : "rgba(255,255,255,0.5)",
    fontWeight: active ? 600 : 400,
  } as const;
}

function riskPillStyle(level: "low" | "medium" | "high" | undefined) {
  if (level === "high") {
    return {
      background: "rgba(255,140,0,0.15)",
      border: "1px solid rgba(255,140,0,0.35)",
      color: "#fdba74",
    };
  }
  if (level === "low") {
    return {
      background: "rgba(180,255,0,0.1)",
      border: "1px solid rgba(180,255,0,0.35)",
      color: "#B4FF00",
    };
  }
  return {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.55)",
  };
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-[10px]">
        <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
        <span style={{ color: "#B4FF00" }}>{value}</span>
      </div>
      <div
        className="h-1 w-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.07)", borderRadius: 0 }}
      >
        <div
          className="h-full transition-[width] duration-300"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: "#B4FF00",
            borderRadius: 0,
          }}
        />
      </div>
    </div>
  );
}

function countByType(items: ContentItem[], type: ContentItem["type"]) {
  return items.filter((item) => item.type === type).length;
}

function itemStatusLabel(item: ContentItem): string {
  const decision = item.scores ? qualityDecision(item.scores) : null;
  if (decision === "manual_review") return "manual_review";
  if (item.status === "approved") return "approved";
  return "generated";
}

function statusBadgeStyle(status: string) {
  if (status === "manual_review") {
    return {
      background: "rgba(249,115,22,0.12)",
      border: "1px solid rgba(249,115,22,0.35)",
      color: "#fdba74",
    };
  }
  if (status === "approved") {
    return {
      background: "rgba(180,255,0,0.1)",
      border: "1px solid rgba(180,255,0,0.35)",
      color: "#B4FF00",
    };
  }
  return {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.55)",
  };
}

export default function CampaignAutopilot() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<CampaignMode>("weekly");
  const [platforms, setPlatforms] = useState<CampaignPlatform[]>(["instagram"]);
  const [goal, setGoal] = useState<CampaignGoal>("reach");
  const [tone, setTone] = useState<CampaignTone>("modern");
  const [execution, setExecution] = useState<CampaignExecution | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [guard, setGuard] = useState<GuardState>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingResultRef = useRef<CampaignResult | null>(null);

  const estimatedCredits = CAMPAIGN_SPECS[mode].estimatedCredits;
  const modeLabel = CAMPAIGN_SPECS[mode].label;
  const canStart =
    prompt.trim().length > 0 && platforms.length > 0 && phase !== "running";

  const adjustTextareaHeight = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleTextareaInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  useEffect(() => {
    adjustTextareaHeight(textareaRef.current);
  }, [prompt, adjustTextareaHeight]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "running" || stepIdx < 11) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const serverResult = pendingResultRef.current;
    setExecution((prev) => {
      if (!prev || !serverResult) return prev;
      return {
        ...prev,
        status: "completed",
        result: serverResult,
        usedCredits: serverResult.usedCredits,
        updatedAt: new Date().toISOString(),
      };
    });
    setPhase("done");
  }, [phase, stepIdx]);

  const clearRunner = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const startStepAnimation = useCallback(() => {
    clearRunner();
    setStepIdx(0);
    intervalRef.current = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= 11) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 11;
        }
        return prev + 1;
      });
    }, STEP_INTERVAL_MS);
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      clearPolling();

      const pollOnce = async () => {
        try {
          const res = await fetch(`/api/agent/job/${id}`);
          const { job } = (await res.json()) as {
            job?: {
              status?: string;
              result?: CampaignResult & {
                remainingCredits?: number;
              };
              error?: string;
            };
          };

          if (job?.status === "completed" && job.result) {
            clearPolling();
            clearRunner();
            pendingResultRef.current = job.result;
            if ((job.result?.usedCredits ?? 0) > 0) {
              window.dispatchEvent(new Event("credits-updated"));
            }
            setExecution((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                status: "completed",
                result: job.result,
                usedCredits: job.result?.usedCredits ?? prev.estimatedCredits,
                updatedAt: new Date().toISOString(),
                steps: prev.steps.map((step) => ({
                  ...step,
                  status: "completed" as const,
                })),
              };
            });
            setPhase("done");
          }

          if (job?.status === "failed") {
            clearPolling();
            clearRunner();
            setStartError(job.error ?? "Job fehlgeschlagen");
            setPhase("idle");
            setExecution(null);
          }
        } catch (e) {
          console.error("[polling]", e);
        }
      };

      void pollOnce();
      pollIntervalRef.current = setInterval(() => {
        void pollOnce();
      }, 3000);
      pollTimeoutRef.current = setTimeout(() => clearPolling(), 600000);
    },
    [clearPolling]
  );

  const togglePlatform = (platform: CampaignPlatform) => {
    setPlatforms((prev) => {
      if (prev.includes(platform)) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== platform);
      }
      return [...prev, platform];
    });
  };

  const handleAbort = () => {
    clearRunner();
    clearPolling();
    setPhase("idle");
    setExecution(null);
    setStepIdx(0);
  };

  const handleStart = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || platforms.length === 0 || phase === "running") return;

    clearRunner();
    clearPolling();
    setStartError(null);
    pendingResultRef.current = null;

    let data: {
      execution: CampaignExecution;
      result?: CampaignResult;
      usedCredits?: number;
      jobId?: string;
      error?: string;
      credits?: number;
      required?: number;
    };

    try {
      const res = await fetch("/api/agent/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          mode,
          platforms,
          goal,
          tone,
        }),
      });
      data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          openNoCreditsModal({
            required: data.required ?? estimatedCredits,
            remaining: data.credits ?? 0,
          });
        }
        setStartError(data.error ?? "Fehler beim Starten");
        setPhase("idle");
        return;
      }
    } catch {
      setStartError("Netzwerkfehler. Bitte erneut versuchen.");
      setPhase("idle");
      return;
    }

    if ((data.usedCredits ?? 0) > 0) {
      window.dispatchEvent(new Event("credits-updated"));
    }

    if (data.jobId) {
      const next: CampaignExecution = {
        ...data.execution,
        status: "running",
        result: undefined,
        usedCredits: 0,
        steps: data.execution.steps.map((step, i) => ({
          ...step,
          status: i === 0 ? ("running" as const) : ("pending" as const),
        })),
      };
      setExecution(next);
      setPhase("running");
      startStepAnimation();
      startPolling(data.jobId);
      return;
    }

    if (!data.result) {
      setStartError("Kein Kampagnen-Ergebnis erhalten.");
      setPhase("idle");
      return;
    }

    pendingResultRef.current = data.result;

    const next: CampaignExecution = {
      ...data.execution,
      status: "running",
      result: undefined,
      usedCredits: 0,
      steps: data.execution.steps.map((step, i) => ({
        ...step,
        status: i === 0 ? ("running" as const) : ("pending" as const),
      })),
    };

    setExecution(next);
    setPhase("running");
    startStepAnimation();
  };

  const runWithGuards = useCallback(
    (checks: GuardCheck[], finalAction: () => void) => {
      const runCheck = (index: number) => {
        if (index >= checks.length) {
          finalAction();
          return;
        }
        const { action, credits } = checks[index];
        const config = needsGuard(action, credits);
        if (!config.required) {
          runCheck(index + 1);
          return;
        }
        setGuard({
          open: true,
          action: () => {
            setGuard(null);
            runCheck(index + 1);
          },
          config,
        });
      };
      runCheck(0);
    },
    []
  );

  const handleStartRequest = () => {
    runWithGuards(
      [{ action: "campaign_start", credits: estimatedCredits }],
      handleStart
    );
  };

  const handleNewCampaign = () => {
    clearRunner();
    setPhase("idle");
    setExecution(null);
    setStepIdx(0);
    pendingResultRef.current = null;
    setStartError(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canStart) handleStartRequest();
    }
  };

  const result = useMemo((): CampaignResult | null => {
    if (phase !== "done" || !execution) return null;
    return execution.result ?? null;
  }, [phase, execution]);

  const progressPct = ((stepIdx + 1) / TOTAL_STEPS) * 100;

  return (
    <div
      className="mx-auto max-w-[920px] min-w-0 overflow-x-hidden px-4 py-6 md:px-6 md:py-8"
      style={{ fontFamily: "var(--font-dm), sans-serif" }}
    >
      <header className="mb-6">
        <p
          className="mb-1 text-[0.72rem] font-bold uppercase tracking-[0.14em]"
          style={{ color: "#B4FF00" }}
        >
          Creator Studio · Preview
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-none">
            AUTOPILOT KAMPAGNE
          </h1>
          <span
            className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{
              borderRadius: 4,
              background: "rgba(180,255,0,0.1)",
              border: "1px solid rgba(180,255,0,0.45)",
              color: "#B4FF00",
            }}
          >
            Preview
          </span>
        </div>
        <p
          className="mt-2 text-[0.9rem] leading-[1.65]"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          Erstellt aktuell nur eine beispielhafte Kampagnenstruktur — noch kein
          echter autonomer Kampagnen-Agent.
        </p>
      </header>

      <div
        className="mb-6 px-4 py-3 text-[12px] leading-[1.6]"
        style={{
          borderRadius: 4,
          background: "rgba(180,255,0,0.06)",
          border: "1px solid rgba(180,255,0,0.22)",
          color: "rgba(255,255,255,0.72)",
        }}
      >
        {CAMPAIGN_AUTOPILOT_IS_PREVIEW ? (
          <p>
            <strong style={{ color: "#B4FF00" }}>Preview:</strong> Keine
            Live-Recherche, keine autonome Ausführung —{" "}
            <strong style={{ color: "#B4FF00" }}>0 Credits</strong> für
            Beispiel-Ergebnisse.
          </p>
        ) : (
          <p>
            Diese Kampagne nutzt echte KI-Generierung über mehrere Tools.
            Geschätzte Kosten:{" "}
            <strong style={{ color: "#B4FF00" }}>
              ~{estimatedCredits} Credits
            </strong>{" "}
            für „{modeLabel}".
          </p>
        )}
      </div>

      {/* Abschnitt 1 — Eingabe */}
      <div
        className="mb-3 flex flex-col gap-1.5 transition-[border-color] duration-200 focus-within:border-[rgba(180,255,0,0.35)]"
        style={{
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 4,
          padding: "12px 14px 10px 16px",
        }}
      >
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onInput={handleTextareaInput}
          onKeyDown={handleKeyDown}
          disabled={phase === "running"}
          placeholder="Beschreibe deine Kampagne..."
          rows={1}
          className="block w-full resize-none overflow-hidden border-none bg-transparent p-0 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.88)",
            minHeight: 22,
            maxHeight: 120,
            caretColor: "#B4FF00",
            lineHeight: 1.45,
            margin: 0,
          }}
        />

        <div className="flex items-center gap-[7px]">
          <span
            className="shrink-0 px-2 py-0.5 text-[11px] font-semibold leading-none"
            style={{
              borderRadius: 4,
              background: "rgba(180,255,0,0.08)",
              border: "1px solid rgba(180,255,0,0.4)",
              color: "#B4FF00",
            }}
          >
            {modeLabel}
          </span>

          <span className="flex-1" aria-hidden />

          <span
            className="shrink-0 text-[10px]"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            {CAMPAIGN_AUTOPILOT_IS_PREVIEW
              ? "Preview · 0 Credits"
              : `~${estimatedCredits} Credits`}
          </span>

          <button
            type="button"
            disabled={phase === "running" || !canStart}
            onClick={handleStartRequest}
            aria-label={
              CAMPAIGN_AUTOPILOT_IS_PREVIEW
                ? "Vorschau generieren"
                : `Kampagne starten · ~${estimatedCredits} Credits`
            }
            className="flex shrink-0 items-center justify-center transition-opacity disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
            style={{
              borderRadius: 4,
              background: "#B4FF00",
              opacity: canStart ? 1 : 0.28,
              pointerEvents: !canStart ? "none" : "auto",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M2 7h10M8 3l4 4-4 4"
                stroke="#060608"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <section className="mb-4 space-y-2">
        <ChipRow label="Modus">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={phase === "running"}
              onClick={() => setMode(opt.id)}
              className="min-h-[44px] px-3 py-2 text-xs transition-colors disabled:opacity-50"
              style={chipStyle(mode === opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </ChipRow>

        <ChipRow label="Plattform">
          {PLATFORM_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={phase === "running"}
              onClick={() => togglePlatform(opt.id)}
              className="min-h-[44px] px-3 py-2 text-xs transition-colors disabled:opacity-50"
              style={chipStyle(platforms.includes(opt.id))}
            >
              {opt.label}
            </button>
          ))}
        </ChipRow>

        <ChipRow label="Ziel">
          {GOAL_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={phase === "running"}
              onClick={() => setGoal(opt.id)}
              className="min-h-[44px] px-3 py-2 text-xs transition-colors disabled:opacity-50"
              style={chipStyle(goal === opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </ChipRow>

        <ChipRow label="Ton">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={phase === "running"}
              onClick={() => setTone(opt.id)}
              className="min-h-[44px] px-3 py-2 text-xs transition-colors disabled:opacity-50"
              style={chipStyle(tone === opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </ChipRow>
      </section>

      <button
        type="button"
        disabled={!canStart}
        onClick={handleStartRequest}
        className="mb-6 min-h-[44px] w-full py-3 transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
        style={{
          background: "#B4FF00",
          color: "#060608",
          borderRadius: 4,
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        {CAMPAIGN_AUTOPILOT_IS_PREVIEW
          ? "Vorschau generieren"
          : `Kampagne starten · ~${estimatedCredits} Credits`}
      </button>

      {startError && (
        <p
          className="mb-6 text-[12px]"
          style={{ color: "rgba(255,100,100,0.85)" }}
        >
          {startError}
        </p>
      )}

      {/* Abschnitt 2 — Progress */}
      {phase === "running" && (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{
                color: "rgba(255,255,255,0.45)",
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              }}
            >
              PREVIEW-AUSGABE
            </span>
            <span className="text-[11px] font-semibold" style={{ color: "#B4FF00" }}>
              {stepIdx + 1} / {TOTAL_STEPS}
            </span>
          </div>

          <p
            className="mb-3 text-[10px] leading-[1.5]"
            style={{ color: "rgba(255,255,255,0.42)" }}
          >
            Simulierte Schritte zur Illustration — keine echte Recherche oder
            KI-Generierung.
          </p>

          <div
            className="mb-2 h-1 w-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.07)", borderRadius: 0 }}
          >
            <div
              className="h-full transition-[width] duration-[350ms] ease-out"
              style={{
                width: `${progressPct}%`,
                background: "#B4FF00",
                borderRadius: 0,
              }}
            />
          </div>

          <p
            className="mb-4 uppercase tracking-[0.08em]"
            style={{ fontSize: 10, color: "rgba(180,255,0,0.75)" }}
          >
            {CAMPAIGN_STEPS[stepIdx]}
          </p>

          <div
            className="mb-4 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4"
            style={{ borderRadius: 2 }}
          >
            {CAMPAIGN_STEPS.map((label, index) => {
              const isActive = index === stepIdx;
              const isDone = index < stepIdx;

              return (
                <div
                  key={label}
                  className="flex min-h-[52px] flex-col justify-center px-2 py-1.5"
                  style={{
                    borderRadius: 2,
                    border: isActive
                      ? "1px solid rgba(180,255,0,0.35)"
                      : "1px solid rgba(255,255,255,0.06)",
                    background: isActive ? "rgba(180,255,0,0.08)" : "transparent",
                  }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className="text-[11px] leading-[1.35] sm:text-xs"
                      style={{
                        color: isActive
                          ? "#B4FF00"
                          : isDone
                            ? "rgba(180,255,0,0.45)"
                            : "rgba(255,255,255,0.28)",
                      }}
                    >
                      {label}
                    </span>
                    {isDone && (
                      <span className="text-[9px]" style={{ color: "#B4FF00" }}>
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAbort}
            className="px-3 py-1.5 text-[11px] font-semibold transition-colors hover:border-[rgba(255,80,80,0.4)] hover:text-[rgba(255,100,100,0.7)]"
            style={{
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.38)",
              background: "transparent",
            }}
          >
            Abbrechen
          </button>
        </section>
      )}

      {/* Abschnitt 3 — Result */}
      {phase === "done" && result && (
        <>
          <CampaignResultCard
            result={result}
            executionId={execution?.id}
            campaignMode={execution?.mode}
            onNewCampaign={handleNewCampaign}
          />
          <AiOutputDisclaimer className="mt-4" />
        </>
      )}

      {guard?.open && (
        <GuardModal
          isOpen={guard.open}
          title={guard.config.title}
          description={guard.config.description}
          confirmLabel={
            guard.config.type === "consent" ? "Einwilligung bestätigen" : "Fortfahren"
          }
          variant={guard.config.type}
          onConfirm={guard.action}
          onCancel={() => setGuard(null)}
        />
      )}

    </div>
  );
}

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <span
        className="w-full shrink-0 text-xs font-semibold uppercase tracking-[0.06em] sm:w-[72px]"
        style={{ color: "rgba(255,255,255,0.38)" }}
      >
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap gap-2">{children}</div>
    </div>
  );
}

function CampaignResultCard({
  result,
  executionId,
  campaignMode,
  onNewCampaign,
}: {
  result: CampaignResult;
  executionId?: string;
  campaignMode?: CampaignMode;
  onNewCampaign: () => void;
}) {
  const scores: ContentScores = result.overallScores;
  const items = result.items;
  const [showAllItems, setShowAllItems] = useState(false);
  const visibleItems = showAllItems ? items : items.slice(0, 5);
  const highRisk =
    scores.claimRisk === "high" || scores.legalRisk === "high";

  const overviewPills = [
    { label: "Reels", count: countByType(items, "reel") },
    { label: "Carousels", count: countByType(items, "carousel") },
    { label: "Stories", count: countByType(items, "story") },
    { label: "Posts", count: countByType(items, "post") },
    { label: "Ads", count: countByType(items, "ad") },
  ];

  return (
    <section
      className="overflow-hidden"
      style={{
        borderRadius: 2,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex">
        <div className="w-[3px] shrink-0" style={{ background: "#B4FF00" }} />
        <div className="flex-1 min-w-0 p-4">
          <h2
            className="mb-1"
            style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}
          >
            {result.title}
          </h2>
          <p
            className="mb-4"
            style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}
          >
            {result.summary}
          </p>

          {result.assumptionsMade.length > 0 && (
            <div
              className="mb-4 px-3 py-2.5"
              style={{
                background: "rgba(180,255,0,0.06)",
                border: "1px solid rgba(180,255,0,0.2)",
                borderRadius: 2,
              }}
            >
              <p
                className="mb-2 text-[11px] font-semibold"
                style={{ color: "rgba(180,255,0,0.8)" }}
              >
                Vereinfachte Demo-Annahmen:
              </p>
              <ul
                className="m-0 list-disc pl-4 text-[11px] leading-[1.55]"
                style={{ color: "rgba(180,255,0,0.8)" }}
              >
                {result.assumptionsMade.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-1.5">
            {overviewPills.map((pill) => (
              <span
                key={pill.label}
                className="px-2 py-0.5 text-[10px]"
                style={{
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {pill.label}: {pill.count}
              </span>
            ))}
          </div>

          <div className="mb-4 space-y-1">
            {visibleItems.map((item) => {
              const badge = itemStatusLabel(item);
              const score = item.scores?.overallScore;
              return (
                <div
                  key={item.id}
                  className="flex min-w-0 flex-wrap items-center gap-2 px-2 py-1.5 text-xs break-words"
                  style={{
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span
                    className="shrink-0 px-1.5 py-0.5 font-semibold"
                    style={{
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    Tag {item.day ?? "—"}
                  </span>
                  <span
                    className="shrink-0 px-1.5 py-0.5 font-semibold"
                    style={{
                      borderRadius: 4,
                      background: "rgba(180,255,0,0.08)",
                      border: "1px solid rgba(180,255,0,0.25)",
                      color: "#B4FF00",
                    }}
                  >
                    {TYPE_LABELS[item.type]}
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {item.title}
                  </span>
                  {typeof score === "number" && (
                    <span
                      style={{
                        color: score >= 85 ? "#B4FF00" : "rgba(255,255,255,0.45)",
                      }}
                    >
                      {score}
                    </span>
                  )}
                  <span
                    className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold"
                    style={{ borderRadius: 4, ...statusBadgeStyle(badge) }}
                  >
                    {badge}
                  </span>
                </div>
              );
            })}
            {items.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllItems((v) => !v)}
                className="px-2 py-1 text-[10px] font-semibold transition-colors hover:text-[#B4FF00]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {showAllItems
                  ? "Weniger anzeigen"
                  : `+ ${items.length - 5} weitere Items`}
              </button>
            )}
          </div>

          <div className="mb-4">
            {typeof scores.brandFit === "number" && (
              <ScoreBar label="Brand Fit" value={scores.brandFit} />
            )}
            {typeof scores.clarity === "number" && (
              <ScoreBar label="Clarity" value={scores.clarity} />
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {scores.claimRisk && (
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold"
                  style={{ borderRadius: 4, ...riskPillStyle(scores.claimRisk) }}
                >
                  Claim: {scores.claimRisk}
                </span>
              )}
              {scores.legalRisk && (
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold"
                  style={{ borderRadius: 4, ...riskPillStyle(scores.legalRisk) }}
                >
                  Legal: {scores.legalRisk}
                </span>
              )}
            </div>
            {highRisk && (
              <p
                className="mt-2 text-[10px] leading-[1.5]"
                style={{ color: "#fdba74" }}
              >
                Manuelle Prüfung
              </p>
            )}
          </div>

          <p
            className="mb-4 text-[10px] leading-[1.5]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {CAMPAIGN_AUTOPILOT_IS_PREVIEW ? (
              <>
                Preview — 0 Credits verbraucht. Beispiel-Inhalte sind
                Platzhalter, keine veröffentlichten oder recherchierten
                Ergebnisse.
              </>
            ) : (
              <>
                {result.usedCredits > 0
                  ? `${result.usedCredits} Credits verbraucht.`
                  : "Kampagne abgeschlossen."}{" "}
                Inhalte wurden per KI generiert — vor Veröffentlichung bitte
                prüfen.
              </>
            )}
          </p>

          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              aria-label="Gefällt mir"
              onClick={() =>
                void saveFeedback({
                  executionId,
                  action: "liked",
                  tool: "campaign_autopilot",
                  intent: campaignMode,
                  rating: 5,
                })
              }
              className="px-2.5 py-1 text-[13px] transition-opacity hover:opacity-80"
              style={{
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              👍
            </button>
            <button
              type="button"
              aria-label="Gefällt mir nicht"
              onClick={() =>
                void saveFeedback({
                  executionId,
                  action: "disliked",
                  tool: "campaign_autopilot",
                  intent: campaignMode,
                  rating: 1,
                })
              }
              className="px-2.5 py-1 text-[13px] transition-opacity hover:opacity-80"
              style={{
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              👎
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {["Mehr Varianten", "Exportieren", "In Kalender"].map((label) => (
              <button
                key={label}
                type="button"
                className="px-3 py-1.5 text-[11px] font-semibold transition-colors hover:bg-[#B4FF00] hover:text-[#060608]"
                style={{
                  borderRadius: 4,
                  border: "1px solid rgba(180,255,0,0.3)",
                  color: "#B4FF00",
                  background: "transparent",
                }}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={onNewCampaign}
              className="px-3 py-1.5 text-[11px] font-semibold transition-colors hover:bg-[#B4FF00] hover:text-[#060608]"
              style={{
                borderRadius: 4,
                border: "1px solid rgba(180,255,0,0.3)",
                color: "#B4FF00",
                background: "transparent",
              }}
            >
              Neue Kampagne
            </button>
          </div>

          <button
            type="button"
            disabled
            title="In der Preview noch nicht verfügbar"
            className="cursor-not-allowed px-3 py-1.5 text-[11px] font-semibold opacity-45"
            style={{
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.55)",
              background: "transparent",
            }}
          >
            Veröffentlichen (Preview — noch nicht verfügbar)
          </button>
        </div>
      </div>
    </section>
  );
}

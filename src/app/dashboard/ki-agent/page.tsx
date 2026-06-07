"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import type {
  AgentExecution,
  AgentExecutionStep,
  AgentResult,
  AgentScores,
  AgentTool,
} from "@/lib/agent/types";
import { needsGuard, type GuardConfig } from "@/lib/agent/guards";
import { saveFeedback } from "@/lib/agent/persistExecution";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { AgentResultOutputs } from "@/components/dashboard/AgentResultOutputs";
import { GuardModal } from "@/components/dashboard/GuardModal";
import { createClient } from "@/lib/supabase/client";
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

type ToolOption = {
  id: AgentTool | "auto";
  label: string;
};

const TOOL_OPTIONS: ToolOption[] = [
  { id: "auto", label: "Auto" },
  { id: "script_generator", label: "Script Generator" },
  { id: "produkt_werbung", label: "Produkt Werbung" },
  { id: "viral_hook_extraktor", label: "Viral Hook" },
  { id: "content_kalender", label: "Content Kalender" },
  { id: "image_generator", label: "Bild Generator" },
  { id: "ki_ich", label: "KI Avatar" },
  { id: "trend_script", label: "Trend Script" },
  { id: "thumbnail_concept", label: "Thumbnail" },
  { id: "stimme_musik", label: "Stimme & Musik" },
  { id: "live_creator", label: "Live Creator" },
  { id: "lora_training", label: "LoRA Training" },
];

const TOOL_LABEL_BY_ID: Record<AgentTool | "auto", string> = Object.fromEntries(
  TOOL_OPTIONS.map((t) => [t.id, t.label])
) as Record<AgentTool | "auto", string>;

const NEXT_ACTION_LABELS: Record<string, string> = {
  mehr_varianten: "Mehr Varianten",
  in_kalender_uebernehmen: "In Kalender übernehmen",
  thumbnail_erstellen: "Thumbnail erstellen",
  exportieren: "Exportieren",
};

const STEP_INTERVAL_MS = 320;
const TOTAL_STEPS = 12;

function fitPillStyle(level: "low" | "medium" | "high" | undefined) {
  if (level === "high") return { background: "#B4FF00", color: "#060608" };
  if (level === "low") return { background: "#ef4444", color: "#060608" };
  return { background: "rgba(255,255,255,0.12)", color: "#F0EFE8" };
}

function riskPillStyle(level: "low" | "medium" | "high" | undefined) {
  if (level === "high") return { background: "#f97316", color: "#060608" };
  if (level === "medium")
    return { background: "rgba(255,255,255,0.12)", color: "#F0EFE8" };
  return { background: "#B4FF00", color: "#060608" };
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-[10px]">
        <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
        <span style={{ color: "#B4FF00" }}>{value}/100</span>
      </div>
      <div
        className="h-1 w-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full transition-[width] duration-300 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: "#B4FF00",
          }}
        />
      </div>
    </div>
  );
}

function getCompletedCount(steps: AgentExecutionStep[]) {
  return steps.filter((s) => s.status === "completed").length;
}

function getActiveStep(steps: AgentExecutionStep[]) {
  return steps.find((s) => s.status === "running") ?? steps.find((s) => s.status === "pending");
}

function getActiveToolLabel(
  selectedTool: AgentTool | "auto",
  execution: AgentExecution | null
): string {
  if (execution?.selectedTools[0]) {
    return TOOL_LABEL_BY_ID[execution.selectedTools[0]] ?? execution.selectedTools[0];
  }
  if (selectedTool !== "auto") {
    return TOOL_LABEL_BY_ID[selectedTool];
  }
  return "Auto";
}

export default function KiAgentPage() {
  const [prompt, setPrompt] = useState("");
  const [execution, setExecution] = useState<AgentExecution | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AgentTool | "auto">("auto");
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [guard, setGuard] = useState<GuardState>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepIndexRef = useRef(0);
  const lastPromptRef = useRef("");

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
    let cancelled = false;
    const supabase = createClient();

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      if (data && typeof data.credits === "number") {
        setUserCredits(data.credits);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clearRunner = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const runExecution = useCallback(
    async (trimmed: string) => {
      clearRunner();
      setCreditError(null);

      let data: {
        execution: AgentExecution;
        result: AgentResult;
        usedCredits: number;
        remainingCredits?: number;
        error?: string;
        credits?: number;
        required?: number;
      };

      try {
        const res = await fetch("/api/agent/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed, type: "agent" }),
        });
        data = await res.json();

        if (!res.ok) {
          if (res.status === 402) {
            openNoCreditsModal({
              required: data.required ?? 0,
              remaining: data.credits ?? userCredits ?? 0,
            });
          }
          setCreditError(data.error ?? "Ausführung fehlgeschlagen.");
          return;
        }
      } catch {
        setCreditError("Netzwerkfehler. Bitte erneut versuchen.");
        return;
      }

      if (typeof data.remainingCredits === "number") {
        setUserCredits(data.remainingCredits);
      }
      window.dispatchEvent(new Event("credits-updated"));

      const serverResult = data.result;
      const usedCredits = data.usedCredits;

      const next: AgentExecution = {
        ...data.execution,
        status: "running",
        result: undefined,
        usedCredits: 0,
        steps: data.execution.steps.map((step, i) => ({
          ...step,
          status: i === 0 ? ("running" as const) : ("pending" as const),
        })),
      };

      lastPromptRef.current = trimmed;
      stepIndexRef.current = 0;
      setExecution(next);
      setPhase("running");

      intervalRef.current = setInterval(() => {
        stepIndexRef.current += 1;
        const current = stepIndexRef.current;

        if (current >= TOTAL_STEPS) {
          clearRunner();
          setExecution((prev) => {
            if (!prev || prev.status === "cancelled") return prev;

            const finalSteps = prev.steps.map((step) => ({
              ...step,
              status: "completed" as const,
            }));

            return {
              ...prev,
              steps: finalSteps,
              status: "completed",
              result: serverResult,
              usedCredits,
              updatedAt: new Date().toISOString(),
            };
          });
          setPhase("done");
          return;
        }

        setExecution((prev) => {
          if (!prev || prev.status === "cancelled") return prev;

          const steps = prev.steps.map((step, i) => {
            if (i < current) return { ...step, status: "completed" as const };
            if (i === current) return { ...step, status: "running" as const };
            return { ...step, status: "pending" as const };
          });

          return { ...prev, steps, updatedAt: new Date().toISOString() };
        });
      }, STEP_INTERVAL_MS);
    },
    [userCredits]
  );

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

  const estimatedCredits =
    execution?.estimatedCredits ?? (selectedTool === "auto" ? 2 : 2);

  const buildStartGuardChecks = useCallback((): GuardCheck[] => {
    const checks: GuardCheck[] = [];
    if (selectedTool === "ki_ich") {
      checks.push({ action: "avatar_from_face" });
    }
    if (selectedTool === "stimme_musik") {
      checks.push({ action: "voice_cloning" });
    }
    if (selectedTool === "live_creator") {
      checks.push({ action: "face_swap" });
    }
    checks.push({
      action: "agent_run",
      credits: estimatedCredits,
    });
    return checks;
  }, [estimatedCredits, selectedTool]);

  const handlePublishRequest = useCallback(
    (result: AgentResult) => {
      const checks: GuardCheck[] = [{ action: "publish_public" }];
      if (result.scores?.riskLevel === "high") {
        checks.push({ action: "legal_high" });
      }
      runWithGuards(checks, () => {
        // TODO: GUARD publishing — API-Anbindung folgt
      });
    },
    [runWithGuards]
  );

  const handleAbort = () => {
    clearRunner();
    setExecution((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: "cancelled",
        steps: prev.steps.map((step) =>
          step.status === "running"
            ? { ...step, status: "skipped" as const }
            : step
        ),
        updatedAt: new Date().toISOString(),
      };
    });
    setPhase("idle");
  };

  const handleSubmit = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || phase === "running") return;
    runWithGuards(buildStartGuardChecks(), () => {
      setPrompt("");
      requestAnimationFrame(() => adjustTextareaHeight(textareaRef.current));
      runExecution(trimmed);
    });
  }, [
    adjustTextareaHeight,
    buildStartGuardChecks,
    phase,
    prompt,
    runExecution,
    runWithGuards,
  ]);

  const handleRetry = () => {
    if (!lastPromptRef.current || phase === "running") return;
    setExecution(null);
    setPhase("idle");
    runExecution(lastPromptRef.current);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const completedSteps = execution ? getCompletedCount(execution.steps) : 0;
  const progressPct = (completedSteps / TOTAL_STEPS) * 100;
  const activeStep = execution ? getActiveStep(execution.steps) : null;
  const showExecution = execution !== null;
  const executionVisible = phase === "running" || phase === "done" || execution?.status === "cancelled";

  return (
    <div
      className="mx-auto max-w-[860px] min-w-0 overflow-x-hidden px-4 py-6 md:px-6 md:py-8"
      style={{ fontFamily: "var(--font-dm), sans-serif" }}
    >
      <header className="mb-6">
        <p
          className="mb-1 text-[0.72rem] font-bold uppercase tracking-[0.14em]"
          style={{ color: "#B4FF00" }}
        >
          Creator Studio
        </p>
        <h1
          className="text-[clamp(2rem,4vw,2.75rem)] leading-none"
          style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif" }}
        >
          KI AGENT
        </h1>
        <p
          className="mt-2 text-[0.9rem] leading-[1.65]"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          Intent erkennen, Tools orchestrieren, Ergebnis mit Scores liefern.
        </p>
      </header>

      {/* Command Bar */}
      <div
        className="flex flex-col gap-1.5 transition-[border-color] duration-200 focus-within:border-[rgba(180,255,0,0.35)]"
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
          placeholder="Was soll der Agent für dich erstellen?"
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

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label="Tools"
            onClick={() => setShowToolPanel((v) => !v)}
            className="flex shrink-0 items-center justify-center text-[15px] font-semibold leading-none transition-colors hover:text-[#B4FF00] min-h-[44px] min-w-[44px]"
            style={{
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(255,255,255,0.7)",
              background: "transparent",
            }}
          >
            +
          </button>

          <span
            className="shrink-0 px-2 py-0.5 text-[11px] font-semibold leading-none"
            style={{
              borderRadius: 4,
              background: "rgba(180,255,0,0.12)",
              border: "1px solid rgba(180,255,0,0.35)",
              color: "#B4FF00",
            }}
          >
            {getActiveToolLabel(selectedTool, execution)}
          </span>

          <span
            className="flex shrink-0 items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold leading-none"
            style={{
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: "#B4FF00" }}
            />
            Agent
          </span>

          <span className="flex-1" aria-hidden />

          <button
            type="button"
            disabled={phase === "running"}
            onClick={handleSubmit}
            aria-label="Senden"
            className="flex shrink-0 items-center justify-center transition-opacity disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
            style={{
              borderRadius: 4,
              background: "#B4FF00",
              opacity: prompt.trim() && phase !== "running" ? 1 : 0.28,
              pointerEvents: !prompt.trim() || phase === "running" ? "none" : "auto",
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

      {phase === "idle" && prompt.trim() && (
        <p className="mt-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>
          ~{estimatedCredits} Credits
        </p>
      )}

      {creditError && (
        <p className="mt-2 text-[11px]" style={{ color: "#ff6b7a" }}>
          {creditError}
        </p>
      )}

      {/* Tool Panel */}
      <div
        className="overflow-hidden transition-[opacity,max-height] duration-300 ease-out"
        style={{
          opacity: showToolPanel ? 1 : 0,
          maxHeight: showToolPanel ? 220 : 0,
          marginTop: showToolPanel ? 10 : 0,
          pointerEvents: showToolPanel ? "auto" : "none",
        }}
      >
        <div
          className="flex flex-wrap gap-1.5 p-3"
          style={{
            borderRadius: 4,
            background: "#0f0f12",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {TOOL_OPTIONS.map((tool) => {
            const active = selectedTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setSelectedTool(tool.id)}
                className="min-h-[44px] px-3 py-2 text-xs font-semibold transition-colors"
                style={{
                  borderRadius: 4,
                  border: active
                    ? "1px solid rgba(180,255,0,0.45)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: active ? "rgba(180,255,0,0.1)" : "transparent",
                  color: active ? "#B4FF00" : "rgba(255,255,255,0.55)",
                }}
              >
                {tool.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Execution Area */}
      {showExecution && (
        <div
          className="mt-6 transition-opacity duration-300 ease-out"
          style={{
            opacity: executionVisible ? 1 : 0,
            pointerEvents: executionVisible ? "auto" : "none",
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{
                color: "rgba(255,255,255,0.45)",
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              }}
            >
              AUSFÜHRUNG
            </span>
            <span className="text-[11px] font-semibold" style={{ color: "#B4FF00" }}>
              {completedSteps} / {TOTAL_STEPS}
            </span>
          </div>

          <div
            className="mb-3 h-1 w-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <div
              className="h-full transition-[width] duration-[350ms] ease-out"
              style={{ width: `${progressPct}%`, background: "#B4FF00" }}
            />
          </div>

          <p
            className="mb-3 uppercase tracking-[0.08em]"
            style={{ fontSize: 10, color: "rgba(180,255,0,0.75)" }}
          >
            {activeStep?.label ?? "—"}
          </p>

          <div
            className="mb-4 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4"
            style={{ borderRadius: 2 }}
          >
            {execution?.steps.map((step) => {
              const isActive = step.status === "running";
              const isDone = step.status === "completed";
              const isFailed = step.status === "failed";

              return (
                <div
                  key={step.id}
                  className="flex min-h-[52px] flex-col justify-center px-2 py-1.5"
                  style={{
                    borderRadius: 2,
                    border: isActive
                      ? "1px solid rgba(180,255,0,0.35)"
                      : "1px solid rgba(255,255,255,0.06)",
                    background: isActive
                      ? "rgba(180,255,0,0.08)"
                      : isDone
                        ? "rgba(180,255,0,0.04)"
                        : "transparent",
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
                            : isFailed
                              ? "rgba(255,80,80,0.7)"
                              : "rgba(255,255,255,0.28)",
                      }}
                    >
                      {step.label}
                    </span>
                    {isFailed && (
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="shrink-0 text-[9px] underline"
                        style={{ color: "rgba(255,100,100,0.85)" }}
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {phase === "running" && (
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
          )}

          {execution?.status === "cancelled" && (
            <p className="mt-2 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              Ausführung abgebrochen.
            </p>
          )}
        </div>
      )}

      {/* Result Card */}
      {phase === "done" && execution?.result && (
        <>
          <ResultCard
            result={execution.result}
            usedCredits={execution.usedCredits}
            executionId={execution.id}
            tool={execution.selectedTools[0]}
            intent={execution.intent}
            onPublish={() => handlePublishRequest(execution.result!)}
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

function ResultCard({
  result,
  usedCredits,
  onPublish,
  executionId,
  tool,
  intent,
}: {
  result: AgentResult;
  usedCredits?: number;
  onPublish: () => void;
  executionId?: string;
  tool?: string;
  intent?: string;
}) {
  const scores: AgentScores = result.scores ?? {};
  const nextActions = result.nextActions ?? [];

  return (
    <div
      className="mt-6 overflow-hidden"
      style={{
        borderRadius: 2,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex">
        <div className="w-[3px] shrink-0" style={{ background: "#B4FF00" }} />
        <div className="flex-1 p-4">
          <h2
            className="mb-1"
            style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}
          >
            {result.title}
          </h2>
          <p
            className="mb-4"
            style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}
          >
            {result.summary}
          </p>

          <AgentResultOutputs result={result} />

          {usedCredits !== undefined && (
            <p className="mb-3 text-[10px]" style={{ color: "rgba(180,255,0,0.65)" }}>
              {usedCredits} Credits verwendet
            </p>
          )}

          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              aria-label="Gefällt mir"
              onClick={() =>
                void saveFeedback({
                  executionId,
                  action: "liked",
                  tool,
                  intent,
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
                  tool,
                  intent,
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

          <div className="mb-4">
            {typeof scores.hookScore === "number" && (
              <ScoreBar label="Hook Score" value={scores.hookScore} />
            )}
            {typeof scores.clarity === "number" && (
              <ScoreBar label="Clarity" value={scores.clarity} />
            )}
            {typeof scores.ctaStrength === "number" && (
              <ScoreBar label="CTA Strength" value={scores.ctaStrength} />
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {scores.platformFit && (
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold"
                  style={{ borderRadius: 4, ...fitPillStyle(scores.platformFit) }}
                >
                  Platform: {scores.platformFit}
                </span>
              )}
              {scores.trendFit && (
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold"
                  style={{ borderRadius: 4, ...fitPillStyle(scores.trendFit) }}
                >
                  Trend: {scores.trendFit}
                </span>
              )}
              {scores.riskLevel && (
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold"
                  style={{ borderRadius: 4, ...riskPillStyle(scores.riskLevel) }}
                >
                  Risk: {scores.riskLevel}
                </span>
              )}
            </div>
            {scores.riskLevel === "high" && (
              <p
                className="mt-2 text-[10px] leading-[1.5]"
                style={{ color: "#fdba74" }}
              >
                Hinweis: Potenziell riskante Claims — vor Veröffentlichung prüfen.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {nextActions.map((action) => (
              <button
                key={action}
                type="button"
                className="px-3 py-1.5 text-[11px] font-semibold transition-colors hover:bg-[#B4FF00] hover:text-[#060608]"
                style={{
                  borderRadius: 4,
                  border: "1px solid #B4FF00",
                  color: "#B4FF00",
                  background: "transparent",
                }}
              >
                {NEXT_ACTION_LABELS[action] ?? action}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onPublish}
            className="mt-3 px-3 py-1.5 text-[11px] font-semibold transition-colors hover:border-[rgba(180,255,0,0.45)] hover:text-[#B4FF00]"
            style={{
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.55)",
              background: "transparent",
            }}
          >
            Veröffentlichen — Bestätigung erforderlich
          </button>
        </div>
      </div>
    </div>
  );
}

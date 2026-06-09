"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import type {
  AgentExecution,
  AgentResult,
  AgentScores,
  AgentTool,
} from "@/lib/agent/types";
import { detectIntent } from "@/lib/agent/router";
import { estimateKiAgentOrchestrateCredits } from "@/lib/agent/ki-agent-orchestrate-credits";
import { needsGuard, type GuardConfig } from "@/lib/agent/guards";
import { saveFeedback } from "@/lib/agent/persistExecution";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { AgentResultOutputs } from "@/components/dashboard/AgentResultOutputs";
import { AgentPlanPreviewCard } from "@/components/dashboard/AgentPlanPreviewCard";
import { AgentPlannerBlockedCard } from "@/components/dashboard/AgentPlannerBlockedCard";
import { GuardModal } from "@/components/dashboard/GuardModal";
import { createClient } from "@/lib/supabase/client";
import { openNoCreditsModal } from "@/lib/client-credits-ui";
import type {
  AgentPlanPreviewResponse,
  AgentPlannerBlockedResponse,
} from "@/lib/agent/plan-preview-types";

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

const DETECTED_TOOL_LABELS: Record<AgentTool, string> = {
  script_generator: "Script Generator",
  produkt_werbung: "Produkt Werbung",
  viral_hook_extraktor: "Viral Hook",
  content_kalender: "Content Kalender",
  image_generator: "Bild Generator",
  ki_ich: "KI Avatar",
  trend_script: "Trend Script",
  thumbnail_concept: "Thumbnail",
  stimme_musik: "Stimme & Musik",
  live_creator: "Live Creator",
  lora_training: "LoRA Training",
  ki_agent: "KI Agent",
};

function formatDetectedTools(tools: AgentTool[] | undefined): string {
  if (!tools?.length) return "Automatisch erkannt";
  return tools.map((tool) => DETECTED_TOOL_LABELS[tool] ?? tool).join(", ");
}

const NEXT_ACTION_LABELS: Record<string, string> = {
  mehr_varianten: "Mehr Varianten",
  in_kalender_uebernehmen: "In Kalender übernehmen",
  thumbnail_erstellen: "Thumbnail erstellen",
};

const UNAVAILABLE_NEXT_ACTIONS = new Set([
  "exportieren",
  "mehr_varianten",
  "in_kalender_uebernehmen",
  "thumbnail_erstellen",
  "caption_schreiben",
]);

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

export default function KiAgentPage() {
  const [prompt, setPrompt] = useState("");
  const [execution, setExecution] = useState<AgentExecution | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [guard, setGuard] = useState<GuardState>(null);
  const [planPreview, setPlanPreview] = useState<AgentPlanPreviewResponse | null>(
    null
  );
  const [planPreviewLoading, setPlanPreviewLoading] = useState(false);
  const [planPreviewError, setPlanPreviewError] = useState<string | null>(null);
  const [plannerBlocked, setPlannerBlocked] =
    useState<AgentPlannerBlockedResponse | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const runExecution = useCallback(
    async (trimmed: string) => {
      setCreditError(null);
      setPlanPreview(null);
      setPlanPreviewError(null);
      setPlannerBlocked(null);
      setExecution(null);
      setPhase("running");

      let data: {
        execution?: AgentExecution;
        result?: AgentResult;
        usedCredits?: number;
        remainingCredits?: number;
        error?: string;
        credits?: number;
        required?: number;
        blockedByPlanner?: boolean;
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
          setPhase("idle");
          return;
        }

        if (data.blockedByPlanner) {
          setPlannerBlocked(data as AgentPlannerBlockedResponse);
          setPhase("idle");
          return;
        }

        if (!data.execution || !data.result) {
          setCreditError("Ausführung fehlgeschlagen.");
          setPhase("idle");
          return;
        }
      } catch {
        setCreditError("Netzwerkfehler. Bitte erneut versuchen.");
        setPhase("idle");
        return;
      }

      if (typeof data.remainingCredits === "number") {
        setUserCredits(data.remainingCredits);
      }
      window.dispatchEvent(new Event("credits-updated"));

      setExecution({
        ...data.execution,
        status: "completed",
        result: data.result,
        usedCredits: data.usedCredits ?? 0,
        updatedAt: new Date().toISOString(),
      });
      setPhase("done");
    },
    [userCredits]
  );

  const fetchPlanPreview = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || phase === "running") return;

    setPlanPreviewLoading(true);
    setPlanPreviewError(null);
    setPlannerBlocked(null);

    try {
      const res = await fetch("/api/agent/plan-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, locale: "de" }),
      });
      const data = (await res.json()) as AgentPlanPreviewResponse & {
        error?: string;
      };

      if (!res.ok) {
        setPlanPreview(null);
        setPlanPreviewError(data.error ?? "Plan-Vorschau fehlgeschlagen.");
        return;
      }

      setPlanPreview(data);
    } catch {
      setPlanPreview(null);
      setPlanPreviewError("Netzwerkfehler bei der Plan-Vorschau.");
    } finally {
      setPlanPreviewLoading(false);
    }
  }, [phase, prompt]);

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

  const billingEstimate = useMemo(() => {
    const trimmed = prompt.trim();
    if (!trimmed) return null;
    return estimateKiAgentOrchestrateCredits(detectIntent(trimmed));
  }, [prompt]);

  const estimatedCredits =
    execution?.estimatedCredits ?? billingEstimate?.typical ?? 0;

  const buildStartGuardChecks = useCallback((): GuardCheck[] => {
    return [
      {
        action: "agent_run",
        credits: billingEstimate?.max ?? estimatedCredits,
      },
    ];
  }, [billingEstimate, estimatedCredits]);

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

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

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
          Beschreibe deine Aufgabe — der Assistent erkennt automatisch, welches
          Tool passt, und führt es aus.
        </p>
      </header>

      <p
        className="mb-4 text-[0.78rem] leading-[1.55]"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        Keine manuelle Tool-Auswahl: Die Zuordnung erfolgt automatisch anhand
        deines Prompts (Keyword-Erkennung). Credits werden von den ausgeführten
        Tools abgezogen — keine separate Agent-Gebühr.
      </p>

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

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
          <span
            className="hidden min-[360px]:inline shrink-0 px-2 py-0.5 text-[11px] font-semibold leading-none"
            style={{
              borderRadius: 4,
              background: "rgba(180,255,0,0.12)",
              border: "1px solid rgba(180,255,0,0.35)",
              color: "#B4FF00",
            }}
          >
            Auto-Erkennung
          </span>

          <span className="flex-1" aria-hidden />

          <button
            type="button"
            disabled={phase === "running" || planPreviewLoading || !prompt.trim()}
            onClick={() => void fetchPlanPreview()}
            className="shrink-0 min-h-[44px] px-3 py-2 text-[11px] sm:text-xs font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(255,255,255,0.75)",
              background: "transparent",
            }}
          >
            {planPreviewLoading ? "Plan…" : "Plan-Vorschau"}
          </button>

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

      {phase === "idle" && prompt.trim() && billingEstimate && (
        <div className="mt-1.5 space-y-1">
          <p className="text-[11px] sm:text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
            Schätzung: {billingEstimate.label} — abhängig vom erkannten Tool
          </p>
          <p className="text-[11px] sm:text-xs leading-[1.45]" style={{ color: "rgba(255,255,255,0.32)" }}>
            Credits werden von den ausgeführten Tools abgezogen, keine separate
            Agent-Gebühr.
          </p>
        </div>
      )}

      {planPreviewError && (
        <p className="mt-2 text-[11px]" style={{ color: "#ff6b7a" }}>
          {planPreviewError}
        </p>
      )}

      {planPreview && <AgentPlanPreviewCard preview={planPreview} />}

      {plannerBlocked && <AgentPlannerBlockedCard blocked={plannerBlocked} />}

      {creditError && (
        <p className="mt-2 text-[11px]" style={{ color: "#ff6b7a" }}>
          {creditError}
        </p>
      )}

      {phase === "running" && (
        <div
          className="mt-6 p-4"
          style={{
            borderRadius: 4,
            background: "#0f0f12",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{
              color: "rgba(255,255,255,0.45)",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            }}
          >
            Ladezustand
          </p>
          <p
            className="mt-3 text-[0.85rem] font-medium"
            style={{ color: "rgba(255,255,255,0.82)" }}
          >
            Aufgabe wird analysiert, passendes Tool wird ausgewählt und
            ausgeführt…
          </p>
          <p
            className="mt-2 text-[0.72rem] leading-[1.5]"
            style={{ color: "rgba(255,255,255,0.42)" }}
          >
            Keine autonome Planung oder Recherche — automatische Tool-Zuordnung
            per Keyword-Erkennung.
          </p>
          <div
            className="mt-4 h-1 w-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <div
              className="h-full w-1/3 animate-pulse"
              style={{ background: "#B4FF00" }}
            />
          </div>
        </div>
      )}

      {phase === "done" && execution && (
        <p
          className="mt-4 text-[11px] font-semibold"
          style={{ color: "rgba(180,255,0,0.85)" }}
        >
          Genutztes Tool: {formatDetectedTools(execution.selectedTools)}
        </p>
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
  executionId,
  tool,
  intent,
}: {
  result: AgentResult;
  usedCredits?: number;
  executionId?: string;
  tool?: string;
  intent?: string;
}) {
  const scores: AgentScores = result.scores ?? {};
  const nextActions = (result.nextActions ?? []).filter(
    (action) => !UNAVAILABLE_NEXT_ACTIONS.has(action)
  );

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

          {usedCredits !== undefined && usedCredits > 0 && (
            <p className="mb-3 text-[10px]" style={{ color: "rgba(180,255,0,0.65)" }}>
              {usedCredits} Credits verwendet
            </p>
          )}
          {usedCredits === 0 && (
            <p
              className="mb-3 text-[10px] leading-[1.45]"
              style={{ color: "rgba(255,255,255,0.42)" }}
            >
              Credits von den ausgeführten Tools abgezogen — aktualisierter
              Kontostand in der Sidebar.
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

          {nextActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nextActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled
                  title="Noch nicht verfügbar"
                  className="cursor-not-allowed px-3 py-1.5 text-[11px] font-semibold opacity-45"
                  style={{
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.45)",
                    background: "transparent",
                  }}
                >
                  {NEXT_ACTION_LABELS[action] ?? action} (bald)
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

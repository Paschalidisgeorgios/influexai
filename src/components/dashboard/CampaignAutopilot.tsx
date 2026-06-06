"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type FormEvent,
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
import { CAMPAIGN_SPECS } from "@/lib/agent/campaignPlanner";
import {
  buildCampaignResult,
  createCampaignExecution,
} from "@/lib/agent/mockExecutor";
import { qualityDecision } from "@/lib/agent/qualityScoring";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";

type Phase = "idle" | "running" | "done";

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

const PLATFORM_LABELS: Record<CampaignPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube_shorts: "YouTube Shorts",
  linkedin: "LinkedIn",
};

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
    background: active ? "rgba(180,255,0,0.1)" : "transparent",
    color: active ? "#B4FF00" : "rgba(255,255,255,0.55)",
  } as const;
}

function riskPillStyle(level: "low" | "medium" | "high" | undefined) {
  if (level === "high") return { background: "#f97316", color: "#060608" };
  if (level === "low") return { background: "#B4FF00", color: "#060608" };
  return { background: "rgba(255,255,255,0.12)", color: "#F0EFE8" };
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
          className="h-full transition-[width] duration-300"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: "#B4FF00",
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
  const [stepIndex, setStepIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const estimatedCredits = CAMPAIGN_SPECS[mode].estimatedCredits;
  const canStart =
    prompt.trim().length > 0 && platforms.length > 0 && phase !== "running";

  const adjustTextareaHeight = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleTextareaInput = (event: FormEvent<HTMLTextAreaElement>) => {
    adjustTextareaHeight(event.currentTarget);
  };

  useEffect(() => {
    adjustTextareaHeight(textareaRef.current);
  }, [prompt, adjustTextareaHeight]);

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

  const togglePlatform = (platform: CampaignPlatform) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

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
    setStepIndex(0);
  };

  const handleStart = () => {
    const trimmed = prompt.trim();
    if (!trimmed || platforms.length === 0 || phase === "running") return;

    clearRunner();

    const next = createCampaignExecution(
      trimmed,
      mode,
      platforms,
      goal,
      tone
    );
    next.status = "running";
    next.steps = next.steps.map((step, i) => ({
      ...step,
      status: i === 0 ? ("running" as const) : ("pending" as const),
    }));

    setExecution(next);
    setPhase("running");
    setStepIndex(0);

    intervalRef.current = setInterval(() => {
      setStepIndex((prevIndex) => {
        const current = prevIndex + 1;

        if (current >= TOTAL_STEPS) {
          clearRunner();
          setExecution((prev) => {
            if (!prev || prev.status === "cancelled") return prev;

            const finalSteps = prev.steps.map((step) => ({
              ...step,
              status: "completed" as const,
            }));
            const result = buildCampaignResult({
              ...prev,
              steps: finalSteps,
              status: "completed",
            });

            return {
              ...prev,
              steps: finalSteps,
              status: "completed",
              result,
              usedCredits: result.usedCredits,
              updatedAt: new Date().toISOString(),
            };
          });
          setPhase("done");
          return TOTAL_STEPS;
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

        return current;
      });
    }, STEP_INTERVAL_MS);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canStart) handleStart();
    }
  };

  const completedSteps =
    execution?.steps.filter((s) => s.status === "completed").length ?? stepIndex;
  const progressPct = (completedSteps / TOTAL_STEPS) * 100;
  const showProgress = phase === "running" || phase === "done";
  const result = execution?.result;

  return (
    <div
      className="mx-auto max-w-[920px] px-4 py-6 md:px-6 md:py-8"
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
          CAMPAIGN AUTOPILOT
        </h1>
        <p
          className="mt-2 text-[0.9rem] leading-[1.65]"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          Briefing eingeben — Agent plant, generiert und prüft dein Content-Paket.
        </p>
      </header>

      {/* Abschnitt 1 — Eingabe */}
      <div
        className="mb-3 flex flex-col gap-2 transition-[border-color] duration-200 focus-within:border-[rgba(180,255,0,0.35)]"
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
            height: 22,
            caretColor: "#B4FF00",
            lineHeight: 1.45,
            margin: 0,
          }}
        />
      </div>

      <section className="mb-6 space-y-3">
        <div className="space-y-2">
          <ChipRow label="Modus">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={phase === "running"}
                onClick={() => setMode(opt.id)}
                className="px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50"
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
                className="px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50"
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
                className="px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50"
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
                className="px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50"
                style={chipStyle(tone === opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </ChipRow>
        </div>

        <button
          type="button"
          disabled={!canStart}
          onClick={handleStart}
          className="w-full py-2.5 text-[0.85rem] transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
          style={{
            background: "#B4FF00",
            color: "#060608",
            borderRadius: 4,
            fontWeight: 800,
          }}
        >
          Starten · ~{estimatedCredits} Credits
        </button>
      </section>

      {/* Abschnitt 2 — Progress */}
      {showProgress && execution && (
        <section
          className="mb-6 transition-opacity duration-300"
          style={{ opacity: 1 }}
        >
          <div className="mb-3 flex items-center justify-between">
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
            className="mb-4 h-1 w-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <div
              className="h-full transition-[width] duration-[350ms] ease-out"
              style={{ width: `${progressPct}%`, background: "#B4FF00" }}
            />
          </div>

          <div
            className="mb-4 grid grid-cols-4 gap-1"
            style={{ borderRadius: 2 }}
          >
            {execution.steps.map((step) => {
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
                      className="text-[9px] leading-[1.35]"
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
                    {isDone && (
                      <span className="text-[9px]" style={{ color: "#B4FF00" }}>
                        ✓
                      </span>
                    )}
                    {isFailed && (
                      <button
                        type="button"
                        onClick={handleStart}
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
        </section>
      )}

      {/* Abschnitt 3 — Result */}
      {phase === "done" && result && (
        <CampaignResultCard result={result} />
      )}

      <AiOutputDisclaimer className="mt-8" />
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
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="w-[72px] shrink-0 text-[10px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: "rgba(255,255,255,0.38)" }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function CampaignResultCard({ result }: { result: CampaignResult }) {
  const scores: ContentScores = result.overallScores;
  const items = result.items;
  const highRisk =
    scores.claimRisk === "high" || scores.legalRisk === "high";

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

          {result.assumptionsMade.length > 0 && (
            <div
              className="mb-4 rounded-[4px] px-3 py-2.5"
              style={{
                background: "rgba(180,255,0,0.06)",
                border: "1px solid rgba(180,255,0,0.2)",
              }}
            >
              <p
                className="mb-2 text-[10px] font-semibold"
                style={{ color: "#B4FF00" }}
              >
                Agent hat folgende Annahmen getroffen:
              </p>
              <ul
                className="m-0 list-disc pl-4 text-[10px] leading-[1.55]"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                {result.assumptionsMade.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-4">
            {typeof scores.brandFit === "number" && (
              <ScoreBar label="Brand Fit" value={scores.brandFit} />
            )}
            {typeof scores.clarity === "number" && (
              <ScoreBar label="Clarity" value={scores.clarity} />
            )}
            {typeof scores.platformFit === "number" && (
              <ScoreBar label="Platform Fit" value={scores.platformFit} />
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
                Manuelle Prüfung empfohlen
              </p>
            )}
          </div>

          <div className="mb-4">
            <p
              className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Content-Übersicht
            </p>
            <p
              className="mb-3 text-[10px]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Reels: {countByType(items, "reel")} | Carousels:{" "}
              {countByType(items, "carousel")} | Stories:{" "}
              {countByType(items, "story")} | Posts: {countByType(items, "post")}
            </p>
            <div className="space-y-1">
              {items.map((item) => {
                const badge = itemStatusLabel(item);
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-2 px-2 py-1.5 text-[10px]"
                    style={{
                      borderRadius: 2,
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span style={{ color: "#B4FF00" }}>
                      Tag {item.day ?? "—"}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.75)" }}>
                      {item.title}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>
                      {TYPE_LABELS[item.type]}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>
                      {PLATFORM_LABELS[item.platform]}
                    </span>
                    <span
                      className="ml-auto px-1.5 py-0.5 text-[9px] font-semibold"
                      style={{ borderRadius: 4, ...statusBadgeStyle(badge) }}
                    >
                      {badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p
            className="mb-4 text-[10px]"
            style={{ color: "rgba(180,255,0,0.65)" }}
          >
            Verwendet: {result.usedCredits} Credits
          </p>

          <div className="mb-3 flex flex-wrap gap-2">
            {[
              "Mehr Varianten",
              "Exportieren",
              "In Kalender",
              "Thumbnail erstellen",
            ].map((label) => (
              <button
                key={label}
                type="button"
                className="px-3 py-1.5 text-[11px] font-semibold transition-colors hover:bg-[#B4FF00] hover:text-[#060608]"
                style={{
                  borderRadius: 4,
                  border: "1px solid #B4FF00",
                  color: "#B4FF00",
                  background: "transparent",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              title="Erfordert separate Bestätigung"
              className="cursor-not-allowed px-3 py-1.5 text-[11px] font-semibold opacity-40"
              style={{
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.45)",
                background: "transparent",
              }}
            >
              Veröffentlichen
            </button>
            {/* TODO: GUARD publishing */}
            {/* TODO: GUARD öffentlich anzeigen */}
          </div>
        </div>
      </div>
    </section>
  );
}

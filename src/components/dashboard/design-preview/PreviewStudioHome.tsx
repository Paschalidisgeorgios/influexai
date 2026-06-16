"use client";

/**
 * PreviewStudioHome + PreviewAgentView — High-contrast editorial composition.
 * ALL DATA IS MOCK. Isolated to /dashboard/design-preview.
 */

import { Fragment } from "react";
import { useLang, type PreviewView, type Lang } from "./PreviewLang";
import { PreviewAgentCommand } from "./PreviewAgentCommand";

const ACCENT = "#b4ff00";
const DARK   = "#080808";
const SUBLINE = "rgba(8,8,8,0.72)";
const BODY   = "rgba(8,8,8,0.68)";
const META   = "rgba(8,8,8,0.45)";
const STONE  = "#DDD4C4";
const STONE2 = "#E8E0D4";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── Local OS-flow copy (preview-only, DE/EN) ─────────────────────────────────

const OS_COPY = {
  de: {
    pathLabel:     "Produktionspfad",
    pathSteps:     ["Idee", "Agent", "Tool", "Review", "Export"],
    routeActive:   "Produktionspfad aktiv",
    routePoints:   ["Brief analysiert", "Workflow gewählt", "Assets vorbereitet"],
    outputHeadline:"Kampagnenpaket entsteht",
    outputs: [
      { name: "Image Set",   status: "In Arbeit", format: "1:1"    },
      { name: "Motion Clip", status: "Wartend",   format: "9:16"   },
      { name: "Hooks",       status: "In Arbeit", format: "Text"   },
      { name: "Captions",    status: "Wartend",   format: "Export" },
    ],
    monitorOutput: "Live Output",
  },
  en: {
    pathLabel:     "Production Path",
    pathSteps:     ["Idea Intake", "Agent Routing", "Tool / Model", "Output Review", "Export"],
    routeActive:   "Live production route",
    routePoints:   ["Brief analyzed", "Best workflow selected", "Assets preparing"],
    outputHeadline:"Campaign package in progress",
    outputs: [
      { name: "Image Set",   status: "Preparing", format: "1:1"    },
      { name: "Motion Clip", status: "Queued",    format: "9:16"   },
      { name: "Hooks",       status: "Preparing", format: "Text"   },
      { name: "Captions",    status: "Queued",    format: "Export" },
    ],
    monitorOutput: "Live Output",
  },
} as const;

const ACTIVE_PATH_STEP = 1;

function useOsCopy() {
  const { lang } = useLang();
  return OS_COPY[lang as Lang];
}

// ─── Production Path bar ──────────────────────────────────────────────────────

function ProductionPathBar() {
  const os = useOsCopy();

  return (
    <div
      className="mt-4 min-w-0 md:mt-5"
      aria-label={os.pathLabel}
    >
      <p className="mb-2 font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: META }}>
        {os.pathLabel}
      </p>

      {/* Desktop — horizontal, max ~72px */}
      <div
        className="hidden min-w-0 items-center gap-0 rounded-sm px-3 py-2.5 md:flex"
        style={{
          maxHeight: "72px",
          background: STONE2,
          border: "1px solid rgba(8,8,8,0.07)",
        }}
      >
        {os.pathSteps.map((label, i) => (
          <Fragment key={label}>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  background: i === ACTIVE_PATH_STEP ? ACCENT : i < ACTIVE_PATH_STEP ? "rgba(8,8,8,0.25)" : STONE,
                  boxShadow: i === ACTIVE_PATH_STEP ? `0 0 8px ${ACCENT}66` : "none",
                }}
              />
              <span
                className="truncate text-center font-mono text-[9px] leading-tight tracking-[0.06em] uppercase md:text-[10px]"
                style={{
                  color: i === ACTIVE_PATH_STEP ? DARK : META,
                  fontWeight: i === ACTIVE_PATH_STEP ? 600 : 400,
                }}
              >
                {label}
              </span>
            </div>
            {i < os.pathSteps.length - 1 && (
              <div
                className="h-px w-3 shrink-0 lg:w-5"
                style={{ background: i < ACTIVE_PATH_STEP ? ACCENT : STONE }}
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* Mobile — 2-column wrap, no horizontal scroll */}
      <div
        className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-sm p-3 md:hidden"
        style={{ background: STONE2, border: "1px solid rgba(8,8,8,0.07)" }}
      >
        {os.pathSteps.map((label, i) => (
          <div key={label} className="flex min-w-0 items-center gap-2">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                background: i === ACTIVE_PATH_STEP ? ACCENT : STONE,
                boxShadow: i === ACTIVE_PATH_STEP ? `0 0 6px ${ACCENT}55` : "none",
              }}
            />
            <span
              className="truncate font-mono text-[10px] tracking-[0.05em] uppercase"
              style={{
                color: i === ACTIVE_PATH_STEP ? DARK : META,
                fontWeight: i === ACTIVE_PATH_STEP ? 600 : 400,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hero Production Monitor ──────────────────────────────────────────────────

function HeroMonitor({ integrated = false, tall = false }: { integrated?: boolean; tall?: boolean }) {
  const { t } = useLang();
  const ts = t.studio;
  const os = useOsCopy();

  return (
    <div
      className={`relative flex w-full min-w-0 flex-col overflow-hidden rounded-sm ${tall ? "h-full min-h-[540px] lg:min-h-[600px]" : "min-h-[260px] md:min-h-[320px]"}`}
      style={{
        background: "#0a0a10",
        border: integrated
          ? "1px solid rgba(8,8,8,0.14)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: integrated
          ? "0 24px 64px rgba(8,8,8,0.20), 0 0 0 1px rgba(8,8,8,0.05), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 24px 64px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.07)",
      }}
    >
      {integrated && (
        <div
          className="pointer-events-none absolute -left-8 top-[42%] hidden h-px w-8 md:block lg:-left-10 lg:w-10"
          style={{ background: `linear-gradient(90deg, ${ACCENT}55, transparent)` }}
        />
      )}

      <div
        className="absolute left-0 top-0 h-[2px] w-full"
        style={{ background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT}55 40%, transparent 80%)` }}
      />

      {/* Route status — linked to agent */}
      <div className="border-b px-4 py-3 md:px-5 md:py-3.5" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.25)" }}>
        <div className="mb-2.5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full" style={{ background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-300 md:text-[11px]">
            {os.routeActive}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {os.routePoints.map((point, i) => (
            <div key={point} className="flex min-w-0 items-center gap-2">
              <span
                className="font-mono text-[9px] uppercase tracking-wider"
                style={{ color: i < 2 ? ACCENT : "rgba(255,255,255,0.35)" }}
              >
                {i < 2 ? "✓" : "○"}
              </span>
              <span
                className="truncate font-mono text-[10px] tracking-[0.06em]"
                style={{ color: i < 2 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.40)" }}
              >
                {point}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b px-4 py-2.5 md:px-5" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/12" />
        <span className="ml-1 font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-500">
          {os.monitorOutput}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col justify-end p-5 md:p-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{ background: "radial-gradient(ellipse 85% 65% at 58% 28%, rgba(100,80,255,0.35), transparent)" }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.20]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative">
          <p className="mb-2 font-mono text-[10px] tracking-[0.14em] uppercase text-neutral-500">
            {ts.mediaPrimaryTitle}
          </p>
          <h3 className="mb-2 text-xl font-extrabold text-neutral-100 md:text-[1.625rem]" style={{ ...HL, fontWeight: 800 }}>
            {ts.mediaOutputs[0]?.label ?? "Campaign Visual"}
          </h3>
          <p className="max-w-sm text-[13px] leading-[1.6] text-neutral-400 md:text-[14px]">
            {ts.mediaPrimaryDesc}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
        {ts.mediaOutputs.map((out) => (
          <div key={out.label} className="px-3 py-3 md:px-4 md:py-3.5" style={{ background: "#0e0e16" }}>
            <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-neutral-500">{out.type}</p>
            <p className="mt-0.5 truncate text-[12px] font-semibold text-neutral-100 md:text-[13px]">{out.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Production Pipeline ──────────────────────────────────────────────────────

function ProductionPipeline() {
  const { t } = useLang();
  const ts = t.studio;

  return (
    <section className="pb-14 md:pb-20">
      <p className="mb-8 font-mono text-[11px] tracking-[0.16em] uppercase md:mb-10" style={{ color: META }}>
        {ts.pipelineLabel}
      </p>

      <div className="hidden md:block">
        <div className="relative mb-10">
          <div className="h-px w-full" style={{ background: STONE }} />
          <div
            className="absolute left-0 top-0 h-px w-[42%]"
            style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}55, transparent)` }}
          />
          {ts.pipelineSteps.map((step, i) => (
            <div
              key={step.num}
              className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
              style={{
                left: `${(i / (ts.pipelineSteps.length - 1)) * 100}%`,
                transform: "translate(-50%, -50%)",
                background: i <= 1 ? ACCENT : STONE,
                boxShadow: i === 1 ? `0 0 12px ${ACCENT}88` : "none",
              }}
            />
          ))}
        </div>

        <div className="grid grid-cols-6 gap-8 lg:gap-10">
          {ts.pipelineSteps.map((step, i) => (
            <div key={step.num}>
              <p
                className="mb-3 font-mono text-[11px] tracking-[0.14em] uppercase"
                style={{ color: i <= 1 ? ACCENT : META }}
              >
                {step.num}
              </p>
              <p className="mb-2 text-[17px] font-extrabold leading-tight" style={{ ...HL, color: DARK, fontWeight: 800 }}>
                {step.label}
              </p>
              <p className="text-[14px] leading-[1.55]" style={{ color: BODY }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-0 md:hidden">
        {ts.pipelineSteps.map((step, i) => (
          <Fragment key={step.num}>
            <div className="flex gap-5 py-4">
              <p
                className="shrink-0 pt-0.5 font-mono text-[11px] tracking-[0.14em] uppercase"
                style={{ color: i <= 1 ? ACCENT : META }}
              >
                {step.num}
              </p>
              <div>
                <p className="mb-1.5 text-[16px] font-extrabold" style={{ ...HL, color: DARK, fontWeight: 800 }}>
                  {step.label}
                </p>
                <p className="text-[14px] leading-[1.55]" style={{ color: BODY }}>{step.desc}</p>
              </div>
            </div>
            {i < ts.pipelineSteps.length - 1 && (
              <div className="ml-[18px] h-4 w-px" style={{ background: STONE }} />
            )}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

// ─── Output Stage — system result ─────────────────────────────────────────────

function ProductionStage() {
  const os = useOsCopy();

  const hues = ["#1a1830", "#101a14", "#1a1010", "#141410"];

  return (
    <section className="pb-2">
      <div
        className="mb-6 rounded-sm border px-5 py-5 md:mb-8 md:px-8 md:py-6"
        style={{
          background: `linear-gradient(135deg, ${STONE2} 0%, rgba(221,212,196,0.55) 100%)`,
          borderColor: "rgba(8,8,8,0.08)",
        }}
      >
        <p className="mb-1 font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: META }}>
          Output Stage
        </p>
        <h2
          className="text-[1.5rem] font-extrabold md:text-[2rem]"
          style={{ ...HL, color: DARK, letterSpacing: "-0.03em", fontWeight: 800 }}
        >
          {os.outputHeadline}
        </h2>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {os.outputs.map((out, i) => (
          <div
            key={out.name}
            className="relative min-w-0 overflow-hidden rounded-sm"
            style={{
              background: hues[i] ?? "#0a0a10",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 8px 32px rgba(8,8,8,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
              minHeight: "132px",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{ background: `radial-gradient(ellipse 80% 70% at 30% 20%, ${ACCENT}22, transparent)` }}
            />
            <div className="relative flex h-full flex-col justify-between p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-neutral-300 md:text-[12px]">
                  {out.name}
                </p>
                <span
                  className="shrink-0 rounded-sm px-2 py-0.5 font-mono text-[9px] tracking-[0.08em] uppercase"
                  style={{
                    background: out.status.includes("Arbeit") || out.status === "Preparing"
                      ? "rgba(180,255,0,0.12)"
                      : "rgba(255,255,255,0.06)",
                    color: out.status.includes("Arbeit") || out.status === "Preparing"
                      ? ACCENT
                      : "rgba(255,255,255,0.45)",
                  }}
                >
                  {out.status}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-500">
                  {out.format}
                </span>
                <span className="h-px flex-1 max-w-[40%]" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Studio Home ──────────────────────────────────────────────────────────────

export function PreviewStudioHome({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  const { t } = useLang();
  const ts = t.studio;

  return (
    <div className="min-w-0">
      <section className="mb-12 md:mb-20">
        <div
          className="grid min-w-0 grid-cols-1 items-stretch gap-0 md:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)] md:gap-8 lg:gap-10 xl:gap-12"
        >
          <div className="min-w-0 flex flex-col">
            <p
              className="mb-3 font-mono text-[11px] tracking-[0.18em] uppercase md:mb-4"
              style={{ color: META }}
            >
              {ts.overline}
            </p>
            <h1
              className="mb-4 text-[1.875rem] font-extrabold leading-[1.02] sm:text-[2.125rem] md:text-6xl lg:text-7xl xl:text-8xl"
              style={{
                ...HL,
                color: DARK,
                WebkitTextFillColor: DARK,
                letterSpacing: "-0.035em",
                fontWeight: 800,
              }}
            >
              {ts.headline.split("\n").map((line, i) => (
                <span key={i} className="block" style={{ color: DARK }}>
                  {line}
                </span>
              ))}
            </h1>
            <p
              className="max-w-2xl text-[16px] leading-[1.65] md:text-[19px] md:leading-[1.7]"
              style={{ color: SUBLINE }}
            >
              {ts.subline}
            </p>

            <div className="mt-5 min-w-0 md:mt-7">
              <PreviewAgentCommand
                onNavigate={onNavigate}
                compact
                embedded
                showEnterHint
                elevated
              />
              <ProductionPathBar />
            </div>
          </div>

          <div className="relative hidden min-w-0 md:flex md:flex-col md:justify-stretch">
            <HeroMonitor integrated tall />
          </div>
        </div>

        <div className="mt-5 min-w-0 md:hidden">
          <HeroMonitor integrated />
        </div>
      </section>

      <ProductionPipeline />
      <ProductionStage />
    </div>
  );
}

// ─── Agent View ───────────────────────────────────────────────────────────────

export function PreviewAgentView({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  const { t } = useLang();
  const ta = t.agent;

  return (
    <div className="min-w-0">
      <PreviewAgentCommand onNavigate={onNavigate} elevated />
      <ProductionPathBar />

      <div className="mt-14 border-t pt-14 md:mt-16" style={{ borderColor: "rgba(8,8,8,0.08)" }}>
        <p className="mb-8 font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: META }}>
          {ta.workflowLabel}
        </p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {ta.workflowSteps.map(({ step, title, desc }) => (
            <div
              key={step}
              className="rounded-sm p-7 md:p-8"
              style={{ background: STONE, border: "1px solid rgba(8,8,8,0.06)" }}
            >
              <p className="mb-4 font-mono text-[11px] tracking-[0.14em] uppercase" style={{ color: META }}>
                {step}
              </p>
              <p className="mb-2 text-[17px] font-extrabold" style={{ ...HL, color: DARK, fontWeight: 800 }}>{title}</p>
              <p className="text-[14px] leading-[1.65]" style={{ color: BODY }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 md:mt-16">
        <ProductionStage />
      </div>
    </div>
  );
}

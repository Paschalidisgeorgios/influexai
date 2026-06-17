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
const STONE  = "rgba(221,212,196,0.55)";
const LIGHT_CARD = "rgba(221,212,196,0.28)";
const LIGHT_CARD_ALT = "rgba(0,0,0,0.035)";
const LIGHT_BORDER = "rgba(8,8,8,0.07)";
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
        className="hidden min-w-0 items-center gap-0 rounded-sm px-3 py-2 md:flex"
        style={{
          maxHeight: "72px",
          background: LIGHT_CARD,
          border: `1px solid ${LIGHT_BORDER}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
        }}
      >
        {os.pathSteps.map((label, i) => (
          <Fragment key={label}>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  background: i === ACTIVE_PATH_STEP ? ACCENT : i < ACTIVE_PATH_STEP ? "rgba(8,8,8,0.25)" : STONE,
                  boxShadow: i === ACTIVE_PATH_STEP ? `0 0 4px ${ACCENT}44` : "none",
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
        style={{
          background: LIGHT_CARD,
          border: `1px solid ${LIGHT_BORDER}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.30)",
        }}
      >
        {os.pathSteps.map((label, i) => (
          <div key={label} className="flex min-w-0 items-center gap-2">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                background: i === ACTIVE_PATH_STEP ? ACCENT : STONE,
                boxShadow: i === ACTIVE_PATH_STEP ? `0 0 4px ${ACCENT}44` : "none",
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
      className={`relative flex w-full min-w-0 flex-col overflow-hidden rounded-sm ${tall ? "h-full min-h-[460px] lg:min-h-[500px]" : "min-h-[200px] md:min-h-[280px]"}`}
      style={{
        background: "rgba(10,10,16,0.92)",
        border: integrated
          ? `1px solid ${LIGHT_BORDER}`
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: integrated
          ? "0 16px 48px rgba(8,8,8,0.16), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 16px 48px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {integrated && (
        <div
          className="pointer-events-none absolute -left-6 top-[38%] hidden h-px w-6 md:block lg:-left-8 lg:w-8"
          style={{ background: `linear-gradient(90deg, ${ACCENT}33, transparent)` }}
        />
      )}

      <div
        className="absolute left-0 top-0 h-[1px] w-full"
        style={{ background: `linear-gradient(90deg, ${ACCENT}88 0%, ${ACCENT}33 45%, transparent 80%)` }}
      />

      {/* Route status — compact, linked to agent */}
      <div
        className="border-b px-3 py-2 md:px-4 md:py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.22)" }}
      >
        <div className="mb-1.5 flex items-center gap-2 md:mb-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: ACCENT, boxShadow: `0 0 4px ${ACCENT}55` }}
          />
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-300 md:text-[11px]">
            {os.routeActive}
          </span>
        </div>
        <div className="flex flex-col gap-1 md:flex-row md:flex-wrap md:gap-x-4 md:gap-y-1">
          {os.routePoints.map((point, i) => (
            <div key={point} className="flex min-w-0 items-center gap-1.5">
              <span
                className="font-mono text-[9px] uppercase tracking-wider"
                style={{ color: i < 2 ? ACCENT : "rgba(255,255,255,0.30)" }}
              >
                {i < 2 ? "✓" : "○"}
              </span>
              <span
                className="truncate font-mono text-[10px] tracking-[0.06em]"
                style={{ color: i < 2 ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.38)" }}
              >
                {point}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b px-3 py-2 md:px-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <span className="h-1.5 w-1.5 rounded-full bg-white/18" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
        <span className="ml-1 font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-500">
          {os.monitorOutput}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col justify-end p-4 md:p-5 lg:p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{ background: "radial-gradient(ellipse 85% 65% at 58% 28%, rgba(100,80,255,0.28), transparent)" }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative">
          <p className="mb-1.5 font-mono text-[10px] tracking-[0.14em] uppercase text-neutral-500">
            {ts.mediaPrimaryTitle}
          </p>
          <h3 className="mb-1.5 text-lg font-extrabold text-neutral-100 md:text-xl lg:text-[1.375rem]" style={{ ...HL, fontWeight: 800 }}>
            {ts.mediaOutputs[0]?.label ?? "Campaign Visual"}
          </h3>
          <p className="max-w-sm text-[12px] leading-[1.55] text-neutral-400 md:text-[13px]">
            {ts.mediaPrimaryDesc}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
        {ts.mediaOutputs.map((out) => (
          <div key={out.label} className="px-2.5 py-2.5 md:px-3 md:py-3" style={{ background: "rgba(14,14,22,0.95)" }}>
            <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-neutral-500">{out.type}</p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-neutral-100 md:text-[12px]">{out.label}</p>
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
                boxShadow: i === 1 ? `0 0 8px ${ACCENT}55` : "none",
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
        className="mb-6 rounded-sm border px-5 py-4 md:mb-8 md:px-7 md:py-5"
        style={{
          background: LIGHT_CARD,
          borderColor: LIGHT_BORDER,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.38)",
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
              background: hues[i] ?? "rgba(10,10,16,0.92)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 6px 24px rgba(8,8,8,0.10), inset 0 1px 0 rgba(255,255,255,0.04)",
              minHeight: "128px",
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

  const cockpitCards = [
    { title: ts.pipelineSteps[0].label, desc: ts.pipelineSteps[0].desc },
    { title: ts.pipelineSteps[1].label, desc: ts.pipelineSteps[1].desc },
    { title: ts.pipelineSteps[2].label, desc: ts.pipelineSteps[2].desc },
    { title: ts.pipelineSteps[3].label, desc: ts.pipelineSteps[3].desc },
  ];

  return (
    <div className="min-w-0">
      <section className="mb-10 md:mb-14">
        <p className="mb-3 font-mono text-[11px] tracking-[0.18em] uppercase md:mb-4" style={{ color: META }}>
          {ts.overline}
        </p>
        <h1
          className="mb-4 text-[1.875rem] font-extrabold leading-[1.08] sm:text-[2.125rem] md:text-5xl"
          style={{ ...HL, color: DARK, letterSpacing: "-0.03em", fontWeight: 800 }}
        >
          {ts.headline}
        </h1>
        <p className="max-w-2xl text-[16px] leading-[1.65] md:text-[18px]" style={{ color: SUBLINE }}>
          {ts.subline}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cockpitCards.map((card) => (
            <div
              key={card.title}
              className="rounded-sm p-5"
              style={{
                background: LIGHT_CARD,
                border: `1px solid ${LIGHT_BORDER}`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.32)",
              }}
            >
              <p className="mb-1 text-[14px] font-bold" style={{ ...HL, color: DARK }}>{card.title}</p>
              <p className="text-[13px] leading-relaxed" style={{ color: BODY }}>{card.desc}</p>
            </div>
          ))}
        </div>

        <div
          className="mt-8 flex flex-col gap-4 rounded-sm border p-5 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: LIGHT_CARD, borderColor: LIGHT_BORDER }}
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: META }}>
              Weiterarbeiten
            </p>
            <p className="mt-1 text-[14px] font-semibold" style={{ color: DARK }}>{ts.continueHint}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("studio")}
            className="rounded-sm px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider"
            style={{ background: ACCENT, color: DARK }}
          >
            {ts.continueCta}
          </button>
        </div>
      </section>

      <section className="pb-6">
        <p className="mb-4 font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: META }}>
          {ts.mediaLabel}
        </p>
        <HeroMonitor integrated />
      </section>
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
              className="rounded-sm p-6 md:p-7"
              style={{
                background: LIGHT_CARD,
                border: `1px solid ${LIGHT_BORDER}`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.32)",
              }}
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

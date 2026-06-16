"use client";

/**
 * PreviewStudioHome + PreviewAgentView — High-contrast editorial composition.
 * ALL DATA IS MOCK. Isolated to /dashboard/design-preview.
 */

import { Fragment } from "react";
import { useLang, type PreviewView } from "./PreviewLang";
import { PreviewAgentCommand } from "./PreviewAgentCommand";

const ACCENT = "#b4ff00";
const DARK   = "#080808";
const STONE  = "#DDD4C4";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── Hero Production Monitor (right column) ───────────────────────────────────

function HeroMonitor() {
  const { t } = useLang();
  const ts = t.studio;

  return (
    <div
      className="relative flex min-h-[280px] flex-col overflow-hidden md:min-h-[360px]"
      style={{
        background: "#0a0a10",
        border: "1px solid rgba(8,8,8,0.12)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Lime system line */}
      <div className="absolute left-0 top-0 h-[2px] w-full" style={{
        background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT}88 30%, transparent 70%)`,
      }} />

      {/* Monitor chrome */}
      <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/12" />
        <span className="h-2 w-2 rounded-full bg-white/08" />
        <span className="ml-2 font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-500">
          {ts.mediaPrimaryTag}
        </span>
      </div>

      {/* Main viewport */}
      <div className="relative flex flex-1 flex-col justify-end p-6 md:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 60% 30%, rgba(100,80,255,0.35), transparent)",
          }}
        />
        <div className="relative">
          <p className="mb-2 font-mono text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
            Live Preview · {t.mock}
          </p>
          <h3 className="mb-2 text-2xl font-extrabold text-white md:text-3xl" style={HL}>
            {ts.mediaPrimaryTitle}
          </h3>
          <p className="max-w-xs text-[13px] leading-[1.6] text-neutral-400">
            {ts.mediaPrimaryDesc}
          </p>
        </div>
      </div>

      {/* Output strip */}
      <div className="grid grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
        {ts.mediaOutputs.map((out) => (
          <div key={out.label} className="px-3 py-3" style={{ background: "#0e0e16" }}>
            <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-neutral-500">{out.type}</p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-neutral-200">{out.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Production Pipeline — system line ────────────────────────────────────────

function ProductionPipeline() {
  const { t } = useLang();
  const ts = t.studio;

  return (
    <section className="pb-14 md:pb-16">
      <p
        className="mb-8 font-mono text-[12px] tracking-[0.1em] uppercase"
        style={{ color: "rgba(8,8,8,0.45)" }}
      >
        {ts.pipelineLabel}
      </p>

      {/* Desktop: connected timeline */}
      <div className="hidden md:block">
        <div className="relative mb-6 h-[2px]" style={{ background: STONE }}>
          <div
            className="absolute left-0 top-0 h-full w-2/5"
            style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}66, transparent)` }}
          />
        </div>
        <div className="grid grid-cols-6 gap-6">
          {ts.pipelineSteps.map((step, i) => (
            <div key={step.num} className="relative">
              <p
                className="mb-2 font-mono text-[11px] tracking-[0.1em] uppercase"
                style={{ color: i === 0 ? ACCENT : "rgba(8,8,8,0.35)" }}
              >
                {step.num}
              </p>
              <p className="mb-1 text-[15px] font-bold" style={{ ...HL, color: DARK }}>
                {step.label}
              </p>
              <p className="text-[12px] leading-[1.5]" style={{ color: "rgba(8,8,8,0.50)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: vertical flow */}
      <div className="flex flex-col gap-0 md:hidden">
        {ts.pipelineSteps.map((step, i) => (
          <Fragment key={step.num}>
            <div className="flex gap-4 py-4">
              <p className="shrink-0 font-mono text-[11px] tracking-[0.1em] uppercase" style={{ color: i === 0 ? ACCENT : "rgba(8,8,8,0.35)" }}>
                {step.num}
              </p>
              <div>
                <p className="text-[15px] font-bold" style={{ ...HL, color: DARK }}>{step.label}</p>
                <p className="text-[12px]" style={{ color: "rgba(8,8,8,0.50)" }}>{step.desc}</p>
              </div>
            </div>
            {i < ts.pipelineSteps.length - 1 && (
              <div className="ml-3 h-4 w-px" style={{ background: STONE }} />
            )}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

// ─── Production Stage — campaign pack monitor ──────────────────────────────────

function ProductionStage() {
  const { t } = useLang();
  const ts = t.studio;

  const slots = [
    { label: ts.mediaOutputs[0]?.label ?? "Visual",  ratio: "4/5",  tone: "#141420" },
    { label: ts.mediaOutputs[1]?.label ?? "Video",   ratio: "9/16", tone: "#101814" },
    { label: ts.mediaOutputs[2]?.label ?? "Hooks",   ratio: "1/1",  tone: "#181010" },
  ];

  return (
    <section className="pb-4">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 font-mono text-[12px] tracking-[0.1em] uppercase" style={{ color: "rgba(8,8,8,0.45)" }}>
            {ts.mediaLabel}
          </p>
          <h2 className="text-2xl font-extrabold md:text-3xl" style={{ ...HL, color: DARK, letterSpacing: "-0.03em" }}>
            {ts.mediaHeadline}
          </h2>
        </div>
        <p className="max-w-sm text-[14px] leading-[1.6]" style={{ color: "rgba(8,8,8,0.55)" }}>
          {ts.mediaSubline}
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
        {/* Main frame */}
        <div
          className="relative min-h-[300px] overflow-hidden lg:min-h-0 lg:flex-[5]"
          style={{
            aspectRatio: "16/10",
            background: "#0a0a10",
            border: "1px solid rgba(8,8,8,0.15)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
          }}
        >
          <div className="absolute left-0 top-0 h-[2px] w-full" style={{
            background: `linear-gradient(90deg, ${ACCENT}, transparent 60%)`,
          }} />
          <div className="absolute inset-0 opacity-50" style={{
            background: "radial-gradient(ellipse 70% 60% at 25% 40%, rgba(70,50,210,0.30), transparent)",
          }} />
          <div className="relative flex h-full flex-col justify-between p-7 md:p-9">
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-neutral-500">
              Campaign Pack · {t.mock}
            </p>
            <div>
              <h3 className="mb-2 text-2xl font-extrabold text-white md:text-4xl" style={HL}>
                {ts.mediaPrimaryTitle}
              </h3>
              <p className="max-w-md text-[14px] leading-[1.6] text-neutral-400">
                {ts.mediaExportLine}
              </p>
            </div>
          </div>
        </div>

        {/* Output slots */}
        <div className="grid grid-cols-3 gap-3 lg:flex lg:flex-1 lg:flex-col lg:gap-4">
          {slots.map(({ label, ratio, tone }) => (
            <div
              key={label}
              className="relative overflow-hidden"
              style={{
                aspectRatio: ratio,
                background: tone,
                border: "1px solid rgba(8,8,8,0.12)",
                minHeight: "100px",
              }}
            >
              <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}>
                <p className="truncate text-[12px] font-medium text-white">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export strip */}
      <div
        className="mt-5 flex flex-wrap items-center justify-between gap-4 border px-6 py-5 md:px-8"
        style={{ background: STONE, borderColor: "rgba(8,8,8,0.08)" }}
      >
        <p className="text-[14px] font-bold" style={{ ...HL, color: DARK }}>
          {ts.mediaExportLine}
        </p>
        <div className="flex flex-wrap gap-2">
          {["PNG", "MP4", "TXT", "PDF"].map((fmt) => (
            <span
              key={fmt}
              className="px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase"
              style={{ background: "rgba(8,8,8,0.08)", color: "rgba(8,8,8,0.55)" }}
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Studio Home ──────────────────────────────────────────────────────────────

export function PreviewStudioHome({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  const { t } = useLang();
  const ts = t.studio;

  return (
    <div>

      {/* A) Hero System Section — split */}
      <section className="mb-12 grid grid-cols-1 gap-10 md:mb-16 md:grid-cols-2 md:gap-12 lg:gap-16">
        <div className="flex flex-col justify-center">
          <p
            className="mb-5 font-mono text-[12px] tracking-[0.1em] uppercase"
            style={{ color: "rgba(8,8,8,0.45)" }}
          >
            {ts.overline}
          </p>
          <h1
            className="mb-5 text-4xl font-extrabold leading-[1.04] md:text-6xl lg:text-7xl"
            style={{ ...HL, color: DARK, letterSpacing: "-0.03em" }}
          >
            {ts.headline.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < ts.headline.split("\n").length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="max-w-md text-[16px] leading-[1.65]" style={{ color: "rgba(8,8,8,0.60)" }}>
            {ts.subline}
          </p>
        </div>
        <HeroMonitor />
      </section>

      {/* B) Agent Command Center */}
      <section className="mb-14 md:mb-16">
        <p
          className="mb-5 font-mono text-[12px] tracking-[0.1em] uppercase"
          style={{ color: "rgba(8,8,8,0.45)" }}
        >
          {t.agent.overline}
        </p>
        <PreviewAgentCommand onNavigate={onNavigate} compact showEnterHint elevated />
      </section>

      {/* C) Production Pipeline */}
      <ProductionPipeline />

      {/* D) Production Stage */}
      <ProductionStage />
    </div>
  );
}

// ─── Agent View ───────────────────────────────────────────────────────────────

export function PreviewAgentView({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  const { t } = useLang();
  const ta = t.agent;

  return (
    <div>
      <PreviewAgentCommand onNavigate={onNavigate} elevated />

      <div className="mt-14 border-t pt-14 md:mt-16" style={{ borderColor: "rgba(8,8,8,0.08)" }}>
        <p className="mb-6 font-mono text-[12px] tracking-[0.1em] uppercase" style={{ color: "rgba(8,8,8,0.45)" }}>
          {ta.workflowLabel}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ta.workflowSteps.map(({ step, title, desc }) => (
            <div
              key={step}
              className="p-6"
              style={{ background: STONE, border: "1px solid rgba(8,8,8,0.06)" }}
            >
              <p className="mb-3 font-mono text-[11px] tracking-[0.1em] uppercase" style={{ color: "rgba(8,8,8,0.40)" }}>
                {step}
              </p>
              <p className="mb-2 text-[16px] font-bold" style={{ ...HL, color: DARK }}>{title}</p>
              <p className="text-[13px] leading-[1.6]" style={{ color: "rgba(8,8,8,0.55)" }}>{desc}</p>
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

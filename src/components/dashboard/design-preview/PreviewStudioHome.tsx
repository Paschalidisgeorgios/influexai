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
const SUBLINE = "rgba(8,8,8,0.72)";
const BODY   = "rgba(8,8,8,0.68)";
const META   = "rgba(8,8,8,0.45)";
const STONE  = "#DDD4C4";
const STONE2 = "#E8E0D4";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── Hero Production Monitor (right column) ───────────────────────────────────

function HeroMonitor({ integrated = false }: { integrated?: boolean }) {
  const { t } = useLang();
  const ts = t.studio;

  return (
    <div
      className="relative flex min-h-[280px] w-full min-w-0 flex-col overflow-hidden md:min-h-[400px] lg:min-h-[440px]"
      style={{
        background: "#0a0a10",
        border: integrated
          ? "1px solid rgba(8,8,8,0.18)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: integrated
          ? "0 20px 56px rgba(8,8,8,0.22), 0 0 0 1px rgba(8,8,8,0.06), inset 0 1px 0 rgba(255,255,255,0.07)"
          : "0 24px 64px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="absolute left-0 top-0 h-[2px] w-full"
        style={{ background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT}66 35%, transparent 75%)` }}
      />

      <div className="flex items-center gap-2 border-b px-5 py-3.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/14" />
        <span className="h-2 w-2 rounded-full bg-white/08" />
        <span className="ml-2 font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-500">
          Production Output
        </span>
      </div>

      <div className="relative flex flex-1 flex-col justify-end p-7 md:p-9">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ background: "radial-gradient(ellipse 85% 65% at 58% 28%, rgba(100,80,255,0.38), transparent)" }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative">
          <p className="mb-3 font-mono text-[10px] tracking-[0.14em] uppercase text-neutral-500">
            {ts.mediaPrimaryTag}
          </p>
          <h3 className="mb-3 text-2xl font-extrabold text-neutral-100 md:text-[2rem]" style={{ ...HL, fontWeight: 800 }}>
            {ts.mediaPrimaryTitle}
          </h3>
          <p className="max-w-sm text-[14px] leading-[1.65] text-neutral-300">
            {ts.mediaPrimaryDesc}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.07)" }}>
        {ts.mediaOutputs.map((out) => (
          <div key={out.label} className="px-4 py-4" style={{ background: "#0e0e16" }}>
            <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-neutral-500">{out.type}</p>
            <p className="mt-1 truncate text-[12px] font-semibold text-neutral-100">{out.label}</p>
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
    <section className="pb-16 md:pb-20">
      <p className="mb-10 font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: META }}>
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
                background: i === 0 ? ACCENT : STONE,
                boxShadow: i === 0 ? `0 0 12px ${ACCENT}88` : "none",
              }}
            />
          ))}
        </div>

        <div className="grid grid-cols-6 gap-8 lg:gap-10">
          {ts.pipelineSteps.map((step, i) => (
            <div key={step.num}>
              <p
                className="mb-3 font-mono text-[11px] tracking-[0.14em] uppercase"
                style={{ color: i === 0 ? ACCENT : META }}
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
            <div className="flex gap-5 py-5">
              <p
                className="shrink-0 pt-0.5 font-mono text-[11px] tracking-[0.14em] uppercase"
                style={{ color: i === 0 ? ACCENT : META }}
              >
                {step.num}
              </p>
              <div>
                <p className="mb-1.5 text-[17px] font-extrabold" style={{ ...HL, color: DARK, fontWeight: 800 }}>
                  {step.label}
                </p>
                <p className="text-[14px] leading-[1.55]" style={{ color: BODY }}>{step.desc}</p>
              </div>
            </div>
            {i < ts.pipelineSteps.length - 1 && (
              <div className="ml-[18px] h-5 w-px" style={{ background: STONE }} />
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
    { type: ts.mediaOutputs[0]?.type ?? "Bild",  label: ts.mediaOutputs[0]?.label ?? "Visual", ratio: "4/5",  hue: "#1a1830", glow: "rgba(100,80,255,0.28)" },
    { type: ts.mediaOutputs[1]?.type ?? "Video", label: ts.mediaOutputs[1]?.label ?? "Video",  ratio: "9/16", hue: "#101a14", glow: "rgba(80,200,120,0.22)" },
    { type: ts.mediaOutputs[2]?.type ?? "Hook",  label: ts.mediaOutputs[2]?.label ?? "Hooks",  ratio: "1/1",  hue: "#1a1010", glow: "rgba(255,90,70,0.18)" },
  ];

  return (
    <section className="pb-2">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-8">
        <div>
          <p className="mb-3 font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: META }}>
            {ts.mediaLabel}
          </p>
          <h2
            className="text-[1.75rem] font-extrabold md:text-4xl"
            style={{ ...HL, color: DARK, letterSpacing: "-0.03em", fontWeight: 800 }}
          >
            {ts.mediaHeadline}
          </h2>
        </div>
        <p className="max-w-md text-[15px] leading-[1.65] md:text-right" style={{ color: BODY }}>
          {ts.mediaSubline}
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
        {/* Main monitor frame */}
        <div
          className="relative min-h-[340px] overflow-hidden lg:min-h-[420px] lg:flex-[6]"
          style={{
            aspectRatio: "16/10",
            background: "#0a0a10",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 28px 72px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="absolute left-0 top-0 h-[2px] w-full"
            style={{ background: `linear-gradient(90deg, ${ACCENT}, transparent 55%)` }}
          />
          <div
            className="absolute inset-0 opacity-55"
            style={{ background: "radial-gradient(ellipse 75% 65% at 22% 38%, rgba(70,50,210,0.32), transparent)" }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.20]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)," +
                "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative flex h-full flex-col justify-between p-8 md:p-10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/12" />
              <span className="h-2 w-2 rounded-full bg-white/08" />
              <span className="ml-2 font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-500">
                Campaign Pack
              </span>
            </div>
            <div>
              <h3 className="mb-3 text-3xl font-extrabold text-neutral-100 md:text-[2.75rem]" style={{ ...HL, fontWeight: 800, letterSpacing: "-0.02em" }}>
                {ts.mediaPrimaryTitle}
              </h3>
              <p className="max-w-lg text-[15px] leading-[1.65] text-neutral-300">
                {ts.mediaExportLine}
              </p>
            </div>
          </div>
        </div>

        {/* Output slots — studio monitors */}
        <div className="grid grid-cols-3 gap-3 lg:flex lg:flex-[4] lg:flex-col lg:gap-4">
          {slots.map(({ type, label, ratio, hue, glow }) => (
            <div
              key={label}
              className="relative overflow-hidden"
              style={{
                aspectRatio: ratio,
                background: hue,
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                minHeight: "120px",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(ellipse 80% 70% at 50% 30%, ${glow}, transparent)` }}
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.18]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)," +
                    "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <div className="absolute left-3 top-3">
                <span className="font-mono text-[8px] tracking-[0.14em] uppercase text-neutral-500">{type}</span>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 px-4 py-3"
                style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.82))" }}
              >
                <p className="truncate text-[13px] font-semibold text-neutral-100">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-sm px-7 py-6 md:px-9"
        style={{ background: STONE2, border: "1px solid rgba(8,8,8,0.07)" }}
      >
        <p className="text-[15px] font-bold" style={{ ...HL, color: DARK, fontWeight: 700 }}>
          {ts.mediaExportLine}
        </p>
        <div className="flex flex-wrap gap-2">
          {["PNG", "MP4", "TXT", "PDF"].map((fmt) => (
            <span
              key={fmt}
              className="rounded-sm px-3.5 py-2 font-mono text-[10px] tracking-[0.12em] uppercase"
              style={{ background: "rgba(8,8,8,0.07)", color: BODY }}
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
    <div className="min-w-0">
      {/* A) Hero + Agent — mobile: headline → agent → monitor */}
      <section className="mb-12 md:mb-16">
        <div className="grid min-w-0 grid-cols-1 items-start md:grid-cols-2 md:gap-8 lg:gap-10">
          <div className="min-w-0 flex flex-col justify-start">
            <p
              className="mb-3 font-mono text-[11px] tracking-[0.16em] uppercase"
              style={{ color: META }}
            >
              {ts.overline}
            </p>
            <h1
              className="mb-4 text-[1.875rem] font-extrabold leading-[1.05] sm:text-[2.25rem] md:text-[3.5rem] lg:text-[4.25rem]"
              style={{
                ...HL,
                color: DARK,
                WebkitTextFillColor: DARK,
                letterSpacing: "-0.03em",
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
              className="max-w-lg text-[15px] leading-[1.65] md:text-[17px]"
              style={{ color: SUBLINE }}
            >
              {ts.subline}
            </p>
          </div>

          <div className="hidden min-w-0 md:block md:-mt-1">
            <HeroMonitor integrated />
          </div>
        </div>

        <div className="mt-8 min-w-0 md:mt-10">
          <p className="mb-4 font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: META }}>
            {t.agent.overline}
          </p>
          <PreviewAgentCommand onNavigate={onNavigate} compact showEnterHint elevated />
        </div>

        <div className="mt-8 min-w-0 md:hidden">
          <HeroMonitor integrated />
        </div>
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

      <div className="mt-16 border-t pt-16 md:mt-20" style={{ borderColor: "rgba(8,8,8,0.08)" }}>
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

      <div className="mt-16 md:mt-20">
        <ProductionStage />
      </div>
    </div>
  );
}

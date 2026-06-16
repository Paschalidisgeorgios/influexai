"use client";

/**
 * PreviewStudioHome — Studio view: OS headline + Agent + Production Pipeline + Tool strip.
 *
 * ALL DATA IS MOCK. No API calls, no credits, no assets.
 * Isolated to /dashboard/design-preview.
 */

import { Fragment } from "react";
import { useLang, type PreviewView } from "./PreviewLang";
import { PreviewAgentCommand } from "./PreviewAgentCommand";

// ─── Design tokens ────────────────────────────────────────────────────────────

const ACCENT = "#b4ff00";
const IVORY  = "#F4F0E8";
const STONE  = "#DDD4C4";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── Gradient panel helper ────────────────────────────────────────────────────

function GPanel({
  children, base, glow, glowPos = "30% 40%", gr = "300px", grid = false, className = "",
}: {
  children:  React.ReactNode;
  base:      string;
  glow:      string;
  glowPos?:  string;
  gr?:       string;
  grid?:     boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden border border-white/[0.05] ${className}`}>
      <div className="absolute inset-0" style={{ background: base }} />
      <div className="pointer-events-none absolute inset-0" style={{
        background: `radial-gradient(ellipse ${gr} ${gr} at ${glowPos}, ${glow}, transparent)`,
      }} />
      {grid && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.35]" style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }} />
      )}
      <div className="relative h-full">{children}</div>
    </div>
  );
}

// ─── Production Pipeline ──────────────────────────────────────────────────────

function ProductionPipeline({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  const { t } = useLang();
  const ts = t.studio;

  return (
    <section className="pb-20">
      {/* Pipeline label */}
      <p className="mb-8 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
        {ts.pipelineLabel}
      </p>

      {/* Steps — horizontal on desktop, stacked on mobile */}
      <div className="flex flex-col gap-0 md:flex-row">
        {ts.pipelineSteps.map((step, i) => (
          <Fragment key={step.num}>
            <div className="flex flex-1 flex-col border border-white/[0.05] bg-[#0c0c10] p-5 transition-colors hover:border-white/[0.10] hover:bg-[#0e0e14] md:p-6">
              <p className="mb-3 font-mono text-[10px] tracking-[0.22em] text-neutral-700">
                {step.num}
              </p>
              <p className="mb-1.5 text-[15px] font-semibold text-white" style={HL}>
                {step.label}
              </p>
              <p className="text-[12px] leading-[1.6] text-neutral-600">{step.desc}</p>
            </div>
            {/* Arrow connector on desktop */}
            {i < ts.pipelineSteps.length - 1 && (
              <div className="hidden items-center justify-center px-1 text-neutral-800 md:flex">
                →
              </div>
            )}
          </Fragment>
        ))}
      </div>

      {/* Production Areas — mixed dark/ivory bento */}
      <p className="mb-5 mt-12 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
        {ts.areasLabel}
      </p>
      <div className="flex flex-col gap-4 md:h-[420px] md:flex-row">

        {/* Ad Flow — dominant dark panel (MOCK) */}
        <GPanel
          base="linear-gradient(135deg, #090916 0%, #0a0a20 55%, #070710 100%)"
          glow="rgba(70,50,210,0.22)"
          glowPos="28% 45%"
          gr="400px"
          grid
          className="min-h-[280px] md:min-h-0 md:flex-[2]"
        >
          {/* Lime accent line */}
          <div className="absolute left-0 top-0 h-px w-24" style={{
            background: `linear-gradient(to right, ${ACCENT}55, transparent)`,
          }} />
          <div className="flex h-full flex-col justify-between p-7 md:p-9">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-700">
              Ad Flow · Campaign · Mock
            </p>
            <div>
              <h3 className="mb-2 text-2xl font-extrabold text-white md:text-3xl" style={HL}>
                Campaign Visual System
              </h3>
              <p className="max-w-xs text-[13px] leading-[1.6] text-neutral-500">
                Images, videos and copy — generated, reviewed, exported.
              </p>
            </div>
          </div>
        </GPanel>

        {/* Right column */}
        <div className="grid grid-cols-2 gap-4 md:flex md:flex-1 md:flex-col">

          {/* Avatar Video — warm IVORY panel (editorial contrast) */}
          {/* MOCK */}
          <div
            className="flex min-h-[140px] flex-col justify-between overflow-hidden border p-5 md:min-h-0 md:flex-1 md:p-6"
            style={{ background: IVORY, borderColor: "rgba(8,8,8,0.06)" }}
          >
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(8,8,8,0.35)" }}>
              Avatar Video · Mock
            </p>
            <div>
              <p className="text-[15px] font-extrabold" style={{ ...HL, color: "#080808" }}>
                Talking Avatars
              </p>
              <p className="mt-1 text-[12px]" style={{ color: "rgba(8,8,8,0.40)" }}>
                KI-Avatare in Sekunden
              </p>
            </div>
          </div>

          {/* AI Media Buyer — warm dark (MOCK) */}
          <GPanel
            base="linear-gradient(145deg, #110d06 0%, #0c0a04 100%)"
            glow="rgba(255,148,30,0.20)"
            glowPos="20% 80%"
            gr="180px"
            className="min-h-[140px] md:min-h-0 md:flex-1"
          >
            <div className="flex h-full flex-col justify-between p-5 md:p-6">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-700">
                AI Media Buyer · Mock
              </p>
              <p className="text-[15px] font-extrabold text-white" style={HL}>Paid Ads</p>
            </div>
          </GPanel>
        </div>
      </div>
    </section>
  );
}

// ─── Tool Category Strip ──────────────────────────────────────────────────────

const CATEGORY_IDS = ["foto", "video", "avatar", "text", "brand"] as const;
type CatId = typeof CATEGORY_IDS[number];
const CAT_COUNT: Record<CatId, number> = { foto: 5, video: 5, avatar: 4, text: 4, brand: 3 };

function ToolStrip({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  const { t } = useLang();
  const ts = t.studio;
  const tc = t.tools;

  return (
    <section className="pb-16">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
            {ts.toolsOverline}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-white" style={HL}>
            {tc.headline}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("tools")}
          className="font-mono text-[11px] tracking-widest uppercase text-neutral-600 transition-colors hover:text-white"
        >
          {ts.toolsCta}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {CATEGORY_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate("tools")}
            className="group flex flex-col gap-3 border border-white/[0.05] bg-[#0d0d10] p-5 text-left transition-all hover:border-white/[0.10] hover:bg-[#101015]"
          >
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-neutral-700">
              {tc.toolsCount.replace("{count}", String(CAT_COUNT[id]))}
            </p>
            <p className="text-[14px] font-semibold text-neutral-200 transition-colors group-hover:text-white" style={HL}>
              {tc.categories[id]}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── Recent Outputs ───────────────────────────────────────────────────────────

// MOCK — CSS gradient frames, no real images
const RECENT_MOCK = [
  { type: "IMAGE",    tool: "Image Generator", title: "Product Shot — Nike",     base: "linear-gradient(145deg,#0a0a18,#12122a)", glow: "rgba(100,80,255,0.26)", glowPos: "70% 25%", date: "vor 2h"   },
  { type: "VIDEO",    tool: "Image to Video",   title: "TikTok Ad — Fitness",     base: "linear-gradient(145deg,#081209,#0e1c0e)", glow: "rgba(120,225,40,0.22)", glowPos: "30% 65%", date: "vor 4h"   },
  { type: "HOOK",     tool: "Viral Hook",       title: "5 Hooks — Beauty Campaign",base:"linear-gradient(145deg,#160a0a,#200e0e)", glow: "rgba(255,70,70,0.20)",  glowPos: "70% 30%", date: "gestern" },
] as const;

function RecentOutputs({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  const { t } = useLang();
  const ts = t.studio;

  return (
    <section className="pb-24">
      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
          {ts.recentLabel}
        </p>
        <button
          type="button"
          onClick={() => onNavigate("gallery")}
          className="font-mono text-[11px] tracking-widest uppercase text-neutral-600 transition-colors hover:text-white"
        >
          {ts.recentCta}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {RECENT_MOCK.map(({ type, tool, title, base, glow, glowPos, date }) => (
          <div
            key={title}
            className="group relative cursor-pointer overflow-hidden border border-white/[0.04] transition-colors hover:border-white/[0.09]"
            style={{ aspectRatio: "16/9" }}
          >
            <div className="absolute inset-0" style={{ background: base }} />
            <div className="pointer-events-none absolute inset-0" style={{
              background: `radial-gradient(ellipse 200px 200px at ${glowPos}, ${glow}, transparent)`,
            }} />
            <div className="pointer-events-none absolute inset-0 opacity-30" style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)," +
                "linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }} />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="mb-0.5 font-mono text-[9px] uppercase tracking-widest text-neutral-600">
                {type} · {tool}
              </p>
              <div className="flex items-end justify-between gap-2">
                <p className="text-[13px] font-medium text-white">{title}</p>
                <p className="shrink-0 font-mono text-[9px] text-neutral-700">{date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Studio Home (exported) ───────────────────────────────────────────────────

export function PreviewStudioHome({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  const { t } = useLang();
  const ts = t.studio;

  return (
    <div className="pb-8 pt-12 md:pt-16">

      {/* ── OS Mission Headline ─────────────────────────────────────────── */}
      <section className="pb-14">
        <p className="mb-6 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
          {ts.overline}
        </p>
        <h1
          className="mb-5 max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-6xl"
          style={{ ...HL, letterSpacing: "-0.03em" }}
        >
          {ts.headline.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < ts.headline.split("\n").length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p className="max-w-xl text-[15px] leading-[1.6] text-neutral-400">{ts.subline}</p>
      </section>

      {/* ── Agent Command Center (compact — headline above handles context) */}
      <section className="pb-16">
        <p className="mb-5 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
          {t.agent.overline}
        </p>
        <PreviewAgentCommand onNavigate={onNavigate} compact />
      </section>

      {/* ── Production Pipeline + Stage ─────────────────────────────────── */}
      <ProductionPipeline onNavigate={onNavigate} />

      {/* ── Tool Strip ──────────────────────────────────────────────────── */}
      <ToolStrip onNavigate={onNavigate} />

      {/* ── Recent Outputs ──────────────────────────────────────────────── */}
      <RecentOutputs onNavigate={onNavigate} />
    </div>
  );
}

// ─── Agent View (exported) — full-screen focused command center ───────────────

export function PreviewAgentView({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  const { t } = useLang();
  const ta = t.agent;

  return (
    <div className="pb-24 pt-12 md:pt-16">
      <PreviewAgentCommand onNavigate={onNavigate} />

      {/* Workflow steps */}
      <div className="mt-16">
        <p className="mb-6 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
          {ta.workflowLabel}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ta.workflowSteps.map(({ step, title, desc }) => (
            <div key={step} className="border border-white/[0.05] bg-[#0c0c10] p-6">
              <p className="mb-4 font-mono text-[11px] tracking-[0.22em] text-neutral-700">{step}</p>
              <p className="mb-2 text-[15px] font-semibold text-white" style={HL}>{title}</p>
              <p className="text-[13px] leading-[1.6] text-neutral-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation strip */}
      <div className="mt-10 flex flex-wrap gap-3">
        {(["tools", "gallery", "settings"] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => onNavigate(view)}
            className="border border-white/[0.05] px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase text-neutral-600 transition-colors hover:border-white/[0.10] hover:text-white"
          >
            → {t.nav[view]}
          </button>
        ))}
      </div>
    </div>
  );
}

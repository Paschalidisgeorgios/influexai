"use client";

/**
 * DashboardViews — InfluexAI Editorial Production Studio · Design Preview v2
 *
 * Design direction: "Editorial Production Studio"
 * Aesthetic reference-point: luxury editorial/agency sites adapted for
 * a KI Creator Studio dashboard.  Not a copy — own visual language.
 *
 * ALL DATA IS MOCK.  No API calls, no credits, no asset writes.
 * These components live only inside /dashboard/design-preview.
 */

import { useState }           from "react";
import type { ReactNode }     from "react";

// ─── Shared type ──────────────────────────────────────────────────────────────

export type PreviewView = "studio" | "tools" | "workspace" | "gallery";

// ─── Design constants ─────────────────────────────────────────────────────────

const ACCENT = "#b4ff00";

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function MonoLabel({ text }: { text: string }) {
  return (
    <p className="mb-5 font-mono text-[10px] tracking-[0.3em] uppercase text-neutral-700">
      {text}
    </p>
  );
}

function SectionHead({ headline }: { headline: string }) {
  return (
    <h2
      className="mb-14 text-5xl font-bold leading-none tracking-tight text-white md:text-6xl"
      /* dangerouslySetInnerHTML so callers can embed <br /> via \n */
      dangerouslySetInnerHTML={{ __html: headline.replace("\n", "<br/>") }}
    />
  );
}

// ─── GradientPanel — abstract CSS stage, no external images ──────────────────

interface GradientPanelProps {
  children:     ReactNode;
  base:         string;   // CSS gradient string for background
  glow:         string;   // rgba(…) color for radial glow
  glowPos?:     string;   // e.g. "25% 40%"
  glowRadius?:  string;   // e.g. "320px"
  grid?:        boolean;
  accentLine?:  boolean;
  className?:   string;
}

function GradientPanel({
  children,
  base,
  glow,
  glowPos     = "25% 40%",
  glowRadius  = "300px",
  grid        = false,
  accentLine  = false,
  className   = "",
}: GradientPanelProps) {
  return (
    <div className={`relative overflow-hidden border border-white/[0.04] ${className}`}>
      {/* Base */}
      <div className="absolute inset-0" style={{ background: base }} />
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse ${glowRadius} ${glowRadius} at ${glowPos}, ${glow}, transparent)`,
        }}
      />
      {/* Fine grid — creates technical-studio depth */}
      {grid && (
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      )}
      {/* Lime hairline top-left accent */}
      {accentLine && (
        <div
          className="pointer-events-none absolute left-0 top-0 h-px w-28"
          style={{ background: `linear-gradient(to right, ${ACCENT}55, transparent)` }}
        />
      )}
      <div className="relative h-full">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// A) STUDIO VIEW  (default — Command Center + Production Stage)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Command Center ───────────────────────────────────────────────────────────

const QUICK_ACTIONS = ["Image", "Video", "Campaign", "Avatar", "Hook"] as const;

function CommandCenter({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  const [input, setInput] = useState("");

  return (
    <section className="pb-16 pt-14 md:pb-20 md:pt-20">
      <MonoLabel text="Agent Command Center" />

      {/* Hero headline — large editorial scale */}
      <h1 className="mb-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-[70px]">
        Create campaign-ready
        <br />
        assets from one idea.
      </h1>

      {/* Subline — one line, no more */}
      <p className="mb-12 max-w-lg text-[15px] leading-relaxed text-neutral-500">
        Describe your idea. InfluexAI turns it into images, videos,
        hooks and creator assets.
      </p>

      {/* Luxury Command Input — MOCK, no API call, no credits */}
      <div className="border border-white/[0.05] bg-[#0d0d0f]">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe a campaign, product, creator or visual idea..."
          rows={3}
          className="w-full resize-none bg-transparent px-7 py-6 text-[15px] text-white outline-none placeholder:text-neutral-800"
          style={{ lineHeight: "1.65" }}
        />

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.03] px-7 py-4">
          {/* Quick Actions — text links, mock navigation only */}
          <div className="flex flex-wrap gap-5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onNavigate("tools")}
                className="font-mono text-[11px] tracking-[0.2em] uppercase text-neutral-600 transition-colors hover:text-neutral-200"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Generate CTA */}
          <button
            type="button"
            className="shrink-0 px-6 py-2.5 font-mono text-[11px] tracking-[0.15em] uppercase transition-all"
            style={{
              background: input.trim() ? ACCENT : "transparent",
              color:      input.trim() ? "#000000" : "rgba(255,255,255,0.14)",
              border:     input.trim() ? "none" : "1px solid rgba(255,255,255,0.05)",
            }}
          >
            Generate
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Production Stage ─────────────────────────────────────────────────────────

function ProductionStage() {
  return (
    <section className="pb-24">
      <MonoLabel text="Production Stage" />
      <h2 className="mb-8 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
        Your work, in motion.
      </h2>

      {/* Bento: 2/3 + 1/3 on desktop, stacked on mobile */}
      <div className="flex flex-col gap-4 md:h-[520px] md:flex-row">

        {/* ── Ad Flow — dominant panel ──────────────────────────────────── */}
        {/* MOCK — abstract gradient, no external image */}
        <GradientPanel
          base="linear-gradient(135deg, #090916 0%, #0b0b20 60%, #07070e 100%)"
          glow="rgba(80,55,215,0.22)"
          glowPos="25% 45%"
          glowRadius="380px"
          grid
          accentLine
          className="min-h-[320px] md:min-h-0 md:flex-[2]"
        >
          <div className="flex h-full flex-col justify-between p-7 md:p-9">
            <div className="flex items-start justify-between">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-600">
                Ad Flow · Campaign
              </p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-800">
                Mock
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-2xl font-bold leading-tight text-white md:text-3xl">
                Campaign Visual System
              </h3>
              <p className="max-w-sm text-[13px] leading-relaxed text-neutral-500">
                AI-generated campaign assets — images, videos, copy — ready to run.
              </p>
              <div className="mt-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/[0.04]" />
                <p className="font-mono text-[10px] tracking-widest uppercase text-neutral-700">
                  Images · Videos · Copy
                </p>
              </div>
            </div>
          </div>
        </GradientPanel>

        {/* ── Right column: Avatar + Media Buyer ───────────────────────── */}
        <div className="grid grid-cols-2 gap-4 md:flex md:flex-1 md:flex-col">

          {/* Avatar Video */}
          {/* MOCK — abstract gradient, no external image */}
          <GradientPanel
            base="linear-gradient(145deg, #06100a 0%, #060d07 100%)"
            glow="rgba(140,235,20,0.20)"
            glowPos="75% 20%"
            glowRadius="200px"
            className="min-h-[160px] md:min-h-0 md:flex-1"
          >
            <div className="flex h-full flex-col justify-between p-5 md:p-6">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-600">
                Avatar Video
              </p>
              <div>
                <p className="text-[15px] font-semibold text-white">Talking Avatars</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-neutral-800">
                  Mock
                </p>
              </div>
            </div>
          </GradientPanel>

          {/* AI Media Buyer */}
          {/* MOCK — abstract gradient, no external image */}
          <GradientPanel
            base="linear-gradient(145deg, #120e07 0%, #0d0b05 100%)"
            glow="rgba(255,158,40,0.16)"
            glowPos="20% 80%"
            glowRadius="180px"
            className="min-h-[160px] md:min-h-0 md:flex-1"
          >
            <div className="flex h-full flex-col justify-between p-5 md:p-6">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-600">
                AI Media Buyer
              </p>
              <div>
                <p className="text-[15px] font-semibold text-white">Paid Ads</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-neutral-800">
                  Mock
                </p>
              </div>
            </div>
          </GradientPanel>

        </div>
      </div>
    </section>
  );
}

// ─── StudioView — exported default view ──────────────────────────────────────

export function StudioView({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  return (
    <>
      <CommandCenter onNavigate={onNavigate} />
      <ProductionStage />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// B) TOOL AREAS VIEW
// ═══════════════════════════════════════════════════════════════════════════════

const TOOL_AREAS = [
  {
    category: "Image",
    name:     "Image Studio",
    desc:     "Generate product shots, campaign visuals, and creative assets from text or reference.",
    output:   "PNG · JPG · WebP",
    credits:  "From 4 Credits",
  },
  {
    category: "Video",
    name:     "Video Studio",
    desc:     "Animate still images into smooth, cinematic video sequences with sound.",
    output:   "MP4 · MOV",
    credits:  "From 12 Credits",
  },
  {
    category: "Avatar",
    name:     "Avatar & Voice",
    desc:     "Create talking avatars with real-time voice synchronisation for any persona.",
    output:   "MP4",
    credits:  "From 20 Credits",
  },
  {
    category: "AI Agent",
    name:     "Campaign Agent",
    desc:     "Build full campaign systems — briefs, visuals, copy, ad formats — from one brief.",
    output:   "Multi-format pack",
    credits:  "From 8 Credits",
  },
  {
    category: "Brand",
    name:     "Brand Kit",
    desc:     "Manage your brand identity — colors, logos, tone-of-voice — in one place.",
    output:   "PDF · PNG · SVG",
    credits:  "From 2 Credits",
  },
  {
    category: "Library",
    name:     "Asset Gallery",
    desc:     "All your generated outputs, organized, searchable, and ready to export.",
    output:   "All formats",
    credits:  "Free",
  },
] as const;

export function ToolAreasView() {
  return (
    <div className="flex flex-col pb-24 pt-10 md:pt-16">
      <MonoLabel text="Production Areas" />
      <SectionHead headline={"Studio\nCapabilities."} />

      {/* Tool rows — full-width horizontal, no cards */}
      {TOOL_AREAS.map(({ category, name, desc, output, credits }) => (
        <div
          key={name}
          className="group flex cursor-pointer flex-col gap-4 border-b border-white/[0.04] py-9 transition-colors hover:bg-white/[0.01] md:flex-row md:items-start md:justify-between md:gap-0"
        >
          <div className="flex-1">
            <p className="mb-2 font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-700">
              {category}
            </p>
            <h3 className="mb-2 text-xl font-bold text-white">{name}</h3>
            <p className="max-w-md text-[14px] leading-relaxed text-neutral-500">{desc}</p>
          </div>

          <div className="shrink-0 md:ml-12 md:text-right">
            <p className="font-mono text-[11px] text-neutral-700">{output}</p>
            <p className="mt-0.5 font-mono text-[11px] text-neutral-700">{credits}</p>
            <span className="mt-4 block font-mono text-[11px] tracking-widest uppercase text-neutral-500 transition-colors group-hover:text-white">
              Open →
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// C) WORKSPACE VIEW — Viral Hook active tool example
// ═══════════════════════════════════════════════════════════════════════════════

export function WorkspaceView() {
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col pb-24 pt-10 md:pt-16">
      <MonoLabel text="Tool Workspace · Viral Hook" />
      <h2 className="mb-12 text-4xl font-bold leading-none tracking-tight text-white md:text-5xl">
        Viral Hook
        <br />
        Generator.
      </h2>

      <div className="flex flex-col gap-6 md:h-[520px] md:flex-row md:gap-8">

        {/* ── Command Panel ─────────────────────────────────────────────── */}
        {/* MOCK — no API call, no credit deduction */}
        <div className="flex w-full shrink-0 flex-col gap-7 border border-white/[0.05] bg-[#0d0d0f] p-7 md:w-[340px]">
          <div>
            <label className="mb-3 block font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-600">
              Product or Topic
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Fitness supplement, 25–40 male, benefit: fast recovery"
              rows={4}
              className="w-full resize-none border-b border-white/[0.05] bg-transparent py-2 text-[14px] text-white outline-none transition-colors placeholder:text-neutral-800 focus:border-white/[0.12]"
              style={{ lineHeight: "1.65" }}
            />
          </div>

          <div>
            <label className="mb-3 block font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-600">
              Hook Style
            </label>
            <select
              className="w-full border-b border-white/[0.05] bg-[#0d0d0f] py-2 text-[13px] text-neutral-500 outline-none"
              defaultValue=""
            >
              <option value="" disabled>Select style...</option>
              <option>Curiosity gap</option>
              <option>Bold claim</option>
              <option>Relatable pain</option>
              <option>Contrarian take</option>
            </select>
          </div>

          <div className="mt-auto">
            <button
              type="button"
              className="w-full border border-white/[0.06] py-3.5 font-mono text-[11px] tracking-[0.15em] uppercase text-neutral-400 transition-all hover:border-white/[0.12] hover:text-white"
            >
              Generate Hooks
            </button>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-widest text-neutral-800">
              Mock · 2 Credits per run
            </p>
          </div>
        </div>

        {/* ── Output Stage — premium empty state ───────────────────────── */}
        <div className="flex min-h-[360px] flex-1 items-center justify-center border border-white/[0.04] bg-[#0c0c0e] md:min-h-0">
          <div className="px-8 text-center">
            <div className="mx-auto mb-7 h-px w-10 bg-white/[0.06]" />
            <p className="text-[14px] leading-relaxed text-neutral-700">
              Your viral hooks will appear here
              <br />
              after generation.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// D) GALLERY VIEW — Recent Campaign Outputs
// ═══════════════════════════════════════════════════════════════════════════════

// MOCK gallery — abstract CSS gradient panels, no external images
const GALLERY_ITEMS = [
  {
    type:      "IMAGE",
    title:     "Product Campaign — Nike",
    base:      "linear-gradient(145deg, #0a0a18 0%, #12122a 100%)",
    glow:      "rgba(100,80,255,0.24)",
    glowPos:   "70% 25%",
  },
  {
    type:      "VIDEO",
    title:     "TikTok Ad — Fitness Brand",
    base:      "linear-gradient(145deg, #081209 0%, #0e1c0e 100%)",
    glow:      "rgba(120,225,40,0.20)",
    glowPos:   "30% 65%",
  },
  {
    type:      "HOOK",
    title:     "5 Viral Hooks — Beauty",
    base:      "linear-gradient(145deg, #160a0a 0%, #200e0e 100%)",
    glow:      "rgba(255,70,70,0.18)",
    glowPos:   "70% 30%",
  },
  {
    type:      "CAMPAIGN",
    title:     "Full Campaign Pack — Q2",
    base:      "linear-gradient(145deg, #080e16 0%, #0c1422 100%)",
    glow:      "rgba(50,120,255,0.20)",
    glowPos:   "25% 60%",
  },
  {
    type:      "AVATAR",
    title:     "Talking Avatar — Founder",
    base:      "linear-gradient(145deg, #0a0c12 0%, #0e1018 100%)",
    glow:      "rgba(80,140,255,0.18)",
    glowPos:   "65% 35%",
  },
  {
    type:      "IMAGE",
    title:     "Brand Assets — Luxury Kit",
    base:      "linear-gradient(145deg, #120e07 0%, #1c1409 100%)",
    glow:      "rgba(255,160,40,0.18)",
    glowPos:   "30% 70%",
  },
] as const;

export function GalleryView() {
  return (
    <div className="flex flex-col pb-24 pt-10 md:pt-16">
      <MonoLabel text="Campaign Assets · Mock" />
      <SectionHead headline={"Recent\nOutputs."} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GALLERY_ITEMS.map(({ type, title, base, glow, glowPos }) => (
          <div
            key={title}
            className="group relative cursor-pointer overflow-hidden border border-white/[0.04] transition-colors hover:border-white/[0.08]"
            style={{ aspectRatio: "4/5" }}
          >
            {/* Base gradient */}
            <div className="absolute inset-0" style={{ background: base }} />
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 280px 280px at ${glowPos}, ${glow}, transparent)`,
              }}
            />
            {/* Fine grid — studio texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-35"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)," +
                  "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            {/* Label overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="mb-1 font-mono text-[9px] tracking-[0.2em] uppercase text-neutral-600">
                {type}
              </p>
              <p className="text-[14px] font-medium leading-snug text-white">{title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

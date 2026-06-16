"use client";

/**
 * DashboardViews — InfluexAI Editorial Luxury AI Production Studio
 * Design Preview · Studio Home + Agent views.
 *
 * ALL DATA IS MOCK.  No API calls, no credits, no asset writes.
 * Isolated to /dashboard/design-preview — do NOT use in production.
 *
 * Font: --font-preview-headline (Plus Jakarta Sans, loaded in page.tsx)
 * Falls back to system sans-serif if not yet loaded.
 */

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

// ─── Shared view type ─────────────────────────────────────────────────────────

export type PreviewView = "studio" | "agent" | "tools" | "gallery" | "settings";

// ─── Design tokens ────────────────────────────────────────────────────────────

const ACCENT    = "#b4ff00";
const IVORY     = "#F4F0E8";
const DARK_TEXT = "#080808";

// CSS helper — applies Plus Jakarta Sans if loaded via page.tsx
const HEADLINE_FONT: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function MonoLabel({ text }: { text: string }) {
  return (
    <p className="mb-4 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
      {text}
    </p>
  );
}

// ─── GradientPanel — CSS abstract stage, no external images ──────────────────

interface GradientPanelProps {
  children:    ReactNode;
  base:        string;
  glow:        string;
  glowPos?:    string;
  glowRadius?: string;
  grid?:       boolean;
  accentLine?: boolean;
  className?:  string;
}

function GradientPanel({
  children, base, glow,
  glowPos    = "25% 40%",
  glowRadius = "300px",
  grid       = false,
  accentLine = false,
  className  = "",
}: GradientPanelProps) {
  return (
    <div className={`relative overflow-hidden border border-white/[0.04] ${className}`}>
      <div className="absolute inset-0" style={{ background: base }} />
      <div className="pointer-events-none absolute inset-0" style={{
        background: `radial-gradient(ellipse ${glowRadius} ${glowRadius} at ${glowPos}, ${glow}, transparent)`,
      }} />
      {grid && (
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
      )}
      {accentLine && (
        <div className="pointer-events-none absolute left-0 top-0 h-px w-28" style={{
          background: `linear-gradient(to right, ${ACCENT}55, transparent)`,
        }} />
      )}
      <div className="relative h-full">{children}</div>
    </div>
  );
}

// ─── Agent Command Center data ─────────────────────────────────────────────────

// MOCK prompts — cycle through as placeholder text
const EXAMPLE_PROMPTS = [
  "Erstelle ein TikTok-Video für mein Produkt",
  "Mache 5 Hooks für eine Beauty-Kampagne",
  "Verwandle dieses Bild in ein Video",
  "Erstelle einen UGC-Style Ad für Instagram",
  "Schreibe mir eine Kampagne für ein Restaurant",
] as const;

const QUICK_ACTIONS = [
  "Bild erstellen",
  "Video erstellen",
  "Kampagne starten",
  "Hook schreiben",
  "Avatar erstellen",
] as const;

// ─── CommandCenter ────────────────────────────────────────────────────────────

/**
 * Premium Command Center with:
 * - Warm ivory (#F4F0E8) input surface (contrasts with dark studio shell)
 * - Active state: lime border glow on focus
 * - Loading state: spinning conic-gradient border (CSS + Tailwind animate-spin)
 * - Cycling placeholder prompts (every 3s)
 * - Quick Action buttons
 *
 * MOCK — no API call, no credits, no assets.
 */
function CommandCenter({
  compact    = false,
  onNavigate,
}: {
  compact?:   boolean;
  onNavigate: (v: PreviewView) => void;
}) {
  const [input,     setInput    ] = useState("");
  const [isActive,  setIsActive ] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [promptIdx, setPromptIdx] = useState(0);

  // Cycle placeholder prompts every 3 s
  useEffect(() => {
    const t = setInterval(
      () => setPromptIdx((i) => (i + 1) % EXAMPLE_PROMPTS.length),
      3000,
    );
    return () => clearInterval(t);
  }, []);

  // Mock generate: spins border for 2 s, then resets
  const handleGenerate = useCallback(() => {
    if (!input.trim()) return;
    setIsLoading(true);
    // MOCK — no API call, no credits, no assets saved
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, [input]);

  return (
    <section className={compact ? "pb-10" : "pb-16 pt-14 md:pb-20 md:pt-20"}>
      {!compact && (
        <>
          <MonoLabel text="Agent Command Center" />
          <h1
            className="mb-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-[68px]"
            style={{ ...HEADLINE_FONT, letterSpacing: "-0.03em" }}
          >
            Was möchtest du
            <br />
            heute erstellen?
          </h1>
          <p className="mb-10 max-w-xl text-[15px] leading-[1.6] text-neutral-400">
            Beschreibe deine Idee — InfluexAI wählt das passende Tool
            und führt dich zum nächsten Schritt.
          </p>
        </>
      )}

      {/* ── Input wrapper — spinning border on load, lime glow on focus ── */}
      {/* MOCK — no API call, no credits, no assets */}
      <div
        className={`relative mb-6 ${isLoading ? "overflow-hidden p-[1px]" : ""}`}
      >
        {/* Spinning conic-gradient border (loading only) */}
        {isLoading && (
          <div
            className="absolute animate-spin"
            style={{
              top: "-50%", left: "-50%",
              width: "200%", height: "200%",
              background:
                "conic-gradient(from 0deg, transparent 0%, #b4ff00 25%, transparent 50%)",
              animationDuration: "1.8s",
            }}
          />
        )}

        {/* Warm ivory command surface */}
        <div
          style={{
            background: IVORY,
            border: isLoading ? "none"
                  : isActive  ? "1px solid rgba(180, 255, 0, 0.55)"
                  : "1px solid rgba(255,255,255,0.06)",
            boxShadow:
              isActive && !isLoading
                ? "0 0 0 4px rgba(180,255,0,0.04), 0 0 32px rgba(180,255,0,0.07)"
                : "none",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsActive(true)}
            onBlur={() => { if (!input) setIsActive(false); }}
            placeholder={EXAMPLE_PROMPTS[promptIdx]}
            rows={compact ? 2 : 3}
            disabled={isLoading}
            className="w-full resize-none bg-transparent px-7 py-5 text-[15px] outline-none placeholder:text-[#CFC4B3] disabled:opacity-50"
            style={{ lineHeight: "1.65", color: DARK_TEXT }}
          />

          {/* Action bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 px-7 py-4"
            style={{ borderTop: "1px solid rgba(8,8,8,0.07)" }}
          >
            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onNavigate("tools")}
                  className="rounded-sm px-3 py-1.5 text-[11px] font-medium transition-all hover:bg-black/10"
                  style={{ background: "rgba(8,8,8,0.06)", color: DARK_TEXT }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Generate CTA */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="shrink-0 px-6 py-2.5 font-mono text-[11px] tracking-[0.15em] uppercase transition-all disabled:opacity-60"
              style={{
                background: input.trim() ? ACCENT : "rgba(8,8,8,0.10)",
                color:      input.trim() ? "#000" : "rgba(8,8,8,0.35)",
              }}
            >
              {isLoading ? "Erstelle…" : "Generieren"}
            </button>
          </div>
        </div>
      </div>

      {/* Cycling example prompts — clickable */}
      {!compact && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          <span className="shrink-0 pt-0.5 font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-700">
            Versuche:
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => { setInput(prompt); setIsActive(true); }}
                className="text-left text-[12px] leading-[1.6] text-neutral-600 transition-colors hover:text-neutral-200"
              >
                „{prompt}"
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Production Stage ─────────────────────────────────────────────────────────

function ProductionStage() {
  return (
    <section className="pb-20">
      <MonoLabel text="Production Stage" />
      <h2
        className="mb-8 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl"
        style={{ ...HEADLINE_FONT, letterSpacing: "-0.03em" }}
      >
        Your work, in motion.
      </h2>

      {/* Bento: 2/3 dark + 1/3 mixed */}
      <div className="flex flex-col gap-4 md:h-[520px] md:flex-row">

        {/* Ad Flow — dominant dark panel */}
        {/* MOCK — CSS gradient, no external image */}
        <GradientPanel
          base="linear-gradient(135deg, #090916 0%, #0b0b22 60%, #07070e 100%)"
          glow="rgba(80,55,215,0.22)"
          glowPos="28% 45%"
          glowRadius="400px"
          grid accentLine
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
              <h3
                className="mb-2 text-2xl font-extrabold leading-tight text-white md:text-3xl"
                style={HEADLINE_FONT}
              >
                Campaign Visual System
              </h3>
              <p className="max-w-sm text-[13px] leading-[1.6] text-neutral-500">
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

        {/* Right column — warm ivory + dark mix */}
        <div className="grid grid-cols-2 gap-4 md:flex md:flex-1 md:flex-col">

          {/* Avatar Video — warm IVORY panel (editorial contrast) */}
          {/* MOCK */}
          <div
            className="relative flex min-h-[160px] flex-col justify-between overflow-hidden border p-5 md:min-h-0 md:flex-1 md:p-6"
            style={{
              background: IVORY,
              borderColor: "rgba(8,8,8,0.06)",
            }}
          >
            <p
              className="font-mono text-[10px] tracking-[0.2em] uppercase"
              style={{ color: "rgba(8,8,8,0.35)" }}
            >
              Avatar Video
            </p>
            <div>
              <p
                className="text-[15px] font-extrabold"
                style={{ ...HEADLINE_FONT, color: DARK_TEXT }}
              >
                Talking Avatars
              </p>
              <p className="mt-2 text-[12px]" style={{ color: "rgba(8,8,8,0.40)" }}>
                Sprechende KI-Avatare in Sekunden
              </p>
            </div>
          </div>

          {/* AI Media Buyer — dark warm gradient */}
          {/* MOCK */}
          <GradientPanel
            base="linear-gradient(145deg, #120e07 0%, #0d0b05 100%)"
            glow="rgba(255,158,40,0.20)"
            glowPos="20% 80%"
            glowRadius="180px"
            className="min-h-[160px] md:min-h-0 md:flex-1"
          >
            <div className="flex h-full flex-col justify-between p-5 md:p-6">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-600">
                AI Media Buyer
              </p>
              <div>
                <p className="text-[15px] font-extrabold text-white" style={HEADLINE_FONT}>
                  Paid Ads
                </p>
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

// ─── Tool Category Strip ──────────────────────────────────────────────────────

const TOOL_CATEGORIES = [
  { id: "foto",   label: "Foto",            count: 5  },
  { id: "video",  label: "Video",           count: 5  },
  { id: "avatar", label: "Avatar & Voice",  count: 4  },
  { id: "text",   label: "Text & Campaign", count: 4  },
  { id: "brand",  label: "Brand / Assets",  count: 3  },
] as const;

function ToolStrip({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  return (
    <section className="pb-16">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <MonoLabel text="Production Areas" />
          <h2
            className="-mt-2 text-2xl font-extrabold tracking-tight text-white"
            style={HEADLINE_FONT}
          >
            Studio-Werkzeuge
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("tools")}
          className="font-mono text-[11px] tracking-widest uppercase text-neutral-600 transition-colors hover:text-white"
        >
          Alle →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {TOOL_CATEGORIES.map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate("tools")}
            className="group flex flex-col gap-3 border border-white/[0.04] bg-[#0d0d0f] p-5 text-left transition-all hover:border-white/[0.08] hover:bg-[#101013]"
          >
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-neutral-700">
              {count} Tools
            </p>
            <p
              className="text-[14px] font-semibold text-neutral-200 transition-colors group-hover:text-white"
              style={HEADLINE_FONT}
            >
              {label}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── Recent Outputs ───────────────────────────────────────────────────────────

// MOCK — CSS gradient frames, no real assets
const RECENT_OUTPUTS = [
  {
    type:    "IMAGE",
    tool:    "Image Generator",
    title:   "Product Shot — Nike",
    base:    "linear-gradient(145deg, #0a0a18 0%, #12122a 100%)",
    glow:    "rgba(100,80,255,0.24)",
    glowPos: "70% 25%",
    date:    "vor 2h",
  },
  {
    type:    "VIDEO",
    tool:    "Image to Video",
    title:   "TikTok Ad — Fitness",
    base:    "linear-gradient(145deg, #081209 0%, #0e1c0e 100%)",
    glow:    "rgba(120,225,40,0.20)",
    glowPos: "30% 65%",
    date:    "vor 4h",
  },
  {
    type:    "HOOK",
    tool:    "Viral Hook",
    title:   "5 Hooks — Beauty Campaign",
    base:    "linear-gradient(145deg, #160a0a 0%, #200e0e 100%)",
    glow:    "rgba(255,70,70,0.18)",
    glowPos: "70% 30%",
    date:    "gestern",
  },
] as const;

function RecentOutputs({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  return (
    <section className="pb-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <MonoLabel text="Recent Outputs · Mock" />
          <h2
            className="-mt-2 text-2xl font-extrabold tracking-tight text-white"
            style={HEADLINE_FONT}
          >
            Studio-Archiv
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("gallery")}
          className="font-mono text-[11px] tracking-widest uppercase text-neutral-600 transition-colors hover:text-white"
        >
          Gallery →
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {RECENT_OUTPUTS.map(({ type, tool, title, base, glow, glowPos, date }) => (
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
                "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)," +
                "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }} />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="mb-0.5 font-mono text-[9px] uppercase tracking-widest text-neutral-600">
                    {type} · {tool}
                  </p>
                  <p className="text-[13px] font-medium text-white">{title}</p>
                </div>
                <p className="shrink-0 ml-2 font-mono text-[9px] text-neutral-700">{date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exported Views
// ═══════════════════════════════════════════════════════════════════════════════

/** Default Studio Home: Agent Command + Production Stage + Tool Strip + Recent */
export function StudioView({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  return (
    <>
      <CommandCenter onNavigate={onNavigate} />
      <ProductionStage />
      <ToolStrip onNavigate={onNavigate} />
      <RecentOutputs onNavigate={onNavigate} />
    </>
  );
}

/** Full-screen focused Agent view — larger output area, workflow steps */
export function AgentView({ onNavigate }: { onNavigate: (v: PreviewView) => void }) {
  return (
    <div className="pb-24 pt-10 md:pt-16">
      <MonoLabel text="Agent · Command Center" />
      <h1
        className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-[68px]"
        style={{ ...HEADLINE_FONT, letterSpacing: "-0.03em" }}
      >
        Create campaign-ready
        <br />
        assets from one idea.
      </h1>
      <p className="mb-12 max-w-xl text-[15px] leading-[1.6] text-neutral-400">
        Generate images, videos, hooks and creator content inside one
        premium AI production workspace.
      </p>

      <CommandCenter compact onNavigate={onNavigate} />

      {/* Workflow steps */}
      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            step: "01",
            title: "Idee beschreiben",
            desc: "Erkläre dein Produkt, deine Kampagne oder deine Zielgruppe in einem Satz.",
          },
          {
            step: "02",
            title: "Tool-Auswahl",
            desc: "InfluexAI wählt das passende Tool automatisch — oder du wählst manuell.",
          },
          {
            step: "03",
            title: "Asset generieren",
            desc: "Dein Asset wird in Sekunden erstellt und ist direkt zum Export bereit.",
          },
        ].map(({ step, title, desc }) => (
          <div key={step} className="border border-white/[0.04] p-6">
            <p className="mb-3 font-mono text-[11px] tracking-[0.2em] text-neutral-700">{step}</p>
            <p
              className="mb-2 text-[15px] font-semibold text-white"
              style={HEADLINE_FONT}
            >
              {title}
            </p>
            <p className="text-[13px] leading-[1.6] text-neutral-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* Teaser CTA strip */}
      <div className="mt-10 flex flex-wrap gap-3">
        {["→ Tools entdecken", "→ Gallery öffnen", "→ Settings"].map((label) => {
          const view = label.includes("Tools")
            ? "tools"
            : label.includes("Gallery")
            ? "gallery"
            : "settings";
          return (
            <button
              key={label}
              type="button"
              onClick={() => onNavigate(view as PreviewView)}
              className="border border-white/[0.05] px-5 py-2.5 font-mono text-[11px] tracking-widest uppercase text-neutral-500 transition-colors hover:border-white/[0.10] hover:text-white"
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

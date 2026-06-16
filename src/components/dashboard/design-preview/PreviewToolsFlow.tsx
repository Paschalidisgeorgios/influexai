"use client";

/**
 * PreviewToolsFlow — Production path: Category → Tool → Engine → Generation.
 * High-contrast editorial style matching Studio Home. ALL DATA IS MOCK.
 */

import { useState } from "react";
import { useLang } from "./PreviewLang";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const ACCENT = "#b4ff00";
const DARK   = "#080808";
const STONE  = "rgba(221,212,196,0.55)";
const LIGHT_CARD = "rgba(221,212,196,0.28)";
const LIGHT_BORDER = "rgba(8,8,8,0.07)";
const STAGE_DOT = "rgba(244,240,232,0.72)";
const DARK_CARD = "rgba(10,10,16,0.90)";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type CatId      = "foto" | "video" | "avatar" | "text" | "brand";
type ToolStatus = "active" | "preview" | "coming-soon";

interface Tool   { id: string; name: string; desc: string; outputType: string; credits: number; status: ToolStatus }
interface Engine { id: string; name: string; desc: string; credits: number; status?: "active" | "preview" }

// ─── MOCK data ────────────────────────────────────────────────────────────────

const TOOLS: Record<CatId, Tool[]> = {
  foto: [
    { id: "img-gen",     name: "Image Generator", desc: "Bilder aus Text — Produkte, Portraits, Kampagnen.",    outputType: "PNG, JPG", credits: 4,  status: "active"      },
    { id: "img-to-img",  name: "Image to Image",  desc: "Bild mit Stil-Referenz transformieren.",               outputType: "PNG, JPG", credits: 6,  status: "active"      },
    { id: "ref-edit",    name: "Reference Edit",  desc: "Bild mit Referenzbild steuern und editieren.",         outputType: "PNG",      credits: 8,  status: "preview"     },
    { id: "prod-shot",   name: "Product Shot",    desc: "Professionelle Produktfotos auf Premium-Backgrounds.", outputType: "PNG, JPG", credits: 6,  status: "active"      },
    { id: "ugc-look",    name: "UGC Look",        desc: "Authentischer Creator-Look für Ads und Social.",       outputType: "PNG, JPG", credits: 5,  status: "coming-soon" },
  ],
  video: [
    { id: "img-vid",   name: "Image to Video", desc: "Bild in flüssiges Video animieren.",                  outputType: "MP4",      credits: 12, status: "active"      },
    { id: "txt-vid",   name: "Text to Video",  desc: "Komplett aus Text ein Video generieren.",              outputType: "MP4",      credits: 16, status: "active"      },
    { id: "reel-gen",  name: "Reel Generator", desc: "Instagram/TikTok-Reels automatisch erstellen.",        outputType: "MP4 9:16", credits: 14, status: "preview"     },
    { id: "vid-ad",    name: "Video Ad",       desc: "Performance-Ads für Social Media und Paid Channels.",  outputType: "MP4",      credits: 18, status: "active"      },
    { id: "motion",    name: "Motion / Loop",  desc: "Endlose Loops und Motion-Clips für Branding.",         outputType: "MP4, GIF", credits: 10, status: "coming-soon" },
  ],
  avatar: [
    { id: "talk-avatar", name: "Talking Avatar", desc: "KI-Avatar mit Sprach-Sync für Ads und Onboarding.", outputType: "MP4",      credits: 20, status: "active"  },
    { id: "talk-photo",  name: "Talking Photo",  desc: "Jedes Foto zum sprechenden Portrait animieren.",    outputType: "MP4",      credits: 15, status: "active"  },
    { id: "lip-sync",    name: "Lip Sync",       desc: "Audio auf Video synchronisieren.",                  outputType: "MP4",      credits: 12, status: "active"  },
    { id: "ai-voice",    name: "AI Voice",       desc: "Natürlich klingende KI-Stimme generieren.",         outputType: "MP3, WAV", credits: 8,  status: "preview" },
  ],
  text: [
    { id: "viral-hook",  name: "Viral Hook",       desc: "5 scroll-stoppende Hooks für jedes Produkt.",     outputType: "Text",     credits: 2, status: "active"  },
    { id: "cont-cal",    name: "Content Calendar", desc: "7-Tage-Kalender für alle Plattformen.",           outputType: "Text/PDF", credits: 4, status: "active"  },
    { id: "trend-scr",   name: "Trend Script",     desc: "Skript aus trendenden Inhalten generieren.",      outputType: "Text",     credits: 3, status: "active"  },
    { id: "camp-agent",  name: "Campaign Agent",   desc: "Vollständige Kampagne aus einem Brief.",          outputType: "Multi",    credits: 8, status: "preview" },
  ],
  brand: [
    { id: "brand-kit",   name: "Brand Kit",      desc: "Farben, Logos, Schriften zentral verwalten.", outputType: "PDF/SVG",  credits: 2, status: "active"      },
    { id: "asset-gal",   name: "Asset Gallery",  desc: "Alle Assets auf einen Blick.",                outputType: "—",        credits: 0, status: "active"      },
    { id: "prod-assets", name: "Product Assets", desc: "Produktbilder und Packshots.",                outputType: "PNG, JPG", credits: 6, status: "coming-soon" },
  ],
};

const ENGINES: Record<string, Engine[]> = {
  "img-gen": [
    { id: "std",     name: "Standard Image", desc: "Solide Qualität für Kampagnen.",          credits: 4,  status: "active"  },
    { id: "fast",    name: "Fast Draft",     desc: "Ultra-schnell für Iterationen.",          credits: 2,  status: "active"  },
    { id: "premium", name: "Premium Image",  desc: "Finale Campaign-Qualität.",               credits: 8,  status: "active"  },
  ],
  "img-to-img": [
    { id: "std",     name: "Standard Edit",  desc: "Solide Transformation.",                  credits: 6,  status: "active"  },
    { id: "ref",     name: "Reference Edit", desc: "Referenz-gesteuerte Bearbeitung.",        credits: 8,  status: "preview" },
    { id: "brand",   name: "Brand Assets",   desc: "Brand-konsistente Ergebnisse.",           credits: 10, status: "active"  },
  ],
  "img-vid": [
    { id: "i2v",     name: "Image to Video", desc: "Flüssige Animation aus Einzelbild.",      credits: 12, status: "active"  },
    { id: "cine",    name: "Cinematic",      desc: "Cinematic Motion für Ads.",               credits: 18, status: "active"  },
  ],
  "txt-vid": [
    { id: "t2v",     name: "Text to Video",  desc: "Video komplett aus Prompt.",              credits: 16, status: "active"  },
    { id: "reel",    name: "Reel Generator", desc: "9:16 Reels für Social.",                  credits: 14, status: "preview" },
    { id: "ad",      name: "Video Ad",       desc: "Performance-Ads für Paid Channels.",      credits: 18, status: "active"  },
  ],
  "viral-hook": [
    { id: "std",     name: "Standard Pack",  desc: "5 direkte Hooks.",                        credits: 2,  status: "active"  },
    { id: "pro",     name: "Pro Pack",       desc: "10 Hooks mit Variationen.",               credits: 5,  status: "active"  },
  ],
};

const DEFAULT_ENGINES: Engine[] = [
  { id: "std",     name: "Standard", desc: "Schnell und solid — gut für Drafts.", credits: 4, status: "active" },
  { id: "premium", name: "Premium",  desc: "Beste Qualität für finale Outputs.",  credits: 8, status: "active" },
];

const CAT_ORDER: CatId[] = ["foto", "video", "avatar", "text", "brand"];

// ─── Primitives ───────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-mono text-[12px] tracking-[0.1em] uppercase" style={{ color: "rgba(8,8,8,0.45)" }}>
      {children}
    </p>
  );
}

function StatusDot({ status, labels }: { status: ToolStatus; labels: { statusActive: string; statusPreview: string; statusSoon: string } }) {
  const map = {
    active:      { label: labels.statusActive,  color: ACCENT,                  bg: "rgba(180,255,0,0.12)" },
    preview:     { label: labels.statusPreview, color: "rgba(8,8,8,0.55)",      bg: "rgba(8,8,8,0.06)"     },
    "coming-soon": { label: labels.statusSoon,  color: "rgba(8,8,8,0.35)",      bg: "rgba(8,8,8,0.04)"     },
  } as const;
  const { label, color, bg } = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase" style={{ background: bg, color }}>
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

// ─── Flow indicator ───────────────────────────────────────────────────────────

function FlowIndicator({
  cat, tool, engine, labels,
}: {
  cat: CatId | null;
  tool: Tool | null;
  engine: Engine | null;
  labels: { flowLabel: string; stepCategory: string; stepTool: string; stepEngine: string; stepGenerate: string; categories: Record<CatId, string> };
}) {
  const steps = [
    { key: "cat",     label: labels.stepCategory,  active: !!cat,     done: !!cat     },
    { key: "tool",    label: labels.stepTool,      active: !!tool,    done: !!tool    },
    { key: "engine",  label: labels.stepEngine,    active: !!engine,  done: !!engine  },
    { key: "gen",     label: labels.stepGenerate,  active: !!engine,  done: false     },
  ];

  return (
    <div className="mb-10">
      <SectionLabel>{labels.flowLabel}</SectionLabel>
      <div className="relative flex items-center gap-0 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <div className="absolute left-0 right-0 top-[11px] hidden h-px md:block" style={{ background: STONE }} />
        {steps.map((s, i) => (
          <div key={s.key} className="relative flex shrink-0 items-center">
            <div className="flex flex-col items-start pr-6 md:pr-10">
              <div
                className="relative z-10 mb-2 h-[22px] w-[22px] rounded-full border-2"
                style={{
                  borderColor: s.done || s.active ? ACCENT : STONE,
                  background:  s.done || s.active ? ACCENT : STAGE_DOT,
                }}
              />
              <p className="font-mono text-[11px] tracking-[0.08em] uppercase" style={{ color: s.active ? DARK : "rgba(8,8,8,0.40)" }}>
                {s.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="absolute left-[22px] top-[11px] hidden h-px w-8 md:block" style={{
                background: s.done ? ACCENT : STONE,
              }} />
            )}
          </div>
        ))}
      </div>
      {cat && (
        <p className="mt-2 text-[13px]" style={{ color: "rgba(8,8,8,0.50)" }}>
          {labels.categories[cat]}
          {tool ? ` → ${tool.name}` : ""}
          {engine ? ` → ${engine.name}` : ""}
        </p>
      )}
    </div>
  );
}

// ─── Category picker ──────────────────────────────────────────────────────────

function CategoryPicker({
  active,
  onSelect,
}: {
  active: CatId | null;
  onSelect: (c: CatId) => void;
}) {
  const { t } = useLang();
  const tc = t.tools;

  return (
    <section className="mb-10">
      <SectionLabel>{tc.stepCategory}</SectionLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CAT_ORDER.map((id, idx) => {
          const isActive = active === id;
          const isLight  = idx % 2 === 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="group relative flex min-h-[130px] flex-col justify-between p-6 text-left transition-all md:min-h-[150px] md:p-7"
              style={{
                background:  isLight ? LIGHT_CARD : DARK_CARD,
                border:      isActive
                  ? `1.5px solid ${ACCENT}`
                  : isLight ? `1px solid ${LIGHT_BORDER}` : "1px solid rgba(255,255,255,0.08)",
                boxShadow:   isActive
                  ? `0 0 0 2px rgba(180,255,0,0.08), inset 0 1px 0 rgba(255,255,255,0.30)`
                  : isLight
                    ? "inset 0 1px 0 rgba(255,255,255,0.32)"
                    : "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {isActive && (
                <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: ACCENT }} />
              )}
              <p className="font-mono text-[11px] tracking-[0.1em] uppercase" style={{
                color: isLight ? "rgba(8,8,8,0.40)" : "rgba(255,255,255,0.40)",
              }}>
                {tc.toolsCount.replace("{count}", String(TOOLS[id].length))}
              </p>
              <div>
                <p className="mb-1 text-lg font-extrabold md:text-xl" style={{
                  ...HL,
                  color: isLight ? DARK : "#fff",
                }}>
                  {tc.categories[id]}
                </p>
                <p className="text-[13px] leading-[1.5]" style={{
                  color: isLight ? "rgba(8,8,8,0.55)" : "rgba(255,255,255,0.45)",
                }}>
                  {tc.catDesc[id]}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Tool list ────────────────────────────────────────────────────────────────

function ToolPicker({
  cat,
  active,
  onSelect,
}: {
  cat: CatId;
  active: Tool | null;
  onSelect: (tool: Tool) => void;
}) {
  const { t } = useLang();
  const tc = t.tools;
  const tools = TOOLS[cat];

  return (
    <section className="mb-10">
      <SectionLabel>{tc.stepTool} · {tc.categories[cat]}</SectionLabel>
      <div className="flex flex-col gap-2">
        {tools.map((tool) => {
          const isActive = active?.id === tool.id;
          const disabled = tool.status === "coming-soon";
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => !disabled && onSelect(tool)}
              disabled={disabled}
              className="group flex w-full flex-col gap-3 p-5 text-left transition-all md:flex-row md:items-center md:justify-between md:p-6 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: isActive ? "rgba(180,255,0,0.07)" : LIGHT_CARD,
                border: isActive ? `1.5px solid ${ACCENT}` : `1px solid ${LIGHT_BORDER}`,
                boxShadow: isActive ? "none" : "inset 0 1px 0 rgba(255,255,255,0.28)",
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <p className="text-[16px] font-bold" style={{ ...HL, color: DARK }}>{tool.name}</p>
                  <StatusDot status={tool.status} labels={tc} />
                </div>
                <p className="text-[13px] leading-[1.5]" style={{ color: "rgba(8,8,8,0.55)" }}>{tool.desc}</p>
              </div>
              <div className="shrink-0 md:text-right">
                <p className="font-mono text-[11px]" style={{ color: "rgba(8,8,8,0.45)" }}>
                  {tc.outputLabel}: {tool.outputType}
                </p>
                <p className="mt-0.5 font-mono text-[12px] font-medium" style={{ color: DARK }}>
                  {tool.id === "asset-gal" ? tc.free : tc.statusPreview}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Engine picker ────────────────────────────────────────────────────────────

function EnginePicker({
  tool,
  active,
  onSelect,
}: {
  tool: Tool;
  active: Engine | null;
  onSelect: (e: Engine) => void;
}) {
  const { t } = useLang();
  const tc = t.tools;
  const engines = ENGINES[tool.id] ?? DEFAULT_ENGINES;

  return (
    <section className="mb-10">
      <SectionLabel>{tc.stepEngine} · {tool.name}</SectionLabel>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {engines.map((engine) => {
          const isActive = active?.id === engine.id;
          return (
            <button
              key={engine.id}
              type="button"
              onClick={() => onSelect(engine)}
              className="group relative flex min-h-[140px] flex-col justify-between p-6 text-left transition-all"
              style={{
                background: DARK_CARD,
                border: isActive ? `1.5px solid ${ACCENT}` : `1px solid ${LIGHT_BORDER}`,
                boxShadow: isActive
                  ? `0 0 16px rgba(180,255,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)`
                  : "0 6px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {isActive && (
                <div className="absolute left-0 top-0 h-[2px] w-full" style={{
                  background: `linear-gradient(90deg, ${ACCENT}, transparent)`,
                }} />
              )}
              <div>
                <p className="mb-1.5 text-[15px] font-bold text-white" style={HL}>{engine.name}</p>
                <p className="text-[13px] leading-[1.5] text-neutral-400">{engine.desc}</p>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <p className="font-mono text-[12px] font-medium" style={{ color: ACCENT }}>
                  {tc.statusPreview}
                </p>
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-neutral-500 group-hover:text-white">
                  {tc.startCta}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Generation page ──────────────────────────────────────────────────────────

function GenerationPanel({
  cat,
  tool,
  engine,
}: {
  cat: CatId;
  tool: Tool;
  engine: Engine;
}) {
  const { t } = useLang();
  const tc = t.tools;
  const [prompt, setPrompt] = useState("");

  const isText  = cat === "text";
  const isVideo = cat === "video";
  const formats = isVideo ? tc.formats.video : tc.formats.image;
  const generateLabel = isText ? tc.generateHookLabel : isVideo ? tc.generateVideoLabel : tc.generateImageLabel;

  return (
    <section>
      <SectionLabel>{tc.stepGenerate} · {tool.name} — {engine.name}</SectionLabel>

      <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
        {/* Input panel — Stone */}
        <div
          className="flex w-full shrink-0 flex-col gap-5 p-6 md:p-7 lg:w-[340px]"
          style={{
            background: LIGHT_CARD,
            border: `1px solid ${LIGHT_BORDER}`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
          }}
        >
          <div>
            <label className="mb-2 block font-mono text-[11px] tracking-[0.1em] uppercase" style={{ color: "rgba(8,8,8,0.45)" }}>
              {isText ? tc.topicLabel : tc.promptLabel}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full resize-none border-b bg-transparent py-2 text-[15px] leading-[1.6] outline-none"
              style={{ borderColor: "rgba(8,8,8,0.15)", color: DARK }}
              placeholder={isText ? "Beauty-Supplement, Vorteil: Haut" : "Premium Produktfoto, weißer Hintergrund"}
            />
          </div>

          {!isText && (
            <div>
              <label className="mb-2 block font-mono text-[11px] tracking-[0.1em] uppercase" style={{ color: "rgba(8,8,8,0.45)" }}>
                {tc.uploadLabel}
              </label>
              <div
                className="flex min-h-[88px] cursor-pointer flex-col items-center justify-center border border-dashed py-5 transition-colors hover:border-neutral-400"
                style={{ borderColor: "rgba(8,8,8,0.14)", background: "rgba(255,255,255,0.12)" }}
              >
                <p className="font-mono text-[11px] uppercase tracking-wide" style={{ color: "rgba(8,8,8,0.45)" }}>
                  {tc.uploadHint.split("—")[0]?.trim() ?? tc.uploadHint}
                </p>
                <p className="mt-1 text-[11px]" style={{ color: "rgba(8,8,8,0.35)" }}>PNG, JPG · max 10 MB</p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block font-mono text-[11px] tracking-[0.1em] uppercase" style={{ color: "rgba(8,8,8,0.45)" }}>
              {tc.formatLabel}
            </label>
            <select
              className="w-full border-b bg-transparent py-2 text-[14px] outline-none"
              style={{ borderColor: "rgba(8,8,8,0.15)", color: DARK }}
              defaultValue={formats[0]}
            >
              {formats.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>

          {!isText && (
            <div>
              <label className="mb-2 block font-mono text-[11px] tracking-[0.1em] uppercase" style={{ color: "rgba(8,8,8,0.45)" }}>
                {tc.styleLabel}
              </label>
              <select
                className="w-full border-b bg-transparent py-2 text-[14px] outline-none"
                style={{ borderColor: "rgba(8,8,8,0.15)", color: DARK }}
                defaultValue=""
              >
                <option value="" disabled>{tc.stylePlaceholder}</option>
                {tc.styles.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div className="mt-auto pt-2">
            <button
              type="button"
              className="w-full py-3.5 font-mono text-[12px] font-bold tracking-[0.1em] uppercase transition-all"
              style={{
                background: prompt.trim() ? ACCENT : "rgba(8,8,8,0.08)",
                color:      prompt.trim() ? DARK   : "rgba(8,8,8,0.30)",
                boxShadow:  prompt.trim() ? `0 0 16px rgba(180,255,0,0.18)` : "none",
              }}
            >
              {generateLabel}
            </button>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wide" style={{ color: "rgba(8,8,8,0.35)" }}>
              Preview Mode · {tc.statusPreview}
            </p>
          </div>
        </div>

        {/* Output stage — dark monitor */}
        <div
          className="relative flex min-h-[360px] flex-1 flex-col overflow-hidden lg:min-h-[480px]"
          style={{
            background: DARK_CARD,
            border: `1px solid ${LIGHT_BORDER}`,
            boxShadow: "0 12px 40px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div className="absolute left-0 top-0 h-[1px] w-full" style={{
            background: `linear-gradient(90deg, ${ACCENT}88, transparent 55%)`,
          }} />
          <div className="flex items-center gap-2 border-b px-5 py-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-neutral-500">
              {tc.outputLabel} · {tool.outputType}
            </span>
            <span className="ml-auto font-mono text-[10px] tracking-[0.08em] uppercase text-neutral-600">
              Studio Preview
            </span>
          </div>
          <div className="relative flex flex-1 flex-col items-center justify-center px-8 py-12">
            <div className="pointer-events-none absolute inset-0 opacity-30" style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(70,50,210,0.20), transparent)",
            }} />
            <div className="relative text-center">
              <div className="mx-auto mb-6 h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}66, transparent)` }} />
              <p className="max-w-sm text-[15px] leading-[1.65] text-neutral-300">
                {tc.emptyState}
              </p>
              <p className="mt-5 font-mono text-[11px] tracking-[0.1em] uppercase text-neutral-600">
                {engine.name} · {tc.statusPreview}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PreviewToolsFlow() {
  const { t } = useLang();
  const tc = t.tools;

  const [cat,    setCat]    = useState<CatId | null>(null);
  const [tool,   setTool]   = useState<Tool | null>(null);
  const [engine, setEngine] = useState<Engine | null>(null);

  const selectCat = (c: CatId) => {
    setCat(c);
    setTool(null);
    setEngine(null);
  };

  const selectTool = (tl: Tool) => {
    setTool(tl);
    setEngine(null);
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <header className="mb-10 md:mb-12">
        <p className="mb-4 font-mono text-[12px] tracking-[0.1em] uppercase" style={{ color: "rgba(8,8,8,0.45)" }}>
          {tc.overline}
        </p>
        <h1
          className="mb-4 text-3xl font-extrabold leading-[1.05] md:text-5xl lg:text-6xl"
          style={{ ...HL, color: DARK, letterSpacing: "-0.03em" }}
        >
          {tc.headline}
        </h1>
        <p className="max-w-2xl text-[16px] leading-[1.65]" style={{ color: "rgba(8,8,8,0.58)" }}>
          {tc.subline}
        </p>
      </header>

      <FlowIndicator cat={cat} tool={tool} engine={engine} labels={tc} />

      <CategoryPicker active={cat} onSelect={selectCat} />

      {cat && (
        <ToolPicker cat={cat} active={tool} onSelect={selectTool} />
      )}

      {cat && tool && (
        <EnginePicker tool={tool} active={engine} onSelect={setEngine} />
      )}

      {cat && tool && engine && (
        <GenerationPanel cat={cat} tool={tool} engine={engine} />
      )}
    </div>
  );
}

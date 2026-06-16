"use client";

/**
 * PreviewToolsFlow — 4-step tool selection: Category → Tool → Engine → Generation.
 * ALL DATA IS MOCK. No API calls, no credits, no assets.
 * Isolated to /dashboard/design-preview.
 */

import { useState } from "react";
import { useLang } from "./PreviewLang";

// ─── Design tokens ────────────────────────────────────────────────────────────

const ACCENT = "#b4ff00";
const IVORY  = "#F4F0E8";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Step      = "category" | "tool" | "engine" | "generate";
type CatId     = "foto" | "video" | "avatar" | "text" | "brand";
type ToolStatus = "active" | "preview" | "coming-soon";

interface Tool   { id:string; name:string; desc:string; outputType:string; credits:number; status:ToolStatus }
interface Engine { id:string; name:string; desc:string; credits:number }

// ─── MOCK Data ────────────────────────────────────────────────────────────────

const TOOLS: Record<CatId, Tool[]> = {
  foto: [
    { id:"img-gen",    name:"Image Generator", desc:"Bilder aus Text — Produkte, Portraits, Kampagnen.",         outputType:"PNG, JPG", credits:4,  status:"active"      },
    { id:"img-to-img", name:"Image to Image",  desc:"Bild mit Stil-Referenz transformieren.",                    outputType:"PNG, JPG", credits:6,  status:"active"      },
    { id:"ref-edit",   name:"Reference Edit",  desc:"Bild mit Referenzbild steuern und editieren.",              outputType:"PNG",      credits:8,  status:"preview"     },
    { id:"prod-shot",  name:"Product Shot",    desc:"Professionelle Produktfotos auf Premium-Backgrounds.",      outputType:"PNG, JPG", credits:6,  status:"active"      },
    { id:"ugc-look",   name:"UGC Look",        desc:"Authentischer Creator-Look für Ads und Social Media.",      outputType:"PNG, JPG", credits:5,  status:"coming-soon" },
  ],
  video: [
    { id:"img-vid",    name:"Image to Video",  desc:"Bild in flüssiges Video animieren.",                       outputType:"MP4",      credits:12, status:"active"      },
    { id:"txt-vid",    name:"Text to Video",   desc:"Komplett aus Text ein Video generieren.",                   outputType:"MP4",      credits:16, status:"active"      },
    { id:"reel-gen",   name:"Reel Generator",  desc:"Instagram/TikTok-Reels automatisch erstellen.",             outputType:"MP4 9:16", credits:14, status:"preview"     },
    { id:"vid-ad",     name:"Video Ad",        desc:"Performance-Ads für Social Media und Paid Channels.",       outputType:"MP4",      credits:18, status:"active"      },
    { id:"motion",     name:"Motion / Loop",   desc:"Endlose Loops und Motion-Clips für Branding.",              outputType:"MP4, GIF", credits:10, status:"coming-soon" },
  ],
  avatar: [
    { id:"talk-avatar",name:"Talking Avatar",  desc:"KI-Avatar mit Sprach-Sync — für Ads, Videos, Onboarding.",outputType:"MP4",      credits:20, status:"active"  },
    { id:"talk-photo", name:"Talking Photo",   desc:"Jedes Foto zum sprechenden Portrait animieren.",            outputType:"MP4",      credits:15, status:"active"  },
    { id:"lip-sync",   name:"Lip Sync",        desc:"Audio auf Video synchronisieren.",                          outputType:"MP4",      credits:12, status:"active"  },
    { id:"ai-voice",   name:"AI Voice",        desc:"Natürlich klingende KI-Stimme generieren.",                outputType:"MP3, WAV", credits:8,  status:"preview" },
  ],
  text: [
    { id:"viral-hook", name:"Viral Hook",      desc:"5 scroll-stoppende Hooks für jedes Produkt.",              outputType:"Text",     credits:2,  status:"active"   },
    { id:"cont-cal",   name:"Content Calendar",desc:"7-Tage-Kalender für alle Plattformen.",                    outputType:"Text/PDF", credits:4,  status:"active"   },
    { id:"trend-scr",  name:"Trend Script",    desc:"Skript aus trendenden Inhalten generieren.",               outputType:"Text",     credits:3,  status:"active"   },
    { id:"camp-agent", name:"Campaign Agent",  desc:"Vollständige Kampagne aus einem Brief.",                   outputType:"Multi",    credits:8,  status:"preview"  },
  ],
  brand: [
    { id:"brand-kit",  name:"Brand Kit",       desc:"Farben, Logos, Schriften zentral verwalten.",              outputType:"PDF/SVG",  credits:2,  status:"active"      },
    { id:"asset-gal",  name:"Asset Gallery",   desc:"Alle Assets auf einen Blick.",                             outputType:"—",        credits:0,  status:"active"      },
    { id:"prod-assets",name:"Product Assets",  desc:"Produktbilder und Packshots.",                             outputType:"PNG, JPG", credits:6,  status:"coming-soon" },
  ],
};

const ENGINES: Record<string, Engine[]> = {
  "img-gen":    [
    { id:"fast",    name:"Fast Draft",    desc:"Flux Schnell — ultra-schnell für Iterationen.",         credits:2 },
    { id:"std",     name:"Standard",      desc:"Flux Dev — solide Qualität für Kampagnen.",             credits:4 },
    { id:"premium", name:"Premium",       desc:"Flux Pro — finale Campaign-Qualität.",                  credits:8 },
  ],
  "img-to-img": [
    { id:"std",     name:"Standard Edit", desc:"Flux Dev — solide Transformation.",                    credits:6  },
    { id:"premium", name:"Brand Edit",    desc:"Flux Pro — brand-konsistente Ergebnisse.",             credits:10 },
  ],
  "img-vid":    [
    { id:"std",     name:"Standard",      desc:"Kling — flüssige Animationen aus Einzelbild.",         credits:12 },
    { id:"premium", name:"Cinematic",     desc:"Kling Pro — cinematic Motion für Ads.",                credits:18 },
  ],
  "viral-hook": [
    { id:"std",     name:"Standard Pack", desc:"Claude Sonnet — 5 direkte Hooks.",                     credits:2 },
    { id:"pro",     name:"Pro Pack",      desc:"GPT-4o — 10 Hooks mit Variationen.",                   credits:5 },
  ],
};
const DEFAULT_ENGINES: Engine[] = [
  { id:"std",     name:"Standard", desc:"Schnell und solid — gut für Drafts.", credits:4 },
  { id:"premium", name:"Premium",  desc:"Beste Qualität für finale Outputs.",   credits:8 },
];

const CAT_ORDER: CatId[] = ["foto","video","avatar","text","brand"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusPill({ status, t }: { status: ToolStatus; t: { statusActive:string; statusPreview:string; statusSoon:string } }) {
  const map = {
    "active":       { label: t.statusActive,  bg: "rgba(180,255,0,0.09)", color: "#b4ff00"               },
    "preview":      { label: t.statusPreview, bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.40)" },
    "coming-soon":  { label: t.statusSoon,    bg: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.20)" },
  } as const;
  const { label, bg, color } = map[status];
  return (
    <span className="inline-block px-2 py-0.5 font-mono text-[9px] tracking-widest uppercase" style={{ background:bg, color }}>
      {label}
    </span>
  );
}

function Crumb({ items }: { items: { label:string; onClick:()=>void; active:boolean }[] }) {
  return (
    <nav className="mb-10 flex flex-wrap items-center gap-2">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-neutral-800">/</span>}
          <button
            type="button"
            onClick={item.onClick}
            className="font-mono text-[10px] tracking-widest uppercase transition-colors"
            style={{ color: item.active ? "#fff" : "rgba(255,255,255,0.30)" }}
          >
            {item.label}
          </button>
        </span>
      ))}
    </nav>
  );
}

// ─── Step 1: Category Grid ────────────────────────────────────────────────────

function CategoryGrid({ onSelect }: { onSelect:(cat:CatId)=>void }) {
  const { t } = useLang();
  const tc = t.tools;

  return (
    <div className="pb-24 pt-12 md:pt-16">
      <p className="mb-6 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">{tc.overline}</p>
      <h2 className="mb-12 text-4xl font-extrabold text-white md:text-5xl" style={{ ...HL, letterSpacing:"-0.03em" }}>
        {tc.headline}
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CAT_ORDER.map((id, idx) => {
          // Alternate ivory tiles for editorial contrast
          const isLight = idx === 0 || idx === 3;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="group flex cursor-pointer flex-col justify-between p-7 text-left transition-all"
              style={{
                background:  isLight ? IVORY : "#0d0d10",
                border:      isLight ? "1px solid rgba(8,8,8,0.07)" : "1px solid rgba(255,255,255,0.05)",
                minHeight:   "180px",
              }}
            >
              <div className="flex items-start justify-between">
                <p className="font-mono text-[9px] tracking-[0.22em] uppercase" style={{ color: isLight ? "rgba(8,8,8,0.35)" : "rgba(255,255,255,0.30)" }}>
                  {tc.toolsCount.replace("{count}", String(TOOLS[id].length))}
                </p>
                <span className="font-mono text-[10px]" style={{ color: isLight ? "rgba(8,8,8,0.25)" : "rgba(255,255,255,0.18)" }}>→</span>
              </div>
              <div>
                <p className="mb-1.5 text-xl font-extrabold" style={{ ...HL, color: isLight ? "#080808" : "#fff" }}>
                  {tc.categories[id]}
                </p>
                <p className="text-[13px] leading-[1.6]" style={{ color: isLight ? "rgba(8,8,8,0.45)" : "rgba(255,255,255,0.38)" }}>
                  {tc.catDesc[id]}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Tool List ────────────────────────────────────────────────────────

function ToolList({ cat, onBack, onSelect }: { cat:CatId; onBack:()=>void; onSelect:(t:Tool)=>void }) {
  const { t } = useLang();
  const tc = t.tools;
  const tools = TOOLS[cat];

  return (
    <div className="pb-24 pt-12 md:pt-16">
      <Crumb items={[
        { label: tc.overline,      onClick: onBack,    active: false },
        { label: tc.categories[cat], onClick: ()=>{}, active: true  },
      ]} />
      <h2 className="mb-10 text-4xl font-extrabold text-white md:text-5xl" style={{ ...HL, letterSpacing:"-0.03em" }}>
        {tc.categories[cat]}
      </h2>

      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => onSelect(tool)}
          disabled={tool.status === "coming-soon"}
          className="group flex w-full cursor-pointer flex-col gap-3 border-b border-white/[0.04] py-7 text-left transition-colors hover:bg-white/[0.01] disabled:cursor-not-allowed md:flex-row md:items-start md:justify-between md:gap-0"
        >
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <p className="text-[16px] font-semibold text-white" style={HL}>{tool.name}</p>
              <StatusPill status={tool.status} t={tc} />
            </div>
            <p className="max-w-md text-[13px] leading-[1.6] text-neutral-500">{tool.desc}</p>
          </div>
          <div className="shrink-0 md:ml-10 md:text-right">
            <p className="font-mono text-[11px] text-neutral-700">{tc.outputLabel}: {tool.outputType}</p>
            <p className="mt-0.5 font-mono text-[11px] text-neutral-700">
              {tool.credits === 0 ? tc.free : `${tool.credits} ${tc.credits}`}
            </p>
            {tool.status !== "coming-soon" && (
              <span className="mt-2 block font-mono text-[10px] tracking-widest uppercase text-neutral-600 transition-colors group-hover:text-white">
                {tc.selectCta}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Step 3: Engine Select ────────────────────────────────────────────────────

function EngineSelect({ cat, tool, onBack, onSelect }: { cat:CatId; tool:Tool; onBack:()=>void; onSelect:(e:Engine)=>void }) {
  const { t } = useLang();
  const tc = t.tools;
  const engines = ENGINES[tool.id] ?? DEFAULT_ENGINES;

  return (
    <div className="pb-24 pt-12 md:pt-16">
      <Crumb items={[
        { label: tc.overline,         onClick: ()=>{},  active: false },
        { label: tc.categories[cat],  onClick: onBack,  active: false },
        { label: tool.name,           onClick: ()=>{},  active: true  },
      ]} />
      <p className="mb-2 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">{tc.engineLabel}</p>
      <h2 className="mb-2 text-4xl font-extrabold text-white md:text-5xl" style={{ ...HL, letterSpacing:"-0.03em" }}>
        {tool.name}
      </h2>
      <p className="mb-12 text-[14px] leading-[1.6] text-neutral-500">{tool.desc}</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {engines.map((engine) => (
          <button
            key={engine.id}
            type="button"
            onClick={() => onSelect(engine)}
            className="group flex flex-col justify-between border border-white/[0.05] bg-[#0d0d10] p-7 text-left transition-all hover:border-white/[0.10] hover:bg-[#101015]"
            style={{ minHeight: "170px" }}
          >
            <div>
              <p className="mb-2 text-[16px] font-semibold text-white" style={HL}>{engine.name}</p>
              <p className="text-[13px] leading-[1.6] text-neutral-500">{engine.desc}</p>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <p className="font-mono text-[11px] text-neutral-700">{engine.credits} {tc.credits}</p>
              <span className="font-mono text-[10px] tracking-widest uppercase text-neutral-600 transition-colors group-hover:text-white">
                {tc.startCta}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Generation Page ──────────────────────────────────────────────────

function GenerationPage({ cat, tool, engine, onBack }: { cat:CatId; tool:Tool; engine:Engine; onBack:()=>void }) {
  const { t } = useLang();
  const tc = t.tools;
  const [prompt, setPrompt] = useState("");

  const isText  = cat === "text";
  const isVideo = cat === "video";

  const generateLabel = isText ? tc.generateHookLabel : isVideo ? tc.generateVideoLabel : tc.generateImageLabel;

  // Formats from lang
  const formats = isVideo ? tc.formats.video : tc.formats.image;

  return (
    <div className="pb-24 pt-12 md:pt-14">
      <Crumb items={[
        { label: tc.overline,        onClick:()=>{},  active:false },
        { label: tc.categories[cat], onClick: onBack, active:false },
        { label: tool.name,          onClick: onBack, active:false },
        { label: engine.name,        onClick:()=>{},  active:true  },
      ]} />

      <div className="mb-8 flex flex-wrap items-baseline gap-3">
        <h2 className="text-3xl font-extrabold text-white md:text-4xl" style={{ ...HL, letterSpacing:"-0.03em" }}>
          {tool.name}
        </h2>
        <span className="text-[16px] font-normal text-neutral-500">— {engine.name}</span>
        <span className="font-mono text-[11px] text-neutral-700">{engine.credits} {tc.credits}</span>
      </div>

      <div className="flex flex-col gap-6 md:h-[560px] md:flex-row md:gap-8">

        {/* ── Left: Inputs ──────────────────────────────────────────────── */}
        {/* MOCK — no API call, no credits */}
        <div
          className="flex w-full shrink-0 flex-col gap-6 p-7 md:w-[340px]"
          style={{ background: "#0c0c10", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Prompt / Topic */}
          <div>
            <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-600">
              {isText ? tc.topicLabel : tc.promptLabel}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder={
                isText  ? "z. B. Beauty-Supplement, Vorteil: Haut"
                : isVideo ? "z. B. Produktvideo, cinematic, energetisch"
                : "z. B. Premium Produktfoto, weißer Hintergrund"
              }
              className="w-full resize-none border-b border-white/[0.06] bg-transparent py-2 text-[14px] leading-[1.65] text-white outline-none transition-colors placeholder:text-neutral-800 focus:border-white/[0.12]"
            />
          </div>

          {/* Upload zone (image/video tools) */}
          {!isText && (
            <div>
              <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-600">
                {tc.uploadLabel}
              </label>
              <div className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-white/[0.06] py-6 transition-colors hover:border-white/[0.12]">
                <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-700">{tc.uploadHint.split("—")[0]}</p>
                <p className="mt-1 text-[10px] text-neutral-800">PNG, JPG · max 10 MB</p>
              </div>
            </div>
          )}

          {/* Format */}
          <div>
            <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-600">
              {tc.formatLabel}
            </label>
            <select
              className="w-full border-b border-white/[0.06] bg-[#0c0c10] py-2 text-[13px] text-neutral-400 outline-none"
              defaultValue={formats[0]}
            >
              {formats.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>

          {/* Style */}
          {!isText && (
            <div>
              <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-600">
                {tc.styleLabel}
              </label>
              <select
                className="w-full border-b border-white/[0.06] bg-[#0c0c10] py-2 text-[13px] text-neutral-400 outline-none"
                defaultValue=""
              >
                <option value="" disabled>{tc.stylePlaceholder}</option>
                {tc.styles.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Generate CTA */}
          <div className="mt-auto">
            <button
              type="button"
              className="w-full py-3.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-all"
              style={{
                background: prompt.trim() ? ACCENT : "rgba(255,255,255,0.05)",
                color:      prompt.trim() ? "#000" : "rgba(255,255,255,0.18)",
              }}
            >
              {generateLabel}
            </button>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-widest text-neutral-800">
              {tc.mockNote.replace("{credits}", String(engine.credits))}
            </p>
          </div>
        </div>

        {/* ── Right: Output Stage ────────────────────────────────────────── */}
        <div
          className="flex min-h-[320px] flex-1 flex-col items-center justify-center md:min-h-0"
          style={{
            background: isText ? IVORY : "#0a0a0e",
            border: isText ? "1px solid rgba(8,8,8,0.06)" : "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Subtle grid overlay for dark output stage */}
          {!isText && (
            <div className="pointer-events-none absolute inset-0 opacity-20" style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)," +
                "linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
          )}
          <div className="relative px-10 text-center">
            <div
              className="mx-auto mb-8 h-px w-10"
              style={{ background: isText ? "rgba(8,8,8,0.10)" : "rgba(255,255,255,0.06)" }}
            />
            <p
              className="text-[14px] leading-[1.7] whitespace-pre-line"
              style={{ color: isText ? "rgba(8,8,8,0.35)" : "rgba(255,255,255,0.20)" }}
            >
              {tc.emptyState}
            </p>
            <p
              className="mt-5 font-mono text-[9px] uppercase tracking-widest"
              style={{ color: isText ? "rgba(8,8,8,0.18)" : "rgba(255,255,255,0.09)" }}
            >
              {tc.outputLabel} · {tool.outputType}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function PreviewToolsFlow() {
  const [step,   setStep  ] = useState<Step>("category");
  const [cat,    setCat   ] = useState<CatId | null>(null);
  const [tool,   setTool  ] = useState<Tool | null>(null);
  const [engine, setEngine] = useState<Engine | null>(null);

  const go = (s: Step) => setStep(s);

  if (step === "category" || !cat) {
    return <CategoryGrid onSelect={(c) => { setCat(c); setTool(null); setEngine(null); go("tool"); }} />;
  }
  if (step === "tool" || !tool) {
    return <ToolList cat={cat} onBack={() => go("category")} onSelect={(t) => { setTool(t); setEngine(null); go("engine"); }} />;
  }
  if (step === "engine" || !engine) {
    return <EngineSelect cat={cat} tool={tool} onBack={() => go("tool")} onSelect={(e) => { setEngine(e); go("generate"); }} />;
  }
  return <GenerationPage cat={cat} tool={tool} engine={engine} onBack={() => go("engine")} />;
}

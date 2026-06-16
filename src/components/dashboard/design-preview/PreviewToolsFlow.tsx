"use client";

/**
 * PreviewToolsFlow — 4-step tool selection flow.
 * Category → Tool → Model/Engine → Generation Page
 *
 * ALL DATA IS MOCK. No API calls, no credits, no assets.
 * Isolated to /dashboard/design-preview.
 */

import { useState } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────

const ACCENT    = "#b4ff00";
const IVORY     = "#F4F0E8";
const DARK_TEXT = "#080808";
const HEADLINE_FONT: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Step       = "category" | "tool" | "model" | "generate";
type CategoryId = "foto" | "video" | "avatar" | "text" | "brand";

interface Tool {
  id:         string;
  name:       string;
  desc:       string;
  outputType: string;
  credits:    number;
  status:     "active" | "preview" | "coming-soon";
}

interface EngineModel {
  id:      string;
  name:    string;
  desc:    string;
  credits: number;
}

// ─── MOCK Data ────────────────────────────────────────────────────────────────

const CATEGORIES: { id: CategoryId; label: string; desc: string; count: number }[] = [
  { id: "foto",   label: "Foto",             desc: "Bilder generieren & bearbeiten",       count: 5 },
  { id: "video",  label: "Video",            desc: "Videos erstellen & animieren",          count: 5 },
  { id: "avatar", label: "Avatar & Voice",   desc: "Avatare & Sprachsynthese",              count: 4 },
  { id: "text",   label: "Text & Campaign",  desc: "Hooks, Scripts & Kampagnen",            count: 4 },
  { id: "brand",  label: "Brand / Assets",   desc: "Brand-Kit & Asset-Verwaltung",          count: 3 },
];

const TOOLS_BY_CATEGORY: Record<CategoryId, Tool[]> = {
  foto: [
    { id: "image-gen",    name: "Image Generator",  desc: "Bilder aus Text generieren — Produkte, Kampagnen, Portraits.", outputType: "PNG, JPG, WebP", credits: 4,  status: "active"      },
    { id: "img-to-img",   name: "Image to Image",   desc: "Bild mit Stil-Referenz transformieren.",                        outputType: "PNG, JPG",       credits: 6,  status: "active"      },
    { id: "ref-edit",     name: "Reference Edit",   desc: "Bild mit Referenzbild editieren und steuern.",                  outputType: "PNG",            credits: 8,  status: "preview"     },
    { id: "product-shot", name: "Product Shot",     desc: "Professionelle Produktfotos auf Premium-Backgrounds.",          outputType: "PNG, JPG",       credits: 6,  status: "active"      },
    { id: "ugc-look",     name: "UGC Look",         desc: "Authentischer Creator-Look für Ads und Social Media.",          outputType: "PNG, JPG",       credits: 5,  status: "coming-soon" },
  ],
  video: [
    { id: "img-to-video", name: "Image to Video",   desc: "Statisches Bild in flüssiges Video animieren.",                outputType: "MP4",            credits: 12, status: "active"      },
    { id: "txt-to-video", name: "Text to Video",    desc: "Komplett aus Text-Prompt ein Video generieren.",               outputType: "MP4",            credits: 16, status: "active"      },
    { id: "reel-gen",     name: "Reel Generator",   desc: "Instagram/TikTok-Reels automatisch erstellen.",                outputType: "MP4 9:16",       credits: 14, status: "preview"     },
    { id: "video-ad",     name: "Video Ad",         desc: "Performance-Ads für Social Media und Paid Channels.",          outputType: "MP4",            credits: 18, status: "active"      },
    { id: "motion-loop",  name: "Motion / Loop",    desc: "Endlose Loops und Motion-Clips für Branding.",                 outputType: "MP4, GIF",       credits: 10, status: "coming-soon" },
  ],
  avatar: [
    { id: "talking-avatar", name: "Talking Avatar", desc: "KI-Avatar mit Sprach-Sync — für Ads, Videos, Onboarding.",    outputType: "MP4",            credits: 20, status: "active"  },
    { id: "talking-photo",  name: "Talking Photo",  desc: "Jedes Foto zum sprechenden Portrait animieren.",               outputType: "MP4",            credits: 15, status: "active"  },
    { id: "lip-sync",       name: "Lip Sync",       desc: "Audio auf ein Video synchronisieren — perfektes Lip-Sync.",   outputType: "MP4",            credits: 12, status: "active"  },
    { id: "ai-voice",       name: "AI Voice",       desc: "Natürlich klingende KI-Stimme generieren.",                   outputType: "MP3, WAV",       credits: 8,  status: "preview" },
  ],
  text: [
    { id: "viral-hook",      name: "Viral Hook",        desc: "5 scroll-stoppende Hooks für jedes Produkt.",              outputType: "Text",     credits: 2, status: "active"      },
    { id: "content-cal",     name: "Content Calendar",  desc: "7-Tage-Kalender für alle Plattformen.",                    outputType: "Text/PDF", credits: 4, status: "active"      },
    { id: "trend-script",    name: "Trend Script",      desc: "Skript aus trendenden Inhalten generieren.",               outputType: "Text",     credits: 3, status: "active"      },
    { id: "campaign-agent",  name: "Campaign Agent",    desc: "Vollständige Kampagne aus einem Brief.",                   outputType: "Multi",    credits: 8, status: "preview"     },
  ],
  brand: [
    { id: "brand-kit",    name: "Brand Kit",      desc: "Farben, Logos, Schriften und Guidelines zentral verwalten.", outputType: "PDF, PNG, SVG", credits: 2,  status: "active"      },
    { id: "asset-gallery",name: "Asset Gallery",  desc: "Alle generierten Assets auf einen Blick.",                   outputType: "Alle",         credits: 0,  status: "active"      },
    { id: "product-assets",name:"Product Assets", desc: "Produktbilder, Packshots und Marketing-Assets.",             outputType: "PNG, JPG",     credits: 6,  status: "coming-soon" },
  ],
};

const MODELS_BY_TOOL: Record<string, EngineModel[]> = {
  "image-gen": [
    { id: "standard", name: "Standard Image", desc: "Flux Schnell — schnell und solide für Drafts und Tests.",       credits: 4  },
    { id: "fast",     name: "Fast Draft",     desc: "Ultra-schnell für schnelle Iterationen. Niedrige Qualität.",     credits: 2  },
    { id: "premium",  name: "Premium Image",  desc: "Flux Pro — höchste Qualität für finale Campaign-Visuals.",      credits: 8  },
  ],
  "img-to-img": [
    { id: "standard", name: "Standard Edit",  desc: "Flux Dev — solide Bildtransformation mit Stil-Kontrolle.",      credits: 6  },
    { id: "premium",  name: "Brand Assets",   desc: "Flux Pro — brand-konsistente Transformation.",                  credits: 10 },
  ],
  "product-shot": [
    { id: "standard", name: "Standard Shot",  desc: "Professioneller Background-Austausch und Licht-Korrektur.",     credits: 6  },
    { id: "premium",  name: "Luxury Shot",    desc: "Studio-Qualität mit perfekter Beleuchtung und Tiefenschärfe.",  credits: 12 },
  ],
  "img-to-video": [
    { id: "standard", name: "Image to Video", desc: "Kling — flüssige Animationen aus Einzelbild.",                  credits: 12 },
    { id: "premium",  name: "Video Ad",       desc: "Kling Pro — cinematic Motion für Performance-Ads.",             credits: 18 },
  ],
  "viral-hook": [
    { id: "claude",   name: "Standard Hook",  desc: "Claude Sonnet — 5 direkte, scroll-stoppende Hooks.",            credits: 2  },
    { id: "gpt",      name: "Pro Hook Pack",  desc: "GPT-4o — erweitertes Pack mit 10 Hooks + Variationen.",         credits: 5  },
  ],
};

const DEFAULT_MODELS: EngineModel[] = [
  { id: "standard", name: "Standard",       desc: "Schnell und solid — gut für Drafts.",    credits: 4  },
  { id: "premium",  name: "Premium",        desc: "Beste Qualität für finale Outputs.",       credits: 8  },
];

// ─── Helper: Status Badge ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Tool["status"] }) {
  const map = {
    "active":       { label: "Active",       color: "rgba(180,255,0,0.10)",  text: "#b4ff00"              },
    "preview":      { label: "Preview",      color: "rgba(255,255,255,0.04)",text: "rgba(255,255,255,0.4)" },
    "coming-soon":  { label: "Coming Soon",  color: "rgba(255,255,255,0.03)",text: "rgba(255,255,255,0.2)" },
  } as const;
  const { label, color, text } = map[status];
  return (
    <span
      className="inline-block px-2 py-0.5 font-mono text-[9px] tracking-widest uppercase"
      style={{ background: color, color: text }}
    >
      {label}
    </span>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

interface BreadcrumbItem { label: string; onClick: () => void; active: boolean }

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-10 flex flex-wrap items-center gap-2">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-neutral-700">/</span>}
          <button
            type="button"
            onClick={item.onClick}
            className={`font-mono text-[11px] tracking-widest uppercase transition-colors ${
              item.active
                ? "text-white"
                : "text-neutral-600 hover:text-neutral-300"
            }`}
          >
            {item.label}
          </button>
        </span>
      ))}
    </nav>
  );
}

// ─── Step 1: Category Grid ────────────────────────────────────────────────────

function CategoryGrid({
  onSelect,
}: {
  onSelect: (cat: CategoryId) => void;
}) {
  return (
    <div className="pb-24 pt-10 md:pt-16">
      <p className="mb-5 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
        Production Areas
      </p>
      <h2
        className="mb-12 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl"
        style={{ ...HEADLINE_FONT, letterSpacing: "-0.03em" }}
      >
        Studio
        <br />
        Capabilities.
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(({ id, label, desc, count }, idx) => {
          // Alternate ivory/dark for editorial luxury contrast
          const isLight = idx === 0 || idx === 3;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="group flex cursor-pointer flex-col justify-between p-7 text-left transition-all"
              style={{
                background:  isLight ? IVORY : "#0d0d0f",
                border:      isLight ? "1px solid rgba(8,8,8,0.07)" : "1px solid rgba(255,255,255,0.04)",
                minHeight:   "180px",
              }}
            >
              <div className="flex items-start justify-between">
                <p
                  className="font-mono text-[9px] tracking-[0.2em] uppercase"
                  style={{ color: isLight ? "rgba(8,8,8,0.35)" : "rgba(255,255,255,0.35)" }}
                >
                  {count} Tools
                </p>
                <span
                  className="font-mono text-[10px] tracking-widest uppercase transition-colors"
                  style={{ color: isLight ? "rgba(8,8,8,0.25)" : "rgba(255,255,255,0.20)" }}
                >
                  →
                </span>
              </div>
              <div>
                <p
                  className="mb-2 text-xl font-extrabold"
                  style={{ ...HEADLINE_FONT, color: isLight ? DARK_TEXT : "#ffffff" }}
                >
                  {label}
                </p>
                <p
                  className="text-[13px] leading-[1.6]"
                  style={{ color: isLight ? "rgba(8,8,8,0.45)" : "rgba(255,255,255,0.40)" }}
                >
                  {desc}
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

function ToolList({
  category,
  tools,
  onBack,
  onSelect,
}: {
  category: CategoryId;
  tools:    Tool[];
  onBack:   () => void;
  onSelect: (tool: Tool) => void;
}) {
  const catLabel = CATEGORIES.find((c) => c.id === category)?.label ?? category;

  return (
    <div className="pb-24 pt-10 md:pt-16">
      <Breadcrumb
        items={[
          { label: "Tools",    onClick: onBack,     active: false },
          { label: catLabel,   onClick: () => {},   active: true  },
        ]}
      />
      <h2
        className="mb-12 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl"
        style={{ ...HEADLINE_FONT, letterSpacing: "-0.03em" }}
      >
        {catLabel}
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
            <div className="mb-2 flex items-center gap-3">
              <p
                className="text-[16px] font-semibold text-white"
                style={HEADLINE_FONT}
              >
                {tool.name}
              </p>
              <StatusBadge status={tool.status} />
            </div>
            <p className="max-w-md text-[13px] leading-[1.6] text-neutral-500">
              {tool.desc}
            </p>
          </div>
          <div className="shrink-0 md:ml-12 md:text-right">
            <p className="font-mono text-[11px] text-neutral-700">{tool.outputType}</p>
            <p className="mt-0.5 font-mono text-[11px] text-neutral-700">
              {tool.credits === 0 ? "Free" : `${tool.credits} Credits`}
            </p>
            {tool.status !== "coming-soon" && (
              <span className="mt-3 block font-mono text-[11px] tracking-widest uppercase text-neutral-500 transition-colors group-hover:text-white">
                Auswählen →
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Step 3: Model Select ─────────────────────────────────────────────────────

function ModelSelect({
  category,
  tool,
  models,
  onBack,
  onSelect,
}: {
  category: CategoryId;
  tool:     Tool;
  models:   EngineModel[];
  onBack:   () => void;
  onSelect: (model: EngineModel) => void;
}) {
  const catLabel = CATEGORIES.find((c) => c.id === category)?.label ?? category;

  return (
    <div className="pb-24 pt-10 md:pt-16">
      <Breadcrumb
        items={[
          { label: "Tools",    onClick: () => {},  active: false },
          { label: catLabel,   onClick: onBack,    active: false },
          { label: tool.name,  onClick: () => {},  active: true  },
        ]}
      />
      <p className="mb-3 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
        Engine / Modell
      </p>
      <h2
        className="mb-2 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl"
        style={{ ...HEADLINE_FONT, letterSpacing: "-0.03em" }}
      >
        {tool.name}
      </h2>
      <p className="mb-12 text-[14px] leading-[1.6] text-neutral-500">{tool.desc}</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => onSelect(model)}
            className="group flex flex-col justify-between border border-white/[0.04] bg-[#0d0d0f] p-7 text-left transition-all hover:border-white/[0.09] hover:bg-[#101013]"
            style={{ minHeight: "180px" }}
          >
            <div>
              <p
                className="mb-2 text-[16px] font-semibold text-white"
                style={HEADLINE_FONT}
              >
                {model.name}
              </p>
              <p className="text-[13px] leading-[1.6] text-neutral-500">{model.desc}</p>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <p className="font-mono text-[11px] text-neutral-700">
                {model.credits} Credits
              </p>
              <span className="font-mono text-[11px] tracking-widest uppercase text-neutral-600 transition-colors group-hover:text-white">
                Starten →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Generation Page ──────────────────────────────────────────────────

function GenerationPage({
  category,
  tool,
  model,
  onBack,
}: {
  category: CategoryId;
  tool:     Tool;
  model:    EngineModel;
  onBack:   () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const catLabel = CATEGORIES.find((c) => c.id === category)?.label ?? category;
  const isImageTool = ["foto"].includes(category);
  const isVideoTool = category === "video";
  const isTextTool  = category === "text";

  return (
    <div className="pb-24 pt-10 md:pt-14">
      <Breadcrumb
        items={[
          { label: "Tools",      onClick: () => {},  active: false },
          { label: catLabel,     onClick: onBack,    active: false },
          { label: tool.name,    onClick: onBack,    active: false },
          { label: model.name,   onClick: () => {},  active: true  },
        ]}
      />

      {/* Tool header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className="mb-1 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
            {tool.outputType} · {model.credits} Credits
          </p>
          <h2
            className="text-3xl font-extrabold tracking-tight text-white md:text-4xl"
            style={{ ...HEADLINE_FONT, letterSpacing: "-0.03em" }}
          >
            {tool.name}
            <span className="ml-3 text-[18px] font-normal text-neutral-500">
              — {model.name}
            </span>
          </h2>
        </div>
      </div>

      {/* Split: Left inputs + Right output */}
      <div className="flex flex-col gap-6 md:h-[560px] md:flex-row md:gap-8">

        {/* ── Left: Command Panel ───────────────────────────────────────── */}
        {/* MOCK — no API call, no credits */}
        <div
          className="flex w-full shrink-0 flex-col gap-6 p-7 md:w-[360px]"
          style={{ background: "#0d0d0f", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Prompt */}
          <div>
            <label className="mb-3 block font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-600">
              {isTextTool ? "Thema / Produkt" : "Prompt"}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isTextTool
                  ? "z. B. Beauty-Supplement, Zielgruppe 25–40, Vorteil: Haut"
                  : isVideoTool
                  ? "z. B. Produktvideo für Fitness-App, cinematic, energetisch"
                  : "z. B. Premium Produktfoto, weißer Hintergrund, warm beleuchtet"
              }
              rows={4}
              className="w-full resize-none border-b border-white/[0.05] bg-transparent py-2 text-[14px] text-white outline-none transition-colors placeholder:text-neutral-800 focus:border-white/[0.12]"
              style={{ lineHeight: "1.65" }}
            />
          </div>

          {/* Upload zone (for image/video tools) */}
          {(isImageTool || isVideoTool) && (
            <div>
              <label className="mb-3 block font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-600">
                Referenz-Bild (optional)
              </label>
              <div
                className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-white/[0.06] py-6 transition-colors hover:border-white/[0.12]"
              >
                <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-700">
                  Datei ablegen
                </p>
                <p className="mt-1 text-[10px] text-neutral-800">PNG, JPG, WebP — max 10 MB</p>
              </div>
            </div>
          )}

          {/* Format */}
          <div>
            <label className="mb-3 block font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-600">
              Format
            </label>
            <select
              className="w-full border-b border-white/[0.05] bg-[#0d0d0f] py-2 text-[13px] text-neutral-400 outline-none"
              defaultValue="1:1"
            >
              {isVideoTool
                ? ["16:9 Landscape", "9:16 Portrait", "1:1 Square"].map((f) => (
                    <option key={f}>{f}</option>
                  ))
                : ["1:1 Square", "4:5 Portrait", "16:9 Landscape", "3:4 Standard"].map(
                    (f) => <option key={f}>{f}</option>,
                  )}
            </select>
          </div>

          {/* Style */}
          {!isTextTool && (
            <div>
              <label className="mb-3 block font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-600">
                Stil
              </label>
              <select
                className="w-full border-b border-white/[0.05] bg-[#0d0d0f] py-2 text-[13px] text-neutral-400 outline-none"
                defaultValue=""
              >
                <option value="" disabled>Stil wählen...</option>
                {["Editorial Luxury", "Cinematic", "Minimal Clean", "Bold & Vivid", "UGC Authentic"].map(
                  (s) => <option key={s}>{s}</option>,
                )}
              </select>
            </div>
          )}

          {/* Generate CTA */}
          <div className="mt-auto">
            <button
              type="button"
              className="w-full py-3.5 font-mono text-[11px] tracking-[0.15em] uppercase transition-all"
              style={{
                background: prompt.trim() ? ACCENT : "rgba(255,255,255,0.05)",
                color:      prompt.trim() ? "#000" : "rgba(255,255,255,0.20)",
              }}
            >
              {isTextTool ? "Hooks generieren" : isVideoTool ? "Video generieren" : "Bild generieren"}
            </button>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-widest text-neutral-800">
              Mock · {model.credits} Credits pro Generierung
            </p>
          </div>
        </div>

        {/* ── Right: Output Stage ───────────────────────────────────────── */}
        <div
          className="flex min-h-[360px] flex-1 flex-col items-center justify-center md:min-h-0"
          style={{
            background: isTextTool ? IVORY : "#0c0c0e",
            border: isTextTool ? "1px solid rgba(8,8,8,0.06)" : "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div className="px-8 text-center">
            <div
              className="mx-auto mb-8 h-px w-12"
              style={{ background: isTextTool ? "rgba(8,8,8,0.10)" : "rgba(255,255,255,0.06)" }}
            />
            <p
              className="text-[14px] leading-[1.6]"
              style={{ color: isTextTool ? "rgba(8,8,8,0.35)" : "rgba(255,255,255,0.20)" }}
            >
              Starte die Generierung,
              <br />
              um dein erstes Asset zu sehen.
            </p>
            <p
              className="mt-4 font-mono text-[9px] uppercase tracking-widest"
              style={{ color: isTextTool ? "rgba(8,8,8,0.18)" : "rgba(255,255,255,0.10)" }}
            >
              Output · {tool.outputType}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function PreviewToolsFlow() {
  const [step,     setStep    ] = useState<Step>("category");
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [tool,     setTool    ] = useState<Tool | null>(null);
  const [model,    setModel   ] = useState<EngineModel | null>(null);

  const handleCategorySelect = (cat: CategoryId) => {
    setCategory(cat);
    setTool(null);
    setModel(null);
    setStep("tool");
  };

  const handleToolSelect = (t: Tool) => {
    setTool(t);
    setModel(null);
    setStep("model");
  };

  const handleModelSelect = (m: EngineModel) => {
    setModel(m);
    setStep("generate");
  };

  const goToCategory = () => {
    setStep("category");
    setTool(null);
    setModel(null);
  };

  const goToTool = () => {
    setStep("tool");
    setModel(null);
  };

  if (step === "category" || !category) {
    return <CategoryGrid onSelect={handleCategorySelect} />;
  }

  const tools  = TOOLS_BY_CATEGORY[category];
  const models = tool
    ? (MODELS_BY_TOOL[tool.id] ?? DEFAULT_MODELS)
    : DEFAULT_MODELS;

  if (step === "tool") {
    return (
      <ToolList
        category={category}
        tools={tools}
        onBack={goToCategory}
        onSelect={handleToolSelect}
      />
    );
  }

  if (step === "model" && tool) {
    return (
      <ModelSelect
        category={category}
        tool={tool}
        models={models}
        onBack={goToTool}
        onSelect={handleModelSelect}
      />
    );
  }

  if (step === "generate" && tool && model) {
    return (
      <GenerationPage
        category={category}
        tool={tool}
        model={model}
        onBack={goToTool}
      />
    );
  }

  return <CategoryGrid onSelect={handleCategorySelect} />;
}

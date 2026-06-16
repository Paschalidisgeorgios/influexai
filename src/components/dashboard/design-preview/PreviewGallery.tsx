"use client";

/**
 * PreviewGallery — Studio archive with filters, sorting, sizes, hover actions.
 * ALL DATA IS MOCK. No API calls, no credits, no assets.
 * Isolated to /dashboard/design-preview.
 */

import { useState } from "react";
import { useLang } from "./PreviewLang";

// ─── Design tokens ────────────────────────────────────────────────────────────

const ACCENT = "#b4ff00";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Filter = keyof typeof FILTER_IDS;
type Size   = "small" | "medium" | "large";
type Sort   = "newest" | "oldest" | "tool" | "project" | "status";
type Status = "done" | "processing" | "failed" | "favorite";

const FILTER_IDS = {
  all:       "all",
  images:    "images",
  videos:    "videos",
  texts:     "texts",
  campaigns: "campaigns",
  favorites: "favorites",
  failed:    "failed",
} as const;

interface Asset {
  id:      string;
  type:    "IMAGE" | "VIDEO" | "TEXT" | "CAMPAIGN" | "AVATAR";
  group:   Exclude<Filter, "all" | "favorites" | "failed">;
  tool:    string;
  title:   string;
  date:    string;
  status:  Status;
  base:    string;
  glow:    string;
  glowPos: string;
}

// ─── MOCK Assets ──────────────────────────────────────────────────────────────

const ASSETS: Asset[] = [
  { id:"a1", type:"IMAGE",    group:"images",    tool:"Image Generator", title:"Product Shot — Nike",         date:"16 Jun",  status:"done",       base:"linear-gradient(145deg,#0a0a18,#12122a)", glow:"rgba(100,80,255,0.28)",  glowPos:"70% 25%" },
  { id:"a2", type:"VIDEO",    group:"videos",    tool:"Image to Video",  title:"TikTok Ad — Fitness Brand",   date:"15 Jun",  status:"done",       base:"linear-gradient(145deg,#081209,#0e1c0e)", glow:"rgba(120,225,40,0.22)",  glowPos:"30% 65%" },
  { id:"a3", type:"TEXT",     group:"texts",     tool:"Viral Hook",      title:"5 Hooks — Beauty Campaign",   date:"14 Jun",  status:"favorite",   base:"linear-gradient(145deg,#160a0a,#200e0e)", glow:"rgba(255,70,70,0.20)",   glowPos:"70% 30%" },
  { id:"a4", type:"CAMPAIGN", group:"campaigns", tool:"Campaign Agent",  title:"Full Campaign — Q2 Relaunch", date:"13 Jun",  status:"done",       base:"linear-gradient(145deg,#080e16,#0c1422)", glow:"rgba(50,120,255,0.22)",  glowPos:"25% 60%" },
  { id:"a5", type:"AVATAR",   group:"videos",    tool:"Talking Avatar",  title:"Founder Story — Avatar",      date:"12 Jun",  status:"done",       base:"linear-gradient(145deg,#0a0c12,#0e1018)", glow:"rgba(80,140,255,0.20)",  glowPos:"65% 35%" },
  { id:"a6", type:"IMAGE",    group:"images",    tool:"Product Shot",    title:"Luxury Assets — Q2",          date:"11 Jun",  status:"favorite",   base:"linear-gradient(145deg,#120e07,#1c1409)", glow:"rgba(255,160,40,0.20)",  glowPos:"30% 70%" },
  { id:"a7", type:"VIDEO",    group:"videos",    tool:"Reel Generator",  title:"Instagram Reel — Restaurant", date:"10 Jun",  status:"processing", base:"linear-gradient(145deg,#0e0814,#140c1c)", glow:"rgba(180,100,255,0.20)", glowPos:"60% 40%" },
  { id:"a8", type:"TEXT",     group:"texts",     tool:"Content Calendar",title:"7-Tage Kalender — Fitness",   date:"9 Jun",   status:"done",       base:"linear-gradient(145deg,#080e12,#0c1418)", glow:"rgba(40,180,220,0.18)",  glowPos:"40% 60%" },
  { id:"a9", type:"IMAGE",    group:"images",    tool:"Image Generator", title:"UGC Shot — Coffee Brand",     date:"8 Jun",   status:"failed",     base:"linear-gradient(145deg,#0e0a0a,#180e0e)", glow:"rgba(200,80,40,0.18)",   glowPos:"50% 50%" },
];

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: Status }) {
  const colors: Record<Status, string> = {
    done:       "rgba(180,255,0,0.8)",
    processing: "rgba(255,180,40,0.8)",
    failed:     "rgba(255,60,60,0.8)",
    favorite:   "rgba(255,255,255,0.50)",
  };
  return <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: colors[status] }} />;
}

// ─── Gallery Card ─────────────────────────────────────────────────────────────

function Card({ asset, size, hover: hoverLabels }: { asset:Asset; size:Size; hover:{ open:string; download:string; favorite:string } }) {
  const [hovered, setHovered] = useState(false);
  const ratio = size === "large" ? "1/1" : size === "medium" ? "4/5" : "16/9";

  return (
    <div
      className="group relative cursor-pointer overflow-hidden border border-white/[0.05] transition-colors hover:border-white/[0.10]"
      style={{ aspectRatio: ratio }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* CSS gradient frame — no external images */}
      <div className="absolute inset-0" style={{ background: asset.base }} />
      <div className="pointer-events-none absolute inset-0" style={{
        background: `radial-gradient(ellipse 240px 240px at ${asset.glowPos}, ${asset.glow}, transparent)`,
      }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.28]" style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      {/* Type tag */}
      <div className="absolute left-3 top-3 flex gap-2">
        <span className="font-mono text-[8px] tracking-widest uppercase" style={{ background:"rgba(0,0,0,0.50)", color:"rgba(255,255,255,0.45)", padding:"2px 6px" }}>
          {asset.type}
        </span>
        {asset.status === "processing" && (
          <span className="font-mono text-[8px] tracking-widest uppercase" style={{ background:"rgba(255,180,40,0.12)", color:"rgba(255,180,40,0.9)", padding:"2px 6px" }}>
            Processing
          </span>
        )}
        {asset.status === "failed" && (
          <span className="font-mono text-[8px] tracking-widest uppercase" style={{ background:"rgba(255,60,60,0.12)", color:"rgba(255,60,60,0.9)", padding:"2px 6px" }}>
            Error
          </span>
        )}
      </div>

      {/* Hover actions */}
      {hovered && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5" style={{ background:"rgba(0,0,0,0.58)" }}>
          {([hoverLabels.open, hoverLabels.download, hoverLabels.favorite] as const).map((label, i) => (
            <button
              key={label}
              type="button"
              className="w-28 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase"
              style={{
                background: i === 0 ? ACCENT : "rgba(255,255,255,0.08)",
                color:      i === 0 ? "#000"  : "#fff",
                border:     i === 0 ? "none"  : "1px solid rgba(255,255,255,0.10)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Bottom meta */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="mb-0.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-neutral-600">
              <StatusDot status={asset.status} />
              {asset.tool}
            </p>
            <p className="truncate text-[13px] font-medium text-white">{asset.title}</p>
          </div>
          <p className="shrink-0 font-mono text-[9px] text-neutral-700">{asset.date}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function PreviewGallery() {
  const { t } = useLang();
  const tg = t.gallery;

  const [filter, setFilter] = useState<Filter>("all");
  const [size,   setSize  ] = useState<Size>("medium");
  const [sort,   setSort  ] = useState<Sort>("newest");

  // Filter logic
  const visible = ASSETS.filter((a) => {
    if (filter === "all")       return true;
    if (filter === "favorites") return a.status === "favorite";
    if (filter === "failed")    return a.status === "failed";
    return a.group === filter;
  });

  const colMap: Record<Size, string> = {
    small:  "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    medium: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    large:  "grid-cols-1 md:grid-cols-2",
  };

  const filterKeys = Object.keys(FILTER_IDS) as Filter[];
  const sortKeys   = ["newest","oldest","tool","project","status"] as Sort[];
  const sizeKeys   = ["small","medium","large"] as Size[];

  return (
    <div className="pb-24 pt-12 md:pt-16">
      {/* Header */}
      <p className="mb-5 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">{tg.overline}</p>
      <h2 className="mb-10 text-4xl font-extrabold text-white md:text-5xl" style={{ ...HL, letterSpacing:"-0.03em" }}>
        {tg.headline}
      </h2>

      {/* Controls row */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        {/* Filters — horizontal scroll on mobile */}
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
          {filterKeys.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="shrink-0 px-3.5 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-all"
              style={{
                background: filter === f ? ACCENT                    : "rgba(255,255,255,0.04)",
                color:      filter === f ? "#000"                    : "rgba(255,255,255,0.38)",
              }}
            >
              {tg.filters[f]}
            </button>
          ))}
        </div>

        {/* Sort + Size */}
        <div className="flex shrink-0 items-center gap-5">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="bg-transparent font-mono text-[10px] uppercase tracking-widest text-neutral-600 outline-none"
          >
            {sortKeys.map((s) => <option key={s} value={s}>{tg.sorts[s]}</option>)}
          </select>

          {/* Size toggles */}
          <div className="flex gap-1">
            {sizeKeys.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                title={tg.sizes[s]}
                className="flex h-6 w-6 items-center justify-center transition-colors"
                style={{
                  background: size === s ? "rgba(255,255,255,0.08)" : "transparent",
                  border:     size === s ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span
                  className="block"
                  style={{
                    background: "rgba(255,255,255,0.30)",
                    width:  s === "small" ? "8px" : s === "medium" ? "10px" : "13px",
                    height: s === "small" ? "6px" : s === "medium" ? "8px"  : "13px",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Asset count */}
      <p className="mb-5 font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-700">
        {tg.assetsCount.replace("{count}", String(visible.length))}
      </p>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="flex h-48 items-center justify-center border border-white/[0.04]">
          <p className="text-[14px] text-neutral-700">{tg.empty}</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${colMap[size]}`}>
          {visible.map((a) => (
            <Card key={a.id} asset={a} size={size} hover={tg.hover} />
          ))}
        </div>
      )}
    </div>
  );
}

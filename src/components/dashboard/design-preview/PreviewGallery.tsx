"use client";

/**
 * PreviewGallery — High-contrast studio archive with filters, sizes, hover actions.
 * ALL DATA IS MOCK. No API calls, no credits, no external assets.
 * Isolated to /dashboard/design-preview.
 */

import { useMemo, useState } from "react";
import { useLang } from "./PreviewLang";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const ACCENT = "#b4ff00";
const DARK   = "#080808";
const INK    = "#1a1814";
const MUTED  = "#6b6458";
const STONE  = "#DDD4C4";
const STONE2 = "#E8E0D4";
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
  id:       string;
  type:     "IMAGE" | "VIDEO" | "TEXT" | "CAMPAIGN" | "AVATAR";
  group:    Exclude<Filter, "all" | "favorites" | "failed">;
  tool:     string;
  project:  string;
  title:    string;
  date:     string;
  sortDate: number;
  status:   Status;
  base:     string;
  glow:     string;
  glowPos:  string;
  accent:   string;
}

// ─── MOCK Assets ──────────────────────────────────────────────────────────────

const ASSETS: Asset[] = [
  { id:"a1",  type:"IMAGE",    group:"images",    tool:"Image Generator",  project:"Nike Q3",       title:"Product Shot — Nike",           date:"16 Jun", sortDate:16, status:"done",       base:"linear-gradient(155deg,#0c0c14 0%,#141428 55%,#0a0a12 100%)", glow:"rgba(120,100,255,0.32)",  glowPos:"72% 22%", accent:"#8b7cff" },
  { id:"a2",  type:"VIDEO",    group:"videos",    tool:"Image to Video",   project:"FitPro",        title:"TikTok Ad — Fitness Brand",     date:"15 Jun", sortDate:15, status:"done",       base:"linear-gradient(155deg,#081208 0%,#0e1a0e 55%,#060a06 100%)", glow:"rgba(140,230,50,0.26)",  glowPos:"28% 68%", accent:"#7ae030" },
  { id:"a3",  type:"TEXT",     group:"texts",     tool:"Viral Hook",       project:"Beauty Launch", title:"5 Hooks — Beauty Campaign",     date:"14 Jun", sortDate:14, status:"favorite",   base:"linear-gradient(155deg,#140808 0%,#1e0c0c 55%,#100606 100%)", glow:"rgba(255,90,70,0.22)",   glowPos:"68% 32%", accent:"#ff6b55" },
  { id:"a4",  type:"CAMPAIGN", group:"campaigns", tool:"Campaign Agent",   project:"Q2 Relaunch",   title:"Full Campaign — Q2 Relaunch",   date:"13 Jun", sortDate:13, status:"done",       base:"linear-gradient(155deg,#080c16 0%,#0e1424 55%,#060810 100%)", glow:"rgba(60,130,255,0.24)",  glowPos:"22% 62%", accent:"#4a9eff" },
  { id:"a5",  type:"AVATAR",   group:"videos",    tool:"Talking Avatar",   project:"Founder Story", title:"Founder Story — Avatar",        date:"12 Jun", sortDate:12, status:"done",       base:"linear-gradient(155deg,#0a0c14 0%,#101420 55%,#080a10 100%)", glow:"rgba(90,150,255,0.22)",  glowPos:"62% 38%", accent:"#6aabff" },
  { id:"a6",  type:"IMAGE",    group:"images",    tool:"Product Shot",     project:"Luxury Q2",     title:"Luxury Assets — Q2",            date:"11 Jun", sortDate:11, status:"favorite",   base:"linear-gradient(155deg,#141008 0%,#1c180c 55%,#0e0c06 100%)", glow:"rgba(255,170,50,0.22)",  glowPos:"32% 72%", accent:"#ffb040" },
  { id:"a7",  type:"VIDEO",    group:"videos",    tool:"Reel Generator",   project:"Bistro",        title:"Instagram Reel — Restaurant",   date:"10 Jun", sortDate:10, status:"processing", base:"linear-gradient(155deg,#100818 0%,#180c22 55%,#0a0610 100%)", glow:"rgba(190,110,255,0.22)", glowPos:"58% 42%", accent:"#c080ff" },
  { id:"a8",  type:"TEXT",     group:"texts",     tool:"Content Calendar", project:"FitWeek",      title:"7-Tage Kalender — Fitness",     date:"9 Jun",  sortDate:9,  status:"done",       base:"linear-gradient(155deg,#081014 0%,#0c1820 55%,#060a0e 100%)", glow:"rgba(50,190,220,0.20)",  glowPos:"38% 58%", accent:"#40c8e8" },
  { id:"a9",  type:"IMAGE",    group:"images",    tool:"Image Generator",  project:"Coffee Co",     title:"UGC Shot — Coffee Brand",       date:"8 Jun",  sortDate:8,  status:"failed",     base:"linear-gradient(155deg,#100808 0%,#1a0c0c 55%,#0c0606 100%)", glow:"rgba(210,80,50,0.18)",   glowPos:"50% 50%", accent:"#e06040" },
  { id:"a10", type:"CAMPAIGN", group:"campaigns", tool:"Campaign Agent",   project:"Summer Drop",   title:"Summer Drop — Full Package",    date:"7 Jun",  sortDate:7,  status:"done",       base:"linear-gradient(155deg,#0c1018 0%,#141c28 55%,#080c12 100%)", glow:"rgba(80,200,180,0.20)",  glowPos:"45% 35%", accent:"#50c8b0" },
  { id:"a11", type:"AVATAR",   group:"videos",    tool:"Talking Photo",    project:"Onboarding",    title:"Welcome Video — Avatar",        date:"6 Jun",  sortDate:6,  status:"processing", base:"linear-gradient(155deg,#0c0a14 0%,#141020 55%,#080610 100%)", glow:"rgba(255,200,80,0.18)",  glowPos:"55% 45%", accent:"#ffc850" },
  { id:"a12", type:"TEXT",     group:"texts",     tool:"Trend Script",     project:"Streetwear",    title:"Trend Script — Streetwear",     date:"5 Jun",  sortDate:5,  status:"done",       base:"linear-gradient(155deg,#101008 0%,#181810 55%,#0a0a06 100%)", glow:"rgba(180,180,180,0.14)", glowPos:"40% 60%", accent:"#b0b0b0" },
];

const STATUS_ORDER: Record<Status, number> = {
  favorite: 0, done: 1, processing: 2, failed: 3,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filterAssets(assets: Asset[], filter: Filter): Asset[] {
  if (filter === "all")       return assets;
  if (filter === "favorites") return assets.filter((a) => a.status === "favorite");
  if (filter === "failed")    return assets.filter((a) => a.status === "failed");
  return assets.filter((a) => a.group === filter);
}

function sortAssets(assets: Asset[], sort: Sort): Asset[] {
  const copy = [...assets];
  switch (sort) {
    case "newest":  return copy.sort((a, b) => b.sortDate - a.sortDate);
    case "oldest":  return copy.sort((a, b) => a.sortDate - b.sortDate);
    case "tool":    return copy.sort((a, b) => a.tool.localeCompare(b.tool));
    case "project": return copy.sort((a, b) => a.project.localeCompare(b.project));
    case "status":  return copy.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    default:        return copy;
  }
}

// ─── Segment Control ──────────────────────────────────────────────────────────

function SegmentPills<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value:   T;
  onChange:(v: T) => void;
  labels:  Record<T, string>;
}) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-sm p-0.5"
      style={{ background: STONE, border: "1px solid rgba(26,24,20,0.08)" }}
    >
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="shrink-0 rounded-sm px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase transition-all"
            style={{
              background: active ? ACCENT : "transparent",
              color:      active ? DARK   : MUTED,
              fontWeight: active ? 600    : 400,
            }}
          >
            {labels[opt]}
          </button>
        );
      })}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const cfg: Record<Status, { label: string; bg: string; color: string }> = {
    done:       { label: "Ready",      bg: "rgba(180,255,0,0.14)", color: "#4a6600" },
    processing: { label: "Processing", bg: "rgba(255,180,40,0.14)", color: "#8a5a00" },
    failed:     { label: "Failed",     bg: "rgba(220,60,60,0.12)",  color: "#a02020" },
    favorite:   { label: "Favorite",   bg: "rgba(26,24,20,0.08)",   color: INK },
  };
  const c = cfg[status];
  return (
    <span
      className="font-mono text-[8px] tracking-[0.14em] uppercase"
      style={{ background: c.bg, color: c.color, padding: "3px 7px", borderRadius: "2px" }}
    >
      {c.label}
    </span>
  );
}

// ─── Gallery Card ─────────────────────────────────────────────────────────────

function Card({
  asset,
  size,
  hover: hoverLabels,
}: {
  asset: Asset;
  size:  Size;
  hover: { open: string; download: string; favorite: string };
}) {
  const [hovered, setHovered] = useState(false);
  const [fav, setFav]         = useState(asset.status === "favorite");

  const ratio   = size === "large" ? "4/5" : size === "medium" ? "5/6" : "16/10";
  const padMeta = size === "small" ? "p-2.5" : "p-4";
  const isText  = asset.type === "TEXT";

  return (
    <article
      className="group relative overflow-hidden rounded-sm transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
      style={{
        aspectRatio: ratio,
        background:  DARK,
        border:      "1px solid rgba(255,255,255,0.06)",
        boxShadow:   "0 2px 12px rgba(0,0,0,0.12)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Media frame */}
      <div className="absolute inset-0" style={{ background: asset.base }} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 280px 280px at ${asset.glowPos}, ${asset.glow}, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: size === "small" ? "16px 16px" : "24px 24px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)" }}
      />

      {/* Text-type editorial frame */}
      {isText && (
        <div
          className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-sm p-4"
          style={{
            background: "rgba(244,240,232,0.92)",
            border:     "1px solid rgba(255,255,255,0.12)",
            boxShadow:  "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          <p className="mb-2 font-mono text-[8px] tracking-[0.18em] uppercase" style={{ color: MUTED }}>Hook Preview</p>
          <p className="text-[13px] font-semibold leading-snug" style={{ color: INK, ...HL }}>
            &ldquo;Stop scrolling — this changes everything.&rdquo;
          </p>
          <div className="mt-3 h-px" style={{ background: STONE }} />
          <p className="mt-2 font-mono text-[9px] tracking-wide" style={{ color: MUTED }}>+ 4 more hooks</p>
        </div>
      )}

      {/* Top tags */}
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <span
          className="font-mono text-[8px] tracking-[0.16em] uppercase"
          style={{
            background: "rgba(0,0,0,0.55)",
            color:      "rgba(255,255,255,0.75)",
            padding:    "3px 7px",
            borderLeft: `2px solid ${asset.accent}`,
          }}
        >
          {asset.type}
        </span>
        {(asset.status === "processing" || asset.status === "failed") && (
          <StatusBadge status={asset.status} />
        )}
        {(fav || asset.status === "favorite") && asset.status !== "processing" && asset.status !== "failed" && (
          <span
            className="font-mono text-[8px] tracking-[0.14em] uppercase"
            style={{ background: "rgba(180,255,0,0.12)", color: ACCENT, padding: "3px 7px" }}
          >
            ★
          </span>
        )}
      </div>

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-200"
        style={{
          background: "rgba(0,0,0,0.62)",
          opacity:      hovered ? 1 : 0,
          pointerEvents: hovered ? "auto" : "none",
        }}
      >
        {([hoverLabels.open, hoverLabels.download, hoverLabels.favorite] as const).map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => { if (i === 2) setFav((v) => !v); }}
            className="min-w-[7.5rem] rounded-sm py-2 font-mono text-[10px] tracking-[0.14em] uppercase transition-transform hover:scale-[1.02]"
            style={{
              background: i === 0 ? ACCENT : "rgba(255,255,255,0.08)",
              color:      i === 0 ? DARK   : "rgba(255,255,255,0.90)",
              border:     i === 0 ? "none"  : "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bottom meta — stone strip */}
      <div
        className={`absolute bottom-0 left-0 right-0 ${padMeta}`}
        style={{
          background: "linear-gradient(0deg, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.75) 70%, transparent 100%)",
        }}
      >
        <p className="mb-0.5 truncate font-mono text-[9px] tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
          {asset.tool} · {asset.project}
        </p>
        <div className="flex items-end justify-between gap-2">
          <p
            className="truncate font-medium text-white"
            style={{ fontSize: size === "small" ? "12px" : "14px", ...HL }}
          >
            {asset.title}
          </p>
          <p className="shrink-0 font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            {asset.date}
          </p>
        </div>
      </div>
    </article>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex min-h-[280px] flex-col items-center justify-center rounded-sm px-8 py-16 text-center"
      style={{
        background: STONE2,
        border:     "1px solid rgba(26,24,20,0.10)",
        boxShadow:  "inset 0 1px 0 rgba(255,255,255,0.40)",
      }}
    >
      <div className="mb-4 h-px w-12" style={{ background: "rgba(26,24,20,0.15)" }} />
      <p className="max-w-sm text-[15px] font-medium leading-relaxed" style={{ color: INK, ...HL }}>
        {message}
      </p>
      <p className="mt-2 font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: MUTED }}>
        Mock · Preview
      </p>
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

  const visible = useMemo(
    () => sortAssets(filterAssets(ASSETS, filter), sort),
    [filter, sort],
  );

  const colMap: Record<Size, string> = {
    small:  "grid-cols-2 lg:grid-cols-4",
    medium: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    large:  "grid-cols-1 lg:grid-cols-2",
  };

  const gapMap: Record<Size, string> = {
    small:  "gap-2.5 md:gap-3",
    medium: "gap-4 md:gap-5",
    large:  "gap-5 md:gap-6",
  };

  const filterKeys = Object.keys(FILTER_IDS) as Filter[];
  const sortKeys   = ["newest", "oldest", "tool", "project", "status"] as Sort[];
  const sizeKeys   = ["small", "medium", "large"] as Size[];

  return (
    <div>
      {/* Header */}
      <p className="mb-4 font-mono text-[10px] tracking-[0.28em] uppercase" style={{ color: MUTED }}>
        {tg.overline}
      </p>
      <h2
        className="mb-3 text-3xl font-extrabold md:text-[2.75rem] md:leading-[1.05]"
        style={{ ...HL, letterSpacing: "-0.03em", color: INK }}
      >
        {tg.headline}
      </h2>
      <p className="mb-10 max-w-2xl text-[15px] leading-relaxed md:text-base" style={{ color: MUTED }}>
        {tg.subline}
      </p>

      {/* Filter bar */}
      <div
        className="mb-4 rounded-sm p-4 md:p-5"
        style={{ background: STONE2, border: "1px solid rgba(26,24,20,0.08)" }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="shrink-0 font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: MUTED }}>
            {tg.filterLabel}
          </p>
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: MUTED }}>
            {tg.assetsCount.replace("{count}", String(visible.length))}
          </p>
        </div>

        <div
          className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {filterKeys.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="shrink-0 rounded-sm px-3.5 py-2 font-mono text-[10px] tracking-[0.12em] uppercase transition-all"
                style={{
                  background: active ? ACCENT : "rgba(255,255,255,0.55)",
                  color:      active ? DARK   : MUTED,
                  border:     active ? "none"   : "1px solid rgba(26,24,20,0.06)",
                  fontWeight: active ? 600      : 400,
                }}
              >
                {tg.filters[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size + Sort controls */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <p className="shrink-0 font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: MUTED }}>
            {tg.sizeLabel}
          </p>
          <SegmentPills options={sizeKeys} value={size} onChange={setSize} labels={tg.sizes} />
        </div>

        <div className="flex items-center gap-3">
          <p className="shrink-0 font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: MUTED }}>
            {tg.sortLabel}
          </p>
          <div
            className="relative rounded-sm"
            style={{ background: STONE, border: "1px solid rgba(26,24,20,0.08)" }}
          >
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="cursor-pointer appearance-none bg-transparent py-2 pl-3 pr-8 font-mono text-[10px] tracking-[0.12em] uppercase outline-none"
              style={{ color: INK }}
            >
              {sortKeys.map((s) => (
                <option key={s} value={s}>{tg.sorts[s]}</option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px]"
              style={{ color: MUTED }}
            >
              ↓
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <EmptyState message={tg.empty} />
      ) : (
        <div className={`grid ${colMap[size]} ${gapMap[size]}`}>
          {visible.map((a) => (
            <Card key={a.id} asset={a} size={size} hover={tg.hover} />
          ))}
        </div>
      )}
    </div>
  );
}

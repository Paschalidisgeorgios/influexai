"use client";

/**
 * PreviewGallery — Studio output archive with filters, sorting & hover actions.
 *
 * ALL DATA IS MOCK. No API calls, no credits, no asset writes.
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

type FilterType = "all" | "images" | "videos" | "texts" | "campaigns" | "favorites" | "failed";
type SortType   = "newest" | "oldest" | "tool" | "project" | "status";
type SizeType   = "small" | "medium" | "large";
type AssetStatus = "done" | "processing" | "failed" | "favorite";

interface MockAsset {
  id:      string;
  type:    "IMAGE" | "VIDEO" | "TEXT" | "CAMPAIGN" | "AVATAR";
  filter:  FilterType;
  tool:    string;
  title:   string;
  date:    string;
  status:  AssetStatus;
  base:    string;
  glow:    string;
  glowPos: string;
}

// ─── MOCK gallery data ────────────────────────────────────────────────────────

// All CSS gradient frames — no external images
const MOCK_ASSETS: MockAsset[] = [
  {
    id:      "a1",
    type:    "IMAGE",
    filter:  "images",
    tool:    "Image Generator",
    title:   "Product Campaign — Nike Air",
    date:    "16 Jun 2026",
    status:  "done",
    base:    "linear-gradient(145deg, #0a0a18 0%, #12122a 100%)",
    glow:    "rgba(100,80,255,0.28)",
    glowPos: "70% 25%",
  },
  {
    id:      "a2",
    type:    "VIDEO",
    filter:  "videos",
    tool:    "Image to Video",
    title:   "TikTok Ad — Fitness Brand",
    date:    "15 Jun 2026",
    status:  "done",
    base:    "linear-gradient(145deg, #081209 0%, #0e1c0e 100%)",
    glow:    "rgba(120,225,40,0.22)",
    glowPos: "30% 65%",
  },
  {
    id:      "a3",
    type:    "TEXT",
    filter:  "texts",
    tool:    "Viral Hook",
    title:   "5 Hooks — Beauty Campaign",
    date:    "14 Jun 2026",
    status:  "favorite",
    base:    "linear-gradient(145deg, #160a0a 0%, #200e0e 100%)",
    glow:    "rgba(255,70,70,0.20)",
    glowPos: "70% 30%",
  },
  {
    id:      "a4",
    type:    "CAMPAIGN",
    filter:  "campaigns",
    tool:    "Campaign Agent",
    title:   "Full Campaign — Q2 Relaunch",
    date:    "13 Jun 2026",
    status:  "done",
    base:    "linear-gradient(145deg, #080e16 0%, #0c1422 100%)",
    glow:    "rgba(50,120,255,0.22)",
    glowPos: "25% 60%",
  },
  {
    id:      "a5",
    type:    "AVATAR",
    filter:  "videos",
    tool:    "Talking Avatar",
    title:   "Founder Story — Avatar",
    date:    "12 Jun 2026",
    status:  "done",
    base:    "linear-gradient(145deg, #0a0c12 0%, #0e1018 100%)",
    glow:    "rgba(80,140,255,0.20)",
    glowPos: "65% 35%",
  },
  {
    id:      "a6",
    type:    "IMAGE",
    filter:  "images",
    tool:    "Product Shot",
    title:   "Luxury Brand Assets — Q2",
    date:    "11 Jun 2026",
    status:  "favorite",
    base:    "linear-gradient(145deg, #120e07 0%, #1c1409 100%)",
    glow:    "rgba(255,160,40,0.20)",
    glowPos: "30% 70%",
  },
  {
    id:      "a7",
    type:    "VIDEO",
    filter:  "videos",
    tool:    "Reel Generator",
    title:   "Instagram Reel — Restaurant",
    date:    "10 Jun 2026",
    status:  "processing",
    base:    "linear-gradient(145deg, #0e0814 0%, #140c1c 100%)",
    glow:    "rgba(180,100,255,0.20)",
    glowPos: "60% 40%",
  },
  {
    id:      "a8",
    type:    "TEXT",
    filter:  "texts",
    tool:    "Content Calendar",
    title:   "7-Tage Kalender — Fitness",
    date:    "09 Jun 2026",
    status:  "done",
    base:    "linear-gradient(145deg, #080e12 0%, #0c1418 100%)",
    glow:    "rgba(40,180,220,0.18)",
    glowPos: "40% 60%",
  },
  {
    id:      "a9",
    type:    "IMAGE",
    filter:  "images",
    tool:    "Image Generator",
    title:   "UGC Shot — Coffee Brand",
    date:    "08 Jun 2026",
    status:  "failed",
    base:    "linear-gradient(145deg, #0e0a0a 0%, #180e0e 100%)",
    glow:    "rgba(200,80,40,0.18)",
    glowPos: "50% 50%",
  },
];

// ─── Filter config ────────────────────────────────────────────────────────────

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all",       label: "Alle"        },
  { id: "images",    label: "Bilder"      },
  { id: "videos",    label: "Videos"      },
  { id: "texts",     label: "Texte"       },
  { id: "campaigns", label: "Kampagnen"   },
  { id: "favorites", label: "Favoriten"   },
  { id: "failed",    label: "Fehler"      },
];

const SORTS: { id: SortType; label: string }[] = [
  { id: "newest",  label: "Neueste"   },
  { id: "oldest",  label: "Älteste"   },
  { id: "tool",    label: "Tool"      },
  { id: "project", label: "Projekt"   },
  { id: "status",  label: "Status"    },
];

// ─── Status indicator ─────────────────────────────────────────────────────────

function StatusDot({ status }: { status: AssetStatus }) {
  const colors: Record<AssetStatus, string> = {
    done:       "rgba(180,255,0,0.7)",
    processing: "rgba(255,180,40,0.7)",
    failed:     "rgba(255,60,60,0.7)",
    favorite:   "rgba(255,255,255,0.4)",
  };
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: colors[status] }}
    />
  );
}

// ─── Gallery Card ─────────────────────────────────────────────────────────────

function GalleryCard({
  asset,
  size,
}: {
  asset: MockAsset;
  size:  SizeType;
}) {
  const [hovered, setHovered] = useState(false);

  const aspectRatio = size === "small" ? "16/9" : size === "medium" ? "4/5" : "1/1";

  return (
    <div
      className="group relative cursor-pointer overflow-hidden border border-white/[0.04] transition-colors hover:border-white/[0.10]"
      style={{ aspectRatio }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* CSS gradient base — no external images */}
      <div className="absolute inset-0" style={{ background: asset.base }} />
      <div className="pointer-events-none absolute inset-0" style={{
        background: `radial-gradient(ellipse 250px 250px at ${asset.glowPos}, ${asset.glow}, transparent)`,
      }} />
      <div className="pointer-events-none absolute inset-0 opacity-35" style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      {/* Hover overlay — mock actions */}
      {hovered && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          {["Öffnen", "Download", "Favorit"].map((action) => (
            <button
              key={action}
              type="button"
              className="w-28 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase transition-all"
              style={{
                background: action === "Öffnen" ? ACCENT : "rgba(255,255,255,0.08)",
                color:      action === "Öffnen" ? "#000" : "#fff",
                border:     action === "Öffnen" ? "none" : "1px solid rgba(255,255,255,0.10)",
              }}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Type tag + processing badge */}
      <div className="absolute left-0 top-0 flex items-center gap-2 p-3">
        <span className="font-mono text-[8px] tracking-widest uppercase"
              style={{
                background: "rgba(0,0,0,0.45)",
                color: "rgba(255,255,255,0.5)",
                padding: "2px 6px",
              }}>
          {asset.type}
        </span>
        {asset.status === "processing" && (
          <span className="font-mono text-[8px] tracking-widest uppercase"
                style={{ background: "rgba(255,180,40,0.15)", color: "rgba(255,180,40,0.8)", padding: "2px 6px" }}>
            Processing
          </span>
        )}
        {asset.status === "failed" && (
          <span className="font-mono text-[8px] tracking-widest uppercase"
                style={{ background: "rgba(255,60,60,0.15)", color: "rgba(255,60,60,0.8)", padding: "2px 6px" }}>
            Fehler
          </span>
        )}
      </div>

      {/* Bottom label */}
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
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeSort,   setActiveSort  ] = useState<SortType>("newest");
  const [activeSize,   setActiveSize  ] = useState<SizeType>("medium");

  const filtered = MOCK_ASSETS.filter((a) => {
    if (activeFilter === "all")       return true;
    if (activeFilter === "favorites") return a.status === "favorite";
    if (activeFilter === "failed")    return a.status === "failed";
    return a.filter === activeFilter;
  });

  const colsMap: Record<SizeType, string> = {
    small:  "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    medium: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    large:  "grid-cols-1 md:grid-cols-2",
  };

  return (
    <div className="pb-24 pt-10 md:pt-16">
      {/* Header */}
      <p className="mb-5 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
        Campaign Assets · Mock
      </p>
      <h2
        className="mb-10 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl"
        style={{ ...HEADLINE_FONT, letterSpacing: "-0.03em" }}
      >
        Studio
        <br />
        Gallery.
      </h2>

      {/* Filter + Sort + Size bar */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        {/* Filters — horizontal scroll on mobile */}
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveFilter(id)}
              className="shrink-0 px-3.5 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase transition-all"
              style={{
                background: activeFilter === id ? ACCENT       : "rgba(255,255,255,0.04)",
                color:      activeFilter === id ? DARK_TEXT     : "rgba(255,255,255,0.40)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort + Size */}
        <div className="flex shrink-0 items-center gap-4">
          <select
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value as SortType)}
            className="bg-transparent font-mono text-[10px] tracking-widest uppercase text-neutral-600 outline-none"
          >
            {SORTS.map(({ id, label }) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>

          {/* Size selector */}
          <div className="flex gap-1">
            {(["small", "medium", "large"] as SizeType[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setActiveSize(s)}
                className="h-6 w-6 transition-colors"
                style={{
                  background: activeSize === s ? "rgba(255,255,255,0.10)" : "transparent",
                  border: activeSize === s ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.04)",
                }}
                title={s}
              >
                <span className="block h-full w-full flex items-center justify-center">
                  <span
                    className="block"
                    style={{
                      background: "rgba(255,255,255,0.30)",
                      width:  s === "small" ? "8px"  : s === "medium" ? "10px" : "12px",
                      height: s === "small" ? "6px"  : s === "medium" ? "8px"  : "12px",
                    }}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Count */}
      <p className="mb-5 font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-700">
        {filtered.length} Assets
      </p>

      {/* Gallery grid */}
      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center border border-white/[0.04]">
          <p className="text-[14px] text-neutral-700">Keine Assets in dieser Kategorie.</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${colsMap[activeSize]}`}>
          {filtered.map((asset) => (
            <GalleryCard key={asset.id} asset={asset} size={activeSize} />
          ))}
        </div>
      )}
    </div>
  );
}

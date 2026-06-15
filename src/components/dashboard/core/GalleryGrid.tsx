"use client";

/**
 * GalleryGrid — Krea-style asset gallery.
 *
 * Drei Card-Typen: image · video · text
 * Skeleton-Shimmer während isLoading
 * Hover: Overlay + Prompt + Copy + Maximize
 * Vollbild-Modal (Escape / Klick-außen)
 */

import {
  useState,
  useRef,
  useCallback,
  memo,
  type MouseEvent,
} from "react";
import { Copy, Maximize2, Check, RotateCcw, Trash2 } from "lucide-react";
import { AssetModal } from "./AssetModal";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface GalleryItem {
  id: string;
  type: "text" | "image" | "video";
  url?: string;
  content?: string;
  prompt: string;
  tool: string;
  createdAt: string;
}

// ─── Dummy / initial data (exported so DashboardLayout can seed its state) ───

export const INITIAL_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "d1",
    type: "image",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    prompt: "Futuristic fashion model, neon-lit studio, ultra cinematic",
    tool: "Bild-Generator",
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: "d2",
    type: "text",
    prompt: "5 virale Hooks Nische Fitness – energetisch",
    content:
      "1. »Ich habe 30 Tage lang täglich 5 Minuten trainiert – das passierte wirklich.«\n\n" +
      "2. »Vergiss das Gym. Diese 3 Bewegungen verändern deinen Körper.«\n\n" +
      "3. »Kein Protein, kein Equipment, keine Ausreden – nur Ergebnisse.«\n\n" +
      "4. »Was Personal Trainer dir nie sagen würden.«\n\n" +
      "5. »Dein Körper verändert sich in 21 Tagen – hier ist der Beweis.«",
    tool: "Viral Hook",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "d3",
    type: "video",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    prompt: "UGC product demo – clean white background, upbeat energy",
    tool: "UGC Video",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "d4",
    type: "image",
    url: "https://images.unsplash.com/photo-1680016861993-f7b7a63e52ab?w=800&q=80",
    prompt: "Minimalist product shot, matte black surface, soft side lighting",
    tool: "Bild-Generator",
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: "d5",
    type: "text",
    prompt: "7-Tage Content-Kalender SaaS – LinkedIn & TikTok",
    content:
      "Mo: Behind-the-scenes unserer Entwicklung\n" +
      "Di: »3 Fehler, die SaaS-Gründer machen« – Hook-Video\n" +
      "Mi: Kundenerfolg-Story (Testimonial-Format)\n" +
      "Do: Tutorial – Top-Feature in 60 Sekunden\n" +
      "Fr: Trend-Reaktion + Meinung des Teams\n" +
      "Sa: Wiederverwendung bester Kommentare\n" +
      "So: Teaser für nächste Woche",
    tool: "Content Kalender",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "d6",
    type: "video",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    prompt: "Dynamic brand reveal – speed ramp, bold typography, dark mood",
    tool: "UGC Video",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-white/4 bg-neutral-950/50 aspect-square" />
  );
}

// ─── useCopy ──────────────────────────────────────────────────────────────────

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text).catch(() => {});
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    },
    [text],
  );

  return { copied, copy };
}

// ─── Action Buttons (top-right, visible on hover) ─────────────────────────────

interface CardActionsProps {
  item: GalleryItem;
  onMaximize: (e: MouseEvent<HTMLButtonElement>) => void;
  onRePrompt: (prompt: string, tool: string) => void;
  onDelete: (id: string) => void;
}

function CardActions({ item, onMaximize, onRePrompt, onDelete }: CardActionsProps) {
  // Smart copy: text → content, image/video → url ?? prompt
  const copyText = item.type === "text"
    ? (item.content ?? item.prompt)
    : (item.url ?? item.prompt);

  const { copied, copy } = useCopy(copyText);

  // Flaches, dezentes Button-Design — kein schwerer Container
  const base =
    "flex items-center justify-center p-1.5 rounded border border-white/5 bg-black/40 backdrop-blur-md text-neutral-400 transition-colors";

  return (
    <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">

      {/* Re-Prompt — Lime-Highlight */}
      <button
        type="button"
        title="In Agent Box laden"
        aria-label="In Agent Box laden"
        className={`${base} hover:text-[#ccff00]`}
        onClick={(e) => {
          e.stopPropagation();
          onRePrompt(item.prompt, item.tool);
        }}
      >
        <RotateCcw size={11} />
      </button>

      {/* Copy */}
      <button
        type="button"
        title="Kopieren"
        className={`${base} hover:text-white`}
        onClick={copy}
      >
        {copied
          ? <Check size={11} className="text-green-400" />
          : <Copy size={11} />}
      </button>

      {/* Maximize */}
      <button
        type="button"
        title="Vollbild"
        className={`${base} hover:text-white`}
        onClick={onMaximize}
      >
        <Maximize2 size={11} />
      </button>

      {/* Delete */}
      <button
        type="button"
        title="Löschen"
        className={`${base} hover:text-red-400`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

// ─── Card variants ────────────────────────────────────────────────────────────

const CARD_BASE =
  "bg-neutral-950/20 border border-white/5 rounded-lg overflow-hidden group relative aspect-square transition-all duration-300 hover:border-white/10 hover:bg-neutral-950/40 cursor-pointer";

// Shared bottom overlay (image + video) — sanfter Gradient
function PromptOverlay({ prompt }: { prompt: string }) {
  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
      <p className="px-3 pb-3 pt-6 text-[11px] text-neutral-300 line-clamp-2 font-sans tracking-wide">
        {prompt}
      </p>
    </div>
  );
}

interface CardProps {
  item: GalleryItem;
  onMaximize: (item: GalleryItem) => void;
  onRePrompt: (prompt: string, tool: string) => void;
  onDelete: (id: string) => void;
}

function ImageCard({ item, onMaximize, onRePrompt, onDelete }: CardProps) {
  const handleMax = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onMaximize(item); },
    [item, onMaximize],
  );

  return (
    <div className={CARD_BASE} onClick={() => onMaximize(item)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.url}
        alt={item.prompt}
        loading="lazy"
        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <PromptOverlay prompt={item.prompt} />
      <CardActions item={item} onMaximize={handleMax} onRePrompt={onRePrompt} onDelete={onDelete} />
    </div>
  );
}

function VideoCard({ item, onMaximize, onRePrompt, onDelete }: CardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMax = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onMaximize(item); },
    [item, onMaximize],
  );

  return (
    <div
      className={CARD_BASE}
      onClick={() => onMaximize(item)}
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
    >
      <video ref={videoRef} src={item.url} muted loop playsInline preload="metadata"
        className="object-cover w-full h-full" />
      <PromptOverlay prompt={item.prompt} />
      <CardActions item={item} onMaximize={handleMax} onRePrompt={onRePrompt} onDelete={onDelete} />
    </div>
  );
}

function TextCard({ item, onMaximize, onRePrompt, onDelete }: CardProps) {
  const handleMax = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onMaximize(item); },
    [item, onMaximize],
  );

  return (
    <div className={CARD_BASE} onClick={() => onMaximize(item)}>
      <div className="bg-[#0b0b0b] p-4 h-full flex flex-col justify-between border border-white/5 rounded-lg">
        {/* Tool-Label — ultra-dezent, Mono */}
        <div className="min-h-0 overflow-hidden">
          <p className="mb-2.5 text-[10px] font-mono tracking-widest uppercase text-neutral-500">
            {item.tool}
          </p>
          {/* Content-Vorschau — edle Sans-Schrift */}
          <p className="font-sans text-[11px] text-neutral-400 tracking-wide leading-relaxed line-clamp-[7] whitespace-pre-line">
            {item.content ?? item.prompt}
          </p>
        </div>
        <div className="mt-3 pt-2 text-[9px] text-neutral-600 font-mono"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {new Date(item.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      <CardActions item={item} onMaximize={handleMax} onRePrompt={onRePrompt} onDelete={onDelete} />
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export interface GalleryGridProps {
  assets: GalleryItem[];
  isLoading: boolean;
  /** Setzt den Prompt zurück in die Agent Box */
  onRePrompt: (prompt: string, tool: string) => void;
  /** Löscht ein Asset aus der Galerie */
  onDeleteAsset: (id: string) => void;
}

export const GalleryGrid = memo(function GalleryGrid({
  assets,
  isLoading,
  onRePrompt,
  onDeleteAsset,
}: GalleryGridProps) {
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);

  const handleMaximize = useCallback((item: GalleryItem) => setActiveItem(item), []);
  const handleClose    = useCallback(() => setActiveItem(null), []);

  const sharedProps = { onMaximize: handleMaximize, onRePrompt, onDelete: onDeleteAsset };

  return (
    <>
      <section className="mt-8 w-full">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/20">
            Zuletzt generiert
          </p>
          {!isLoading && (
            <span className="text-[11px] text-white/16">{assets.length} Assets</span>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : assets.map((item) =>
                item.type === "image" ? (
                  <ImageCard key={item.id} item={item} {...sharedProps} />
                ) : item.type === "video" ? (
                  <VideoCard key={item.id} item={item} {...sharedProps} />
                ) : (
                  <TextCard key={item.id} item={item} {...sharedProps} />
                ),
              )}
        </div>
      </section>

      <AssetModal item={activeItem} onClose={handleClose} />
    </>
  );
});

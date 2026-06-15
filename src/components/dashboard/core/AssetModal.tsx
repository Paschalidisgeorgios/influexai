"use client";

/**
 * AssetModal — kinoreifes Vollbild-Modal für Galerie-Assets.
 *
 * Layout: Backdrop · linker Medien-Bereich (70%) · rechtes Meta-Panel (30%)
 * Animation: scale-in + backdrop-blur via Framer Motion
 * Keyboard: Escape schließt
 */

import { useEffect, useRef, useCallback, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Calendar, Wrench } from "lucide-react";
import type { GalleryItem } from "./GalleryGrid";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AssetModalProps {
  item: GalleryItem | null;
  onClose: () => void;
}

// ─── useCopy ──────────────────────────────────────────────────────────────────

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return { copied, copy };
}

// ─── Media pane ───────────────────────────────────────────────────────────────

function MediaPane({ item }: { item: GalleryItem }) {
  if (item.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={item.prompt}
        className="max-w-full max-h-full object-contain rounded-lg"
        draggable={false}
      />
    );
  }

  if (item.type === "video") {
    return (
      <video
        src={item.url}
        controls
        autoPlay
        loop
        playsInline
        className="max-w-full max-h-full object-contain rounded-lg"
      />
    );
  }

  // text
  return (
    <div
      className="w-full h-full overflow-y-auto rounded-xl border p-6"
      style={{
        background: "rgba(255,255,255,0.025)",
        borderColor: "rgba(255,255,255,0.06)",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.08) transparent",
      }}
    >
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-200">
        {item.content ?? item.prompt}
      </pre>
    </div>
  );
}

// ─── Meta panel ───────────────────────────────────────────────────────────────

function MetaPanel({
  item,
  onClose,
}: {
  item: GalleryItem;
  onClose: () => void;
}) {
  const { copied: promptCopied, copy: copyPrompt } = useCopy(item.prompt);
  const { copied: contentCopied, copy: copyContent } = useCopy(
    item.content ?? item.url ?? item.prompt
  );

  const formattedDate = new Date(item.createdAt).toLocaleString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="flex h-full w-full flex-col justify-between p-6"
      style={{ background: "#111" }}
    >
      {/* ── Top ─────────────────────────────────────────────────────────── */}
      <div>
        {/* Close + tool badge row */}
        <div className="mb-5 flex items-start justify-between">
          {/* Tool badge */}
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs"
            style={{
              background: "rgba(99,102,241,0.10)",
              border: "1px solid rgba(99,102,241,0.20)",
              color: "#818cf8",
            }}
          >
            <Wrench size={10} />
            {item.tool}
          </span>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Prompt section ─────────────────────────────────────────── */}
        <div className="mb-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">
            Eingabe-Prompt
          </p>
          <div
            className="group relative rounded-lg p-3"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="select-all text-xs leading-relaxed text-neutral-400">
              {item.prompt}
            </p>
            {/* Copy prompt button */}
            <button
              type="button"
              onClick={copyPrompt}
              title="Prompt kopieren"
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg opacity-0 transition-all group-hover:opacity-100"
              style={{
                background: "rgba(0,0,0,0.60)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: promptCopied ? "#86efac" : "rgba(255,255,255,0.50)",
              }}
            >
              {promptCopied ? <Check size={10} /> : <Copy size={10} />}
            </button>
          </div>
        </div>

        {/* ── Content preview (text assets only) ─────────────────────── */}
        {item.type === "text" && item.content && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">
              Generierter Text
            </p>
            <div
              className="relative rounded-lg p-3"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-xs leading-relaxed text-neutral-500 line-clamp-4">
                {item.content}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Copy asset button */}
        <button
          type="button"
          onClick={copyContent}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium transition-all hover:brightness-110"
          style={{
            background: contentCopied
              ? "rgba(134,239,172,0.10)"
              : "rgba(99,102,241,0.12)",
            border: contentCopied
              ? "1px solid rgba(134,239,172,0.25)"
              : "1px solid rgba(99,102,241,0.25)",
            color: contentCopied ? "#86efac" : "#a5b4fc",
          }}
        >
          {contentCopied ? (
            <>
              <Check size={12} />
              Kopiert!
            </>
          ) : (
            <>
              <Copy size={12} />
              {item.type === "text" ? "Text kopieren" : "URL kopieren"}
            </>
          )}
        </button>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-[10px] text-white/18">
          <Calendar size={10} className="shrink-0" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export const AssetModal = memo(function AssetModal({
  item,
  onClose,
}: AssetModalProps) {
  // Escape-Key
  useEffect(() => {
    if (!item) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [item]);

  return (
    <AnimatePresence>
      {item && (
        /* ── Backdrop ────────────────────────────────────────────────── */
        <motion.div
          key="modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          style={{ background: "rgba(0,0,0,0.82)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          {/* Blur layer — separate so scale doesn't fight blur */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
          />

          {/* ── Modal window ─────────────────────────────────────────── */}
          <motion.div
            key="modal-window"
            className="relative z-10 flex w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl"
            style={{
              height: "80vh",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.20, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left — media (70%) */}
            <div
              className="relative flex h-full flex-1 items-center justify-center p-6"
              style={{ background: "#0a0a0a", minWidth: 0 }}
            >
              <MediaPane item={item} />
            </div>

            {/* Right — meta panel (30%, min 220px, max 300px) */}
            <div
              className="h-full shrink-0"
              style={{
                width: "clamp(220px, 30%, 300px)",
                borderLeft: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <MetaPanel item={item} onClose={onClose} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

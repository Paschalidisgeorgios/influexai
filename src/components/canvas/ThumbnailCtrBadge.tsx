"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { ThumbnailCtrEntry } from "@/lib/canvas/thumbnail-ctr-store";

type Props = {
  entry?: ThumbnailCtrEntry;
};

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${Math.round(delta)}%`;
}

function ThumbnailCtrBadgeComponent({ entry }: Props) {
  if (!entry) return null;

  if (entry.analyzing) {
    return (
      <div className="thumbnail-ctr-badge pointer-events-none absolute left-2 top-2 z-20">
        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700/60 bg-black/70 px-2 py-1 text-[9px] text-zinc-400 backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ccff00]" />
          CTR-Analyse…
        </span>
      </div>
    );
  }

  const positive = entry.deltaPercent >= 0;
  const compareNote =
    entry.compareDelta !== undefined && entry.compareReason
      ? entry.isWinner
        ? ` · A/B +${Math.round(Math.abs(entry.compareDelta))}%`
        : ` · A/B ${formatDelta(entry.compareDelta)}`
      : "";

  const highlight = entry.highlights[0] ?? "CTR-Bewertung";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="thumbnail-ctr-badge pointer-events-none absolute left-2 top-2 z-20 max-w-[92%]"
    >
      <div
        className={`rounded-full border px-2.5 py-1 text-[9px] font-medium leading-tight backdrop-blur-xl ${
          positive
            ? "border-[#ccff00]/35 bg-[#ccff00]/10 text-[#ccff00]"
            : "border-amber-500/30 bg-amber-500/10 text-amber-300"
        }`}
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.45)" }}
      >
        <span className="font-mono font-bold">CTR-Rating: {formatDelta(entry.deltaPercent)}</span>
        <span className="text-zinc-400"> durch {highlight}</span>
        {compareNote ? <span className="text-zinc-500">{compareNote}</span> : null}
      </div>
    </motion.div>
  );
}

export const ThumbnailCtrBadge = memo(ThumbnailCtrBadgeComponent);

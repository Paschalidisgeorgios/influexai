"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Clapperboard, Sparkles } from "lucide-react";
import { useCanvasStore, type BrollRecommendNodeData } from "@/lib/canvas/canvas-store";

function BrollRecommendNodeComponent({
  id,
  data,
}: NodeProps<Node<BrollRecommendNodeData, "brollRecommend">>) {
  const spawnVideoFromBroll = useCanvasStore((s) => s.spawnVideoFromBroll);

  const { match, segmentLabel, sourceAssetId } = data;
  const similarityPct = Math.round(match.similarity * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="broll-recommend-node w-[min(280px,82vw)] rounded-2xl border border-zinc-800/40 bg-zinc-950/40 p-3 shadow-2xl backdrop-blur-2xl"
      style={{
        boxShadow:
          "0 0 32px rgba(204,255,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !bg-[#ccff00]/60" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !bg-[#ccff00]/40" />

      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#ccff00]/10 text-[#ccff00]">
          <Clapperboard size={13} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#ccff00]/80">
            B-Roll Matcher
          </p>
          <p className="truncate text-[11px] font-medium text-zinc-300">{segmentLabel}</p>
        </div>
        <span className="rounded-full border border-[#ccff00]/25 bg-[#ccff00]/8 px-2 py-0.5 font-mono text-[10px] text-[#ccff00]">
          {similarityPct}%
        </span>
      </div>

      <p className="mb-2 line-clamp-3 text-[10px] leading-relaxed text-zinc-500">
        {match.scriptSegment}
      </p>

      <p className="mb-3 rounded-lg border border-zinc-800/50 bg-black/30 px-2 py-1.5 text-[10px] leading-snug text-zinc-300">
        {match.visualPrompt}
      </p>

      <div className="mb-3 flex flex-wrap gap-1">
        {match.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-zinc-800/60 bg-zinc-900/50 px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-zinc-500"
          >
            {tag}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => spawnVideoFromBroll(sourceAssetId, match, id)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#ccff00]/30 bg-[#ccff00]/10 py-2 text-[10px] font-bold uppercase tracking-wide text-[#ccff00] transition hover:bg-[#ccff00]/18"
      >
        <Sparkles size={12} />
        Video-Node starten
      </button>
    </motion.div>
  );
}

export const BrollRecommendNode = memo(BrollRecommendNodeComponent);

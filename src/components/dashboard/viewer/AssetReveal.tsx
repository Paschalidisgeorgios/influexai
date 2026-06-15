"use client";

/**
 * AssetReveal — zeigt generierte Medien (Bild, Video, Text) an.
 *
 * WICHTIG: Bilder werden mit <img> gerendert, nicht <video>.
 * Die previewUrl zeigt auf /api/generated-image/[id]?variant=preview
 */

import { motion } from "framer-motion";
import type { AssetNodeData } from "@/lib/canvas/canvas-store";

interface Props {
  nodeData: AssetNodeData;
}

export function AssetReveal({ nodeData }: Props) {
  const { outputType, previewUrl, url, text } = nodeData;

  if (outputType === "image" && previewUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="overflow-hidden rounded-xl border border-zinc-800/60 bg-black/10"
      >
        <img
          src={previewUrl}
          alt={nodeData.sourcePrompt ?? "Generiertes Bild"}
          className="h-auto w-full object-contain"
          loading="lazy"
        />
      </motion.div>
    );
  }

  if (outputType === "video" && (previewUrl ?? url)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="overflow-hidden rounded-xl border border-zinc-800/60 bg-black"
      >
        <video
          src={previewUrl ?? url}
          controls
          autoPlay
          loop
          muted
          playsInline
          className="h-auto w-full"
        />
      </motion.div>
    );
  }

  if ((outputType === "text" || outputType === "script" || outputType === "calendar") && text) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-zinc-800/40 bg-zinc-900/50 p-4"
      >
        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-200">
          {text}
        </pre>
      </motion.div>
    );
  }

  return null;
}

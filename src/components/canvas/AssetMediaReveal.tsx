"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  AssetLoadingShader,
  accentForOutputType,
} from "./AssetLoadingShader";
import type { AssetNodeData } from "@/lib/canvas/canvas-store";
import { AssetErrorState } from "./AssetErrorState";

type AssetMediaRevealProps = {
  nodeData: AssetNodeData;
  accent: string;
  accentRgb: string;
  isLoading: boolean;
  justCompleted: boolean;
  onErrorDismiss?: () => void;
};

function AssetMediaRevealComponent({
  nodeData,
  accent,
  accentRgb,
  isLoading,
  justCompleted,
  onErrorDismiss,
}: AssetMediaRevealProps) {
  const progress = nodeData.progress ?? 0;
  const shaderAccent = accentForOutputType(nodeData.outputType);
  const isVisual =
    nodeData.outputType === "image" ||
    nodeData.outputType === "video" ||
    nodeData.outputType === "audio";

  if (isLoading) {
    return (
      <AssetLoadingShader
        progress={progress}
        label={
          nodeData.status === "processing" ? "Processing" : "Rendering"
        }
        accent={shaderAccent}
        className={isVisual ? "aspect-video w-full" : "min-h-[160px] w-full"}
      />
    );
  }

  if (nodeData.status === "error") {
    return (
      <AssetErrorState
        message={
          nodeData.errorMessage ??
          "Generierung fehlgeschlagen — Deine Coins wurden erstattet."
        }
        accent={accent}
        onDismiss={onErrorDismiss}
      />
    );
  }

  const revealVariants = {
    hidden: { opacity: 0, scale: 0.97 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <motion.div
      initial={justCompleted ? "hidden" : false}
      animate="visible"
      variants={revealVariants}
      className="relative"
    >
      {justCompleted ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 rounded-lg"
          initial={{ opacity: 0.85, boxShadow: `0 0 0 2px ${accent}` }}
          animate={{ opacity: 0, boxShadow: `0 0 0 0px transparent` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{
            boxShadow: `0 0 24px rgba(${accentRgb}, 0.45), inset 0 0 20px rgba(${accentRgb}, 0.12)`,
          }}
          aria-hidden
        />
      ) : null}

      {nodeData.outputType === "text" || nodeData.outputType === "agent" ? (
        <pre className="max-h-[200px] overflow-auto rounded-lg bg-black/50 p-3 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-zinc-300">
          {nodeData.text}
        </pre>
      ) : null}

      {nodeData.outputType === "image" && nodeData.previewUrl ? (
        <div className="overflow-hidden rounded-lg border border-zinc-800/60">
          <video
            src={nodeData.previewUrl}
            className="aspect-video w-full object-cover"
            muted
            loop
            autoPlay
            playsInline
          />
        </div>
      ) : null}

      {nodeData.outputType === "video" && nodeData.url ? (
        <video
          src={nodeData.url}
          className="w-full rounded-lg"
          controls
          playsInline
        />
      ) : null}

      {nodeData.outputType === "audio" ? (
        <div className="flex h-16 items-end gap-0.5 rounded-lg bg-black/40 px-3 py-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-violet-500/60"
              style={{ height: `${20 + Math.sin(i * 0.8) * 18 + 20}%` }}
            />
          ))}
        </div>
      ) : null}

      {nodeData.outputType === "calendar" ? (
        <div className="grid grid-cols-7 gap-1 rounded-lg bg-black/40 p-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded border border-zinc-800/60 bg-zinc-900/40 text-[8px] text-zinc-600"
            >
              {i + 1}
            </div>
          ))}
        </div>
      ) : null}

      {nodeData.outputType === "train" ? (
        <p className="text-xs text-zinc-400">
          Training gestartet — Modell wird vorbereitet.
        </p>
      ) : null}
    </motion.div>
  );
}

export const AssetMediaReveal = memo(AssetMediaRevealComponent);

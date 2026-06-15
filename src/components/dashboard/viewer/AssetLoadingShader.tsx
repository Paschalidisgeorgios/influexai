"use client";

import { motion } from "framer-motion";

interface Props {
  progress?: number;
  label?: string;
  accent?: string;
  className?: string;
}

export function AssetLoadingShader({ progress, label, accent, className }: Props) {
  const glowColor = accent ?? "#ccff00";
  return (
    <div className={`flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-4 rounded-xl border border-zinc-800/40 bg-zinc-950/60 ${className ?? ""}`}>
      {/* Shader animation */}
      <div className="relative h-16 w-16">
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: `${glowColor}33` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-r-transparent border-b-transparent border-l-transparent"
          style={{ borderTopColor: glowColor }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-[#ccff00]/60" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-xs font-medium text-zinc-300">
          {label ?? "Generiert…"}
        </p>
        {typeof progress === "number" && progress > 0 ? (
          <p className="font-mono text-xs text-zinc-500">{progress}%</p>
        ) : null}
      </div>
    </div>
  );
}

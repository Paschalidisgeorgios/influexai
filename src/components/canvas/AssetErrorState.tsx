"use client";

import { memo } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

type AssetErrorStateProps = {
  message: string;
  accent: string;
  onDismiss?: () => void;
};

function AssetErrorStateComponent({ message, accent, onDismiss }: AssetErrorStateProps) {
  return (
    <div
      className="asset-error-state flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border border-red-500/25 bg-red-950/20 px-4 py-5 text-center backdrop-blur-sm"
      role="alert"
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10"
        style={{ boxShadow: `0 0 20px rgba(239,68,68,0.15)` }}
      >
        <AlertTriangle className="h-4 w-4 text-red-400" strokeWidth={1.75} />
      </div>
      <p className="max-w-[240px] text-[11px] font-medium leading-relaxed text-red-200/90">
        {message}
      </p>
      <p className="text-[9px] text-zinc-600">
        Coins wurden nicht belastet bzw. sofort erstattet.
      </p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-1 inline-flex items-center gap-1 rounded-md border border-zinc-800/70 px-2.5 py-1 text-[9px] font-medium text-zinc-400 transition-colors hover:text-zinc-200"
          style={{ borderColor: `rgba(${accent === "#B7FF00" ? "183,255,0" : "255,255,255"}, 0.12)` }}
        >
          <RotateCcw className="h-3 w-3" />
          Schließen
        </button>
      ) : null}
    </div>
  );
}

export const AssetErrorState = memo(AssetErrorStateComponent);

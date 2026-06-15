"use client";

import { AlertTriangle } from "lucide-react";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function AssetErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-red-900/30 bg-red-950/10 p-6">
      <AlertTriangle size={24} className="text-red-400" />
      <div className="text-center">
        <p className="text-sm font-medium text-red-300">Generierung fehlgeschlagen</p>
        {message ? (
          <p className="mt-1 text-xs text-red-400/70">{message}</p>
        ) : null}
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-900/40 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-950/30"
        >
          Erneut versuchen
        </button>
      ) : null}
    </div>
  );
}

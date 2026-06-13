"use client";

import { useCallback, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { glassInputClass } from "@/lib/glass-classes";

export const AGENT_AI_MODEL_OPTIONS = [
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "flux-1-dev", label: "Flux.1 Dev" },
  { value: "kling-v1.5", label: "Kling AI v1.5" },
  { value: "seedance-v2", label: "Seedance v2.0" },
] as const;

type AgentAutopilotNodeExtrasProps = {
  aiModel: string;
  referenceImage?: string;
  referenceImageName?: string;
  accent: string;
  onModelChange: (model: string) => void;
  onReferenceImageChange: (dataUrl: string | undefined, fileName?: string) => void;
};

export function AgentAutopilotNodeExtras({
  aiModel,
  referenceImage,
  referenceImageName,
  accent,
  onModelChange,
  onReferenceImageChange,
}: AgentAutopilotNodeExtrasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ingestFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          onReferenceImageChange(result, file.name);
        }
      };
      reader.readAsDataURL(file);
    },
    [onReferenceImageChange]
  );

  return (
    <div className="mt-3 space-y-3 border-t border-zinc-800/60 pt-3">
      <div>
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          KI-Modell
        </label>
        <select
          value={aiModel}
          onChange={(e) => onModelChange(e.target.value)}
          className={`${glassInputClass} min-h-11 w-full cursor-pointer rounded-lg px-3 py-2.5 text-xs text-zinc-100`}
        >
          {AGENT_AI_MODEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Referenzbild
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) ingestFile(file);
            e.target.value = "";
          }}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) ingestFile(file);
          }}
          className={`${glassInputClass} flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-dashed px-3 py-4 text-center transition-colors hover:border-zinc-500`}
          style={{ borderColor: referenceImage ? `${accent}55` : undefined }}
        >
          {referenceImage ? (
            <div className="relative w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={referenceImage}
                alt={referenceImageName ?? "Referenzbild"}
                className="mx-auto max-h-32 w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReferenceImageChange(undefined);
                }}
                className="absolute top-1 right-1 rounded-full bg-zinc-950/80 p-1 text-zinc-400 hover:text-white"
                aria-label="Referenzbild entfernen"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <>
              <ImagePlus className="h-5 w-5 text-zinc-500" strokeWidth={1.75} />
              <span className="text-[11px] leading-snug text-zinc-500">
                Bild hier ablegen oder tippen zum Upload
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

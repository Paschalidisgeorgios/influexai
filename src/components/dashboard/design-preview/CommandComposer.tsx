"use client";

import { ArrowUp } from "lucide-react";
import type { KeyboardEvent } from "react";

const ACCENT = "#b4ff00";
const SURFACE = "#0a0a10";

type Chip = { id: string; label: string; prompt: string };

type CommandComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  chips: Chip[];
  placeholder: string;
  enterHint: string;
  expanded?: boolean;
};

export function CommandComposer({
  value,
  onChange,
  onSubmit,
  chips,
  placeholder,
  enterHint,
  expanded = false,
}: CommandComposerProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSubmit();
    }
  };

  return (
    <div className="min-w-0" data-preview-enter>
      <div
        className="overflow-hidden rounded-lg transition-[border-color,box-shadow]"
        style={{
          background: SURFACE,
          border: `1px solid ${value ? "rgba(180,255,0,0.35)" : "rgba(255,255,255,0.09)"}`,
          boxShadow: value
            ? "0 0 0 3px rgba(180,255,0,0.08), 0 16px 48px rgba(0,0,0,0.28)"
            : "0 12px 40px rgba(0,0,0,0.22)",
        }}
      >
        <div
          className="h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, ${ACCENT}66, ${ACCENT}22, transparent 80%)`,
          }}
        />
        <div className="relative px-4 py-4 md:px-5 md:py-5">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={expanded ? 5 : 3}
            className="min-h-[96px] w-full resize-none bg-transparent text-[16px] leading-relaxed text-neutral-100 outline-none md:min-h-[112px] md:text-[17px]"
            placeholder={placeholder}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onChange(chip.prompt)}
                  className="rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors hover:border-white/20"
                  style={{
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.72)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!value.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-opacity disabled:opacity-30"
              style={{ background: ACCENT, color: "#080808" }}
              aria-label="Senden"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
      <p className="mt-2 font-mono text-[11px] text-neutral-500">{enterHint}</p>
    </div>
  );
}

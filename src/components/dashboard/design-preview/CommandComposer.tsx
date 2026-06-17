"use client";

import { ArrowUp, Plus } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { PREVIEW_ACCENT } from "./preview-tokens";

type Chip = { id: string; label: string; prompt: string };

type CommandComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  chips: Chip[];
  placeholder: string;
  rotatingPrompts: string[];
  enterHint: string;
  loadingHint: string;
  formatLabel: string;
  galleryLabel: string;
  assetLabel: string;
  loading?: boolean;
};

function RotatingPlaceholder({ prompts, visible }: { prompts: string[]; visible: boolean }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "erasing">("typing");

  useEffect(() => {
    if (!visible || prompts.length === 0) return;
    const target = prompts[index % prompts.length] ?? "";

    if (phase === "typing") {
      if (text.length >= target.length) {
        const t = window.setTimeout(() => setPhase("pause"), 2200);
        return () => window.clearTimeout(t);
      }
      const t = window.setTimeout(() => setText(target.slice(0, text.length + 1)), 38);
      return () => window.clearTimeout(t);
    }

    if (phase === "pause") {
      const t = window.setTimeout(() => setPhase("erasing"), 80);
      return () => window.clearTimeout(t);
    }

    if (text.length === 0) {
      setIndex((i) => (i + 1) % prompts.length);
      setPhase("typing");
      return;
    }

    const t = window.setTimeout(() => setText(text.slice(0, -1)), 18);
    return () => window.clearTimeout(t);
  }, [text, phase, index, prompts, visible]);

  return (
    <span className="text-neutral-500" aria-hidden>
      {text || "\u200B"}
    </span>
  );
}

export function CommandComposer({
  value,
  onChange,
  onSubmit,
  chips,
  placeholder,
  rotatingPrompts,
  enterHint,
  loadingHint,
  formatLabel,
  galleryLabel,
  assetLabel,
  loading = false,
}: CommandComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const [activeChip, setActiveChip] = useState<string | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 280)}px`;
  }, [value, loading]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !loading) onSubmit();
    }
  };

  const surfaceClass = [
    "preview-command__surface",
    focused ? "preview-command__surface--focused" : "",
    loading ? "preview-command__surface--loading" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-w-0" data-preview-enter>
      <div className={surfaceClass}>
        <div className="preview-command__signal" aria-hidden />
        <div className="relative px-4 py-4 md:px-5 md:py-5">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={3}
              className="preview-command__textarea disabled:opacity-60"
              placeholder={focused || value ? placeholder : ""}
              aria-label={placeholder}
            />
            {!value && !focused && !loading ? (
              <div
                className="pointer-events-none absolute left-0 top-0 max-w-full pr-2 text-[1rem] leading-[1.65] md:text-[1.0625rem]"
                aria-hidden
              >
                <RotatingPlaceholder prompts={rotatingPrompts} visible={!value} />
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex min-w-0 items-end justify-between gap-3 border-t pt-3.5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <button type="button" className="preview-command__toolbar-btn" disabled={loading}>
                <Plus size={14} strokeWidth={2.25} aria-hidden />
                {assetLabel}
              </button>
              <span className="preview-command__context-chip">{galleryLabel}</span>
              <span className="preview-command__context-chip">{formatLabel}</span>
            </div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading || !value.trim()}
              className="preview-command__send shrink-0"
              aria-label="Senden"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
        {chips.map((chip) => {
          const isActive = activeChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              disabled={loading}
              onClick={() => {
                setActiveChip(chip.id);
                onChange(chip.prompt);
              }}
              className={`preview-command__quick-chip ${isActive ? "preview-command__quick-chip--active" : ""}`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <p className="mt-2 font-mono text-[11px]" style={{ color: "rgba(245,242,234,0.42)" }}>
        {loading ? (
          <span style={{ color: PREVIEW_ACCENT }}>{loadingHint}</span>
        ) : (
          enterHint
        )}
      </p>
    </div>
  );
}

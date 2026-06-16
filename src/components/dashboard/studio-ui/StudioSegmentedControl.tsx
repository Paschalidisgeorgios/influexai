"use client";

import { cn } from "./cn";
import { STUDIO_ACCENT, STUDIO_INPUT_BG, STUDIO_RADIUS, STUDIO_TEXT } from "./tokens";

export type StudioSegmentOption<T extends string> = {
  value: T;
  label: string;
};

export function StudioSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: readonly StudioSegmentOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex w-full flex-wrap gap-1.5 p-1",
        STUDIO_RADIUS.pill,
        className
      )}
      style={{ background: "rgba(8,8,8,0.04)" }}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-h-[40px] flex-1 px-4 py-2 text-xs font-semibold transition-all sm:flex-none sm:min-w-[7rem]",
              STUDIO_RADIUS.pill
            )}
            style={{
              background: active ? "rgba(180,255,0,0.14)" : STUDIO_INPUT_BG,
              color: STUDIO_TEXT,
              border: active ? "1px solid rgba(180,255,0,0.32)" : "1px solid transparent",
              boxShadow: active ? "0 1px 8px rgba(180,255,0,0.08)" : undefined,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Compact pill chips for format / quality toggles */
export function StudioOptionPills<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: readonly StudioSegmentOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-4 py-2.5 text-xs font-medium transition-all",
              STUDIO_RADIUS.pill
            )}
            style={{
              background: active ? "rgba(180,255,0,0.12)" : STUDIO_INPUT_BG,
              color: STUDIO_TEXT,
              border: active
                ? "1px solid rgba(180,255,0,0.30)"
                : "1px solid rgba(8,8,8,0.08)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export { STUDIO_ACCENT };

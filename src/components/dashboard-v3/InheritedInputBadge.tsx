"use client";

interface InheritedInputBadgeProps {
  label: string;
  value: string;
  onClear: () => void;
  themeRgb: string;
}

export function InheritedInputBadge({
  label,
  value,
  onClear,
  themeRgb,
}: InheritedInputBadgeProps) {
  const preview = value.length > 80 ? `${value.slice(0, 80)}…` : value;

  return (
    <div
      className="relative mb-2 rounded-xl border p-3"
      style={{
        borderColor: `rgba(${themeRgb}, 0.3)`,
        background: `rgba(${themeRgb}, 0.06)`,
      }}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: `rgb(${themeRgb})` }}
            aria-hidden="true"
          />
          <span
            className="font-mono text-[10px] tracking-widest uppercase"
            style={{ color: `rgb(${themeRgb})` }}
          >
            {label}
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] text-white/25 underline underline-offset-2 transition-colors hover:text-white/60"
          aria-label="Pipeline-Verbindung trennen"
        >
          trennen
        </button>
      </div>

      <p className="font-mono text-[12px] leading-relaxed text-white/60">{preview}</p>
    </div>
  );
}

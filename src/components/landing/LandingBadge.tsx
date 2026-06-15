"use client";

type LandingBadgeProps = {
  text: string;
  visible: boolean;
};

export function LandingBadge({ text, visible }: LandingBadgeProps) {
  return (
    <div
      className="pointer-events-none fixed left-1/2 top-16 z-50 max-w-[min(92vw,520px)] -translate-x-1/2"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 backdrop-blur-md transition-opacity duration-300"
        style={{
          borderWidth: "0.5px",
          borderColor: "var(--theme-accent-25)",
          background: "var(--theme-accent-08)",
          opacity: visible ? 1 : 0,
        }}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full"
          style={{ background: "var(--theme-accent)" }}
          aria-hidden
        />
        <span
          className="text-sm tracking-wide"
          style={{ color: "rgba(255,255,255,0.75)" }}
        >
          {text || "\u00A0"}
        </span>
      </div>
    </div>
  );
}

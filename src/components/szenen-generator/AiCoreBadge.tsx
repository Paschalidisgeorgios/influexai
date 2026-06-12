"use client";

type AiCoreBadgeProps = {
  text: string;
  visible: boolean;
};

export function AiCoreBadge({ text, visible }: AiCoreBadgeProps) {
  return (
    <div
      className="relative mb-3 overflow-hidden rounded-[14px] border px-3 py-2.5 transition-all duration-700 ease-in-out"
      style={{
        borderColor: "var(--szenen-accent-30)",
        background: "var(--szenen-accent-10)",
        boxShadow: `0 0 24px var(--szenen-accent-10)`,
      }}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 flex h-2 w-2 shrink-0 animate-pulse rounded-full"
          style={{ background: "var(--szenen-accent)" }}
          aria-hidden
        />
        <p
          className="text-[11px] leading-relaxed transition-opacity duration-300"
          style={{
            color: "var(--szenen-accent-text-muted)",
            opacity: visible ? 1 : 0,
          }}
        >
          {text || "\u00A0"}
        </p>
      </div>
    </div>
  );
}

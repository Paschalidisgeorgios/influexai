"use client";

type Props = {
  label?: string;
  variant?: "dark" | "light";
};

export function AgentTypingIndicator({ label, variant = "dark" }: Props) {
  const labelClass = variant === "light" ? "text-black/50" : "text-white/50";

  return (
    <div
      className="flex items-center gap-3 text-sm"
      role="status"
      aria-live="polite"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#B4FF00]/20 bg-[#B4FF00]/10 animate-pulse"
        aria-hidden
      >
        <span className="text-xs font-bold text-[#B4FF00]">A</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="flex items-center gap-1" aria-hidden>
          <span className="agent-typing-dot h-2 w-2 rounded-full bg-[#B4FF00]" />
          <span className="agent-typing-dot agent-typing-dot--2 h-2 w-2 rounded-full bg-[#B4FF00]" />
          <span className="agent-typing-dot agent-typing-dot--3 h-2 w-2 rounded-full bg-[#B4FF00]" />
        </span>
        {label ? (
          <span className={labelClass}>{label}</span>
        ) : null}
      </span>
    </div>
  );
}

"use client";

type Props = {
  label?: string;
};

export function AgentTypingIndicator({ label }: Props) {
  return (
    <div
      className="flex items-center gap-2 text-sm text-[var(--accent,#B4FF00)]"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-1" aria-hidden>
        <span className="agent-typing-dot h-1.5 w-1.5 rounded-full bg-[var(--accent,#B4FF00)]" />
        <span className="agent-typing-dot agent-typing-dot--2 h-1.5 w-1.5 rounded-full bg-[var(--accent,#B4FF00)]" />
        <span className="agent-typing-dot agent-typing-dot--3 h-1.5 w-1.5 rounded-full bg-[var(--accent,#B4FF00)]" />
      </span>
      {label ? <span className="text-white/70">{label}</span> : null}
      <style jsx>{`
        .agent-typing-dot {
          animation: agent-typing-bounce 1.2s ease-in-out infinite;
        }
        .agent-typing-dot--2 {
          animation-delay: 0.15s;
        }
        .agent-typing-dot--3 {
          animation-delay: 0.3s;
        }
        @keyframes agent-typing-bounce {
          0%,
          60%,
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }
      `}</style>
    </div>
  );
}

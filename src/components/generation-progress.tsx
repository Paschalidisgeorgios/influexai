"use client";

type Props = {
  label?: string;
  progress?: number;
  indeterminate?: boolean;
};

export function GenerationProgress({
  label = "Wird generiert…",
  progress = 0,
  indeterminate = true,
}: Props) {
  const width = indeterminate
    ? undefined
    : `${Math.min(100, Math.max(0, progress))}%`;

  return (
    <div
      className="rounded-2xl border border-[#B4FF00]/20 bg-[#0f0f12] p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="inline-block h-10 w-10 rounded-full border-2 border-[#B4FF00]/30 border-t-[#B4FF00] animate-spin mb-4"
        aria-hidden
      />
      <p className="text-[#B4FF00] font-semibold mb-4">{label}</p>
      <div className="h-2 w-full max-w-md mx-auto rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full bg-[#B4FF00] transition-all duration-300 ${
            indeterminate ? "w-1/3 animate-[shimmer_1.4s_ease-in-out_infinite]" : ""
          }`}
          style={width ? { width } : undefined}
        />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(380%); }
        }
      `}</style>
    </div>
  );
}

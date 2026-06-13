"use client";

interface SmartCapsuleProps {
  rgb: string;
  message: string;
  isFlashing?: boolean;
}

export function SmartCapsule({
  rgb,
  message,
  isFlashing = false,
}: SmartCapsuleProps) {
  return (
    <div
      className="pointer-events-none fixed top-4 left-1/2 z-[60] select-none"
      style={{ transform: "translateX(-50%)" }}
    >
      <div
        className="flex items-center gap-2 rounded-full border backdrop-blur-xl"
        style={{
          padding: "5px 14px",
          background: isFlashing ? `rgba(${rgb},0.14)` : "rgba(12,12,14,0.72)",
          borderColor: `rgba(${rgb},0.28)`,
          boxShadow: isFlashing
            ? `0 0 40px rgba(${rgb},0.45), 0 0 80px rgba(${rgb},0.15)`
            : `0 0 18px rgba(${rgb},0.22), inset 0 0.5px 0 rgba(255,255,255,0.06)`,
          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
          willChange: "transform, box-shadow",
        }}
      >
        <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
          <span
            className="absolute inset-0 animate-ping rounded-full"
            style={{ background: `rgba(${rgb},0.35)`, animationDuration: "2s" }}
          />
          <span
            className="relative h-1.5 w-1.5 rounded-full"
            style={{
              background: `rgb(${rgb})`,
              boxShadow: `0 0 8px rgba(${rgb},0.9)`,
            }}
          />
        </span>
        <span
          className="max-w-[min(72vw,420px)] truncate font-sans text-[10px] font-medium tracking-[1.2px] uppercase"
          style={{ color: `rgba(${rgb},0.82)` }}
        >
          {message}
        </span>
      </div>
    </div>
  );
}

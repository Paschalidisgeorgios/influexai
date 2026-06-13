"use client";

interface SmartCapsuleProps {
  rgb: string;
  message: string;
  textOpacity: number;
  isFlashing?: boolean;
  isScrolled?: boolean;
}

export function SmartCapsule({
  rgb,
  message,
  textOpacity,
  isFlashing = false,
  isScrolled = false,
}: SmartCapsuleProps) {
  return (
    <div
      className="pointer-events-none fixed top-5 z-50 left-1/2 -translate-x-1/2 lg:left-[calc(50%+120px)]"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-2 rounded-full border backdrop-blur-2xl"
        style={{
          padding: isScrolled ? "6px 12px" : "8px 16px",
          fontSize: isScrolled ? "9px" : "10px",
          background: isFlashing ? `rgba(${rgb},0.14)` : "rgba(12,12,14,0.72)",
          borderColor: `rgba(${rgb},0.28)`,
          boxShadow: isFlashing
            ? `0 0 40px rgba(${rgb},0.45), 0 0 80px rgba(${rgb},0.15)`
            : `0 0 18px rgba(${rgb},0.22), inset 0 0.5px 0 rgba(255,255,255,0.06)`,
          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
          willChange: "transform, box-shadow",
        }}
      >
        <span
          className="relative flex shrink-0 items-center justify-center"
          style={{ width: "12px", height: "12px" }}
        >
          <span
            className="absolute inset-0 animate-ping rounded-full"
            style={{ background: `rgba(${rgb},0.4)`, animationDuration: "2s" }}
          />
          <span
            className="relative rounded-full"
            style={{
              width: "5px",
              height: "5px",
              background: `rgb(${rgb})`,
              boxShadow: `0 0 8px rgba(${rgb},0.9)`,
            }}
          />
        </span>
        <span
          className="max-w-[min(72vw,420px)] truncate font-sans font-medium tracking-[1.2px] uppercase"
          style={{
            color: `rgba(${rgb},0.82)`,
            opacity: textOpacity,
            transition: "opacity 0.2s ease",
          }}
        >
          {message}
        </span>
      </div>
    </div>
  );
}

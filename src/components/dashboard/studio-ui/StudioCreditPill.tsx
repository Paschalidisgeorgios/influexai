"use client";

import { cn } from "./cn";
import { STUDIO_MUTED, STUDIO_RADIUS, STUDIO_TEXT } from "./tokens";

export function StudioCreditPill({
  label,
  className,
  accentDot = true,
}: {
  label: string;
  className?: string;
  accentDot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-medium",
        STUDIO_RADIUS.pill,
        className
      )}
      style={{
        background: "rgba(255,255,255,0.45)",
        border: "1px solid rgba(8,8,8,0.06)",
        color: STUDIO_TEXT,
      }}
    >
      {accentDot ? (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: "#b4ff00", opacity: 0.65 }}
        />
      ) : null}
      {label}
    </span>
  );
}

export function StudioCreditNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-xs leading-relaxed", className)} style={{ color: STUDIO_MUTED }}>
      {children}
    </p>
  );
}

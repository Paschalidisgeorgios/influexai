"use client";

import { cn } from "./cn";
import {
  STUDIO_MUTED,
  STUDIO_PANEL_BG,
  STUDIO_RADIUS,
  STUDIO_SHADOW,
} from "./tokens";

export function StudioPanel({
  title,
  children,
  className,
  variant = "soft",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "soft" | "flat";
}) {
  return (
    <div
      className={cn(
        STUDIO_RADIUS.panel,
        "p-5 md:p-6",
        variant === "soft" && "border border-black/[0.05]",
        className
      )}
      style={{
        background: variant === "flat" ? "transparent" : STUDIO_PANEL_BG,
        boxShadow: variant === "flat" ? undefined : STUDIO_SHADOW.panel,
      }}
    >
      {title ? (
        <h3
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: STUDIO_MUTED }}
        >
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  );
}

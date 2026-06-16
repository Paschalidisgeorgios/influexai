"use client";

import { cn } from "./cn";
import {
  STUDIO_MUTED,
  STUDIO_PANEL_BG,
  STUDIO_RADIUS,
  STUDIO_SHADOW,
  STUDIO_STAGE_BORDER,
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
        "w-full min-w-0 max-w-full p-5 md:p-6",
        variant === "soft" && "border backdrop-blur-sm",
        className
      )}
      style={{
        background: variant === "flat" ? "transparent" : STUDIO_PANEL_BG,
        borderColor: variant === "flat" ? undefined : STUDIO_STAGE_BORDER,
        boxShadow: variant === "flat" ? undefined : STUDIO_SHADOW.panel,
      }}
    >
      {title ? (
        <h3
          className="mb-4 text-sm font-semibold tracking-tight"
          style={{ color: STUDIO_MUTED }}
        >
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  );
}

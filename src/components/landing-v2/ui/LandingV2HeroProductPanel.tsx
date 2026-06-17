"use client";

import { LandingV2SystemSurface } from "./LandingV2SystemSurface";

/** @deprecated Use LandingV2SystemSurface — kept for live landing compatibility */
export function LandingV2HeroProductPanel({
  variant = "default",
}: {
  variant?: "default" | "stage" | "compact";
}) {
  return (
    <LandingV2SystemSurface
      variant={variant === "compact" || variant === "default" ? "compact" : "hero"}
    />
  );
}

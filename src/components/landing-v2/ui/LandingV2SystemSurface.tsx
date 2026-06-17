"use client";

import { LandingV2CreatorProductionFlow } from "./LandingV2CreatorProductionFlow";

type LandingV2SystemSurfaceProps = {
  variant?: "hero" | "compact";
};

/** @deprecated Use LandingV2CreatorProductionFlow */
export function LandingV2SystemSurface({ variant = "hero" }: LandingV2SystemSurfaceProps) {
  return (
    <LandingV2CreatorProductionFlow
      variant={variant === "compact" ? "hero" : "system"}
    />
  );
}

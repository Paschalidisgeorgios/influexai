"use client";

import type { RefObject } from "react";

type LandingV2SystemBackgroundProps = {
  gridRef?: RefObject<HTMLDivElement | null>;
};

/** Decorative OS-stage backdrop — grid, signal trace, radial depth */
export function LandingV2SystemBackground({ gridRef }: LandingV2SystemBackgroundProps) {
  return (
    <div className="landing-v2-system-bg" aria-hidden data-system-bg>
      <div className="landing-v2-system-bg__vignette" />
      <div
        ref={gridRef}
        className="landing-v2-system-bg__grid"
        data-system-bg-grid
      />
      <div className="landing-v2-system-bg__radial" />
      <div className="landing-v2-system-bg__signal" />
    </div>
  );
}

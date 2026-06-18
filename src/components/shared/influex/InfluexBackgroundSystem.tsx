"use client";

import { useRef } from "react";
import { cn } from "./cn";
import type {
  InfluexBackgroundCompatLayer,
  InfluexBackgroundIntensity,
  InfluexShellVariant,
} from "./types";
import { useInfluexBackgroundGlow } from "./useInfluexBackgroundGlow";

export type InfluexBackgroundSystemProps = {
  variant?: InfluexShellVariant;
  intensity?: InfluexBackgroundIntensity;
  withNoise?: boolean;
  withGrid?: boolean;
  scrollGlow?: boolean;
  scrollRootSelector?: string;
  /** Keeps legacy CSS class names for landing-v2 / preview parity */
  compatLayer?: InfluexBackgroundCompatLayer;
  className?: string;
};

const VARIANT_DEFAULTS: Record<
  InfluexShellVariant,
  { withNoise: boolean; withGrid: boolean; scrollGlow: boolean }
> = {
  marketing: { withNoise: true, withGrid: true, scrollGlow: true },
  auth: { withNoise: true, withGrid: true, scrollGlow: false },
  legal: { withNoise: false, withGrid: true, scrollGlow: false },
  dashboard: { withNoise: false, withGrid: true, scrollGlow: false },
  preview: { withNoise: false, withGrid: true, scrollGlow: false },
};

function layerClasses(compatLayer: InfluexBackgroundCompatLayer) {
  if (compatLayer === "landing-v2") {
    return {
      root: "landing-v2-bg-system",
      base: "landing-v2-bg-system__base",
      grid: "landing-v2-bg-system__grid",
      glow: "landing-v2-bg-system__glow",
      vignette: "landing-v2-bg-system__vignette",
      noise: "landing-v2-bg-system__noise",
    };
  }
  if (compatLayer === "preview") {
    return {
      root: "preview-bg-system",
      base: "preview-bg-system__base",
      grid: "preview-bg-system__grid",
      glow: "preview-bg-system__glow",
      vignette: "preview-bg-system__vignette",
      noise: "",
    };
  }
  return {
    root: "",
    base: "",
    grid: "",
    glow: "",
    vignette: "",
    noise: "",
  };
}

/** Fixed premium backdrop — grid, glow, vignette, optional noise */
export function InfluexBackgroundSystem({
  variant = "marketing",
  intensity = "standard",
  withNoise: withNoiseProp,
  withGrid: withGridProp,
  scrollGlow: scrollGlowProp,
  scrollRootSelector = ".landing-v2-main",
  compatLayer = null,
  className,
}: InfluexBackgroundSystemProps) {
  const defaults = VARIANT_DEFAULTS[variant];
  const withNoise = withNoiseProp ?? defaults.withNoise;
  const withGrid = withGridProp ?? defaults.withGrid;
  const scrollGlow = scrollGlowProp ?? defaults.scrollGlow;

  const rootRef = useRef<HTMLDivElement>(null);
  useInfluexBackgroundGlow(rootRef, scrollRootSelector, scrollGlow);

  const legacy = layerClasses(compatLayer);

  return (
    <div
      ref={rootRef}
      className={cn(
        "influex-bg-system",
        `influex-bg-system--${variant}`,
        intensity !== "standard" && `influex-bg-system--${intensity}`,
        legacy.root,
        className
      )}
      aria-hidden
    >
      <div className={cn("influex-bg-system__base", legacy.base)} />
      {withGrid ? (
        <div className={cn("influex-bg-system__grid", legacy.grid)} />
      ) : null}
      <div className={cn("influex-bg-system__glow", legacy.glow)} />
      <div className={cn("influex-bg-system__vignette", legacy.vignette)} />
      {withNoise ? (
        <div className={cn("influex-bg-system__noise", legacy.noise)} />
      ) : null}
    </div>
  );
}

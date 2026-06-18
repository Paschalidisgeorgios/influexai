"use client";

import { InfluexBackgroundSystem } from "@/components/shared/influex";

/** Fixed global landing stage — delegates to shared Influex background (landing-v2 compat) */
export function LandingV2BackgroundSystem() {
  return (
    <InfluexBackgroundSystem
      variant="marketing"
      intensity="standard"
      compatLayer="landing-v2"
      scrollGlow
      scrollRootSelector=".landing-v2-main"
    />
  );
}

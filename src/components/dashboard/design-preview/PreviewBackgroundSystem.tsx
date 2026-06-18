"use client";

import { InfluexBackgroundSystem } from "@/components/shared/influex";

/** Fixed dashboard preview backdrop — shared Influex background (preview compat) */
export function PreviewBackgroundSystem() {
  return (
    <InfluexBackgroundSystem
      variant="preview"
      intensity="standard"
      compatLayer="preview"
    />
  );
}

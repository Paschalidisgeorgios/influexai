"use client";

import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { CustomCursor } from "@/components/ui/CustomCursor";

/** Global Obsidian effects: custom cursor (desktop) + ambient glow */
export function ObsidianShell() {
  return (
    <>
      <AmbientGlow />
      <CustomCursor />
    </>
  );
}

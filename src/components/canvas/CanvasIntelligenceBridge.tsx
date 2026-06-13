"use client";

import { useCanvasIntelligence } from "@/hooks/useCanvasIntelligence";

/** Invisible bridge — mounts intelligence hooks inside the React Flow context. */
export function CanvasIntelligenceBridge() {
  useCanvasIntelligence();
  return null;
}

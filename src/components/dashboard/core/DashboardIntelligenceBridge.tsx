"use client";

/**
 * DashboardIntelligenceBridge — verbindet den Claude-Agenten mit dem Board.
 * Reagiert auf Agenten-Events und aktualisiert den Dashboard-State.
 * Rendert keine sichtbaren Elemente.
 */

import { useEffect } from "react";
import { useCanvasStore } from "@/lib/canvas/canvas-store";

export function DashboardIntelligenceBridge() {
  const nodes = useCanvasStore((s) => s.nodes);

  useEffect(() => {
    // Placeholder: Hier können Agenten-Events verarbeitet werden.
    // Z.B. Tool-Spawning auf Basis von Agenten-Empfehlungen.
    void nodes;
  }, [nodes]);

  return null;
}

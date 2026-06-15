"use client";

/**
 * PipelineProvider — verbindet Tool-Module mit dem Asset-Viewer.
 * Kein Event-Emitter. Reiner React Context.
 */

import { createContext, useContext, type ReactNode } from "react";

interface PipelineContextValue {
  /** Kann in Zukunft für Pipeline-weite Aktionen genutzt werden */
  __brand: "pipeline";
}

const PipelineContext = createContext<PipelineContextValue>({ __brand: "pipeline" });

export function PipelineProvider({ children }: { children: ReactNode }) {
  return (
    <PipelineContext.Provider value={{ __brand: "pipeline" }}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline(): PipelineContextValue {
  return useContext(PipelineContext);
}

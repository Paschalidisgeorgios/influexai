"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePipeline, type PipelineApi } from "@/lib/dashboard-v3/usePipeline";

const PipelineStoreContext = createContext<PipelineApi | null>(null);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const pipeline = usePipeline();

  const value = useMemo(
    () => pipeline,
    [
      pipeline.outputs,
      pipeline.registerOutput,
      pipeline.getInheritedValue,
      pipeline.clearOutputs,
      pipeline.getAllOutputs,
      pipeline.removeOutputsForPanels,
    ]
  );

  return (
    <PipelineStoreContext.Provider value={value}>{children}</PipelineStoreContext.Provider>
  );
}

export function usePipelineStore(): PipelineApi {
  const ctx = useContext(PipelineStoreContext);
  if (!ctx) {
    throw new Error("usePipelineStore must be used within PipelineProvider");
  }
  return ctx;
}

export function usePipelineStoreOptional(): PipelineApi | null {
  return useContext(PipelineStoreContext);
}

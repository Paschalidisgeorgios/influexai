"use client";

import { createContext, useContext } from "react";
import type { PipelineApi } from "./usePipeline";

export type PipelineContextValue = PipelineApi & {
  panelId: string;
  panelIndex: number;
  allPanelIds: string[];
  themeRgb: string;
};

const PipelineContext = createContext<PipelineContextValue | null>(null);

export function PipelineContextProvider({
  value,
  children,
}: {
  value: PipelineContextValue;
  children: React.ReactNode;
}) {
  return (
    <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>
  );
}

export function usePipelineContext(): PipelineContextValue {
  const ctx = useContext(PipelineContext);
  if (!ctx) {
    throw new Error("usePipelineContext must be used inside PipelineContextProvider");
  }
  return ctx;
}

export function usePipelineContextOptional(): PipelineContextValue | null {
  return useContext(PipelineContext);
}

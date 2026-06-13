"use client";

import { useCallback, useMemo, useState } from "react";
import { usePipelineContextOptional } from "@/lib/dashboard-v3/PipelineContext";
import { PIPELINE_COMPATIBILITY } from "@/lib/dashboard-v3/usePipeline";

export function usePipelineField(fieldKey: string) {
  const pipeline = usePipelineContextOptional();
  const [useInherited, setUseInherited] = useState(true);

  const inherited = useMemo(() => {
    if (!pipeline || !PIPELINE_COMPATIBILITY[fieldKey]) return null;
    return pipeline.getInheritedValue(
      fieldKey,
      pipeline.panelIndex,
      pipeline.allPanelIds
    );
  }, [fieldKey, pipeline]);

  const disconnect = useCallback(() => setUseInherited(false), []);
  const reconnect = useCallback(() => setUseInherited(true), []);

  const effectiveValue =
    useInherited && inherited ? inherited.value : undefined;

  return {
    pipeline,
    inherited,
    useInherited,
    effectiveValue,
    disconnect,
    reconnect,
    themeRgb: pipeline?.themeRgb ?? "204,255,0",
    registerOutput: pipeline?.registerOutput,
    panelId: pipeline?.panelId,
  };
}

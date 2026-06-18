"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { LANDING_V2_STUDIO_DEMO_SCENARIOS } from "@/lib/landing-v2-studio-demo-scenarios";
import { useReducedMotion } from "./useReducedMotion";

const ROTATE_MS = 9000;

type UseStudioDemoScenarioRotateOptions = {
  setActiveIndex: Dispatch<SetStateAction<number>>;
  enabled?: boolean;
  count?: number;
};

/** Cycle studio demo scenarios — preview landing only */
export function useStudioDemoScenarioRotate({
  setActiveIndex,
  enabled = true,
  count = LANDING_V2_STUDIO_DEMO_SCENARIOS.length,
}: UseStudioDemoScenarioRotateOptions) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled || reduceMotion || count <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [count, enabled, reduceMotion, setActiveIndex]);
}

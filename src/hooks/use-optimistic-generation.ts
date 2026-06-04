"use client";

import { useCallback, useState } from "react";

const OPTIMISTIC_CREDITS_EVENT = "optimistic-credits";

export function dispatchOptimisticCredits(value: number | null) {
  window.dispatchEvent(
    new CustomEvent(OPTIMISTIC_CREDITS_EVENT, { detail: value })
  );
}

export function useOptimisticGeneration() {
  const [optimisticCredits, setOptimisticCredits] = useState<number | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(
    async <T>(
      action: () => Promise<T>,
      creditCost: number,
      currentCredits: number
    ): Promise<T> => {
      setIsGenerating(true);
      const next = currentCredits - creditCost;
      setOptimisticCredits(next);
      dispatchOptimisticCredits(next);

      try {
        const result = await action();
        return result;
      } catch (error) {
        setOptimisticCredits(currentCredits);
        dispatchOptimisticCredits(null);
        throw error;
      } finally {
        setIsGenerating(false);
        setOptimisticCredits(null);
        dispatchOptimisticCredits(null);
        window.dispatchEvent(new Event("credits-updated"));
      }
    },
    []
  );

  return { generate, optimisticCredits, isGenerating };
}

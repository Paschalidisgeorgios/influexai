"use client";

import { useCallback, useState } from "react";
import { broadcastCreditsBalance, broadcastCreditsRefresh } from "@/lib/credits-sync";

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
      broadcastCreditsBalance(next);

      try {
        const result = await action();

        if (
          result &&
          typeof result === "object" &&
          "error" in result &&
          result.error
        ) {
          setOptimisticCredits(currentCredits);
          broadcastCreditsBalance(currentCredits);
          throw new Error(String(result.error));
        }

        return result;
      } catch (error) {
        setOptimisticCredits(currentCredits);
        broadcastCreditsBalance(currentCredits);
        throw error;
      } finally {
        setIsGenerating(false);
        setOptimisticCredits(null);
        broadcastCreditsRefresh();
      }
    },
    []
  );

  return { generate, optimisticCredits, isGenerating };
}

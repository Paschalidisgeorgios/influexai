"use client";

import { useCredits } from "@/components/credits/BuyCreditsProvider";

/**
 * Global reactive credits hook — reads from `BuyCreditsProvider` when mounted.
 * Falls back to null credits outside the provider tree.
 */
export function useUserCredits() {
  const {
    credits,
    verifiedCredits,
    isOptimistic,
    refreshCredits,
    addCreditsOptimistic,
    rollbackOptimistic,
    reconcilePaymentIntent,
    showCreditsToast,
  } = useCredits();

  return {
    credits,
    rawCredits: verifiedCredits,
    isOptimistic,
    reload: refreshCredits,
    addCreditsOptimistic,
    rollbackOptimistic,
    reconcilePaymentIntent,
    showCreditsToast,
  };
}

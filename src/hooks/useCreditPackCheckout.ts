"use client";

import { useCallback, useState } from "react";
import type { CreditPackageId } from "@/lib/credit-packages";
import {
  CHECKOUT_USER_MESSAGES,
  resolveCheckoutErrorMessage,
  type CheckoutApiResponse,
} from "@/lib/checkout-messages";

type UseCreditPackCheckoutOptions = {
  redirectPath?: string;
  hasActivePlan?: boolean;
};

export function useCreditPackCheckout(options: UseCreditPackCheckoutOptions = {}) {
  const { redirectPath = "/dashboard/credits", hasActivePlan } = options;
  const [loadingId, setLoadingId] = useState<CreditPackageId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const checkout = useCallback(
    async (packageId: CreditPackageId) => {
      if (hasActivePlan === false) {
        setError(CHECKOUT_USER_MESSAGES.planRequired);
        return;
      }

      setLoadingId(packageId);
      setError(null);

      try {
        const res = await fetch("/api/credits/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId }),
        });
        const data = (await res.json()) as CheckoutApiResponse;

        if (data.url) {
          window.location.href = data.url;
          return;
        }

        if (res.status === 401) {
          window.location.href = `/auth/sign-in?redirect=${encodeURIComponent(redirectPath)}`;
          return;
        }

        setError(resolveCheckoutErrorMessage(data, res.status));
      } catch {
        setError(CHECKOUT_USER_MESSAGES.genericError);
      } finally {
        setLoadingId(null);
      }
    },
    [hasActivePlan, redirectPath]
  );

  return { loadingId, error, checkout, clearError };
}

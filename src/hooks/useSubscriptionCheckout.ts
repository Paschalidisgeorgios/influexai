"use client";

import { useState } from "react";
import type { BillingInterval } from "@/lib/subscription-plans";
import {
  CHECKOUT_USER_MESSAGES,
  resolveCheckoutErrorMessage,
  type CheckoutApiResponse,
} from "@/lib/checkout-messages";

export function useSubscriptionCheckout(redirectPath = "/pricing") {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (plan: string, interval: BillingInterval) => {
    const key = `${plan}-${interval}`;
    setLoading(key);
    setError(null);
    try {
      const res = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
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
    }
    setLoading(null);
  };

  return { loading, error, handleSubscribe, clearError: () => setError(null) };
}

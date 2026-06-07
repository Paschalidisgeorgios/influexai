"use client";

import { useState } from "react";
import type { BillingInterval } from "@/lib/subscription-plans";

export function useSubscriptionCheckout(redirectPath = "/pricing") {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: string, interval: BillingInterval) => {
    const key = `${plan}-${interval}`;
    setLoading(key);
    try {
      const res = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.status === 401) {
        window.location.href = `/auth/sign-in?redirect=${encodeURIComponent(redirectPath)}`;
        return;
      }
      alert(data.error ?? "Checkout fehlgeschlagen.");
    } catch {
      alert("Fehler beim Checkout.");
    }
    setLoading(null);
  };

  return { loading, handleSubscribe };
}

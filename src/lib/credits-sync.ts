export const CREDITS_UPDATED_EVENT = "credits-updated";
export const OPTIMISTIC_CREDITS_EVENT = "optimistic-credits";

export type PaymentStatusResponse = {
  status?: string;
  balance?: number;
  creditsAdded?: number;
  paid?: boolean;
  error?: string;
};

export function broadcastCreditsBalance(balance: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OPTIMISTIC_CREDITS_EVENT, { detail: balance })
  );
}

export function broadcastCreditsRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CREDITS_UPDATED_EVENT));
}

export async function fetchPaymentIntentStatus(
  paymentIntentId: string
): Promise<PaymentStatusResponse> {
  const res = await fetch(
    `/api/credits/payment-status?payment_intent_id=${encodeURIComponent(paymentIntentId)}`
  );
  return (await res.json()) as PaymentStatusResponse;
}

export async function waitMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function reconcilePaymentIntentBalance(
  paymentIntentId: string,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<PaymentStatusResponse | null> {
  const maxAttempts = options?.maxAttempts ?? 12;
  const intervalMs = options?.intervalMs ?? 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const data = await fetchPaymentIntentStatus(paymentIntentId);

      if (data.paid && typeof data.balance === "number") {
        return data;
      }

      if (
        data.status === "canceled" ||
        data.status === "requires_payment_method"
      ) {
        return data;
      }
    } catch {
      /* webhook may still be processing */
    }

    await waitMs(intervalMs);
  }

  return null;
}

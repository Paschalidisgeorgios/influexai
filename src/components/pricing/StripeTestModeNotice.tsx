"use client";

import { shouldShowStripeTestModeNotice } from "@/lib/pricing-surface";
import { CHECKOUT_USER_MESSAGES } from "@/lib/checkout-messages";

type StripeTestModeNoticeProps = {
  className?: string;
  variant?: "pricing" | "dashboard";
};

export function StripeTestModeNotice({
  className = "",
  variant = "pricing",
}: StripeTestModeNoticeProps) {
  if (!shouldShowStripeTestModeNotice()) return null;

  const baseClass =
    variant === "pricing"
      ? "influex-pricing-test-mode-notice"
      : "rounded-[14px] border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm leading-relaxed text-amber-950";

  return (
    <p
      className={`${baseClass} ${className}`.trim()}
      data-testid="stripe-test-mode-notice"
      role="status"
    >
      <strong>{CHECKOUT_USER_MESSAGES.stripeTestMode}</strong>{" "}
      Checkout läuft nur in der Stripe-Testumgebung — es werden keine echten
      Zahlungen ausgelöst.
    </p>
  );
}

/**
 * Stripe subscription invoice credit guard (G.10-L2).
 * Initial checkout credits come from checkout.session.completed only.
 * invoice.paid must not double-grant on subscription_create.
 */
export function shouldGrantSubscriptionRenewalCredits(
  billingReason: string | null | undefined
): boolean {
  return billingReason === "subscription_cycle";
}

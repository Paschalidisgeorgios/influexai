import type { CreditPackageId } from "@/lib/credit-packages";

/**
 * Client-visible Stripe Price IDs for credit top-ups (optional; server uses STRIPE_CREDITS_*).
 */
export const CLIENT_STRIPE_CREDIT_PRICE_ENV: Record<CreditPackageId, string> = {
  micro: "NEXT_PUBLIC_STRIPE_PRICE_MICRO",
  small: "NEXT_PUBLIC_STRIPE_PRICE_SMALL",
  medium: "NEXT_PUBLIC_STRIPE_PRICE_MEDIUM",
  large: "NEXT_PUBLIC_STRIPE_PRICE_LARGE",
};

export function getClientStripeCreditPriceId(
  packageId: CreditPackageId
): string | undefined {
  const envName = CLIENT_STRIPE_CREDIT_PRICE_ENV[packageId];
  const value = process.env[envName]?.trim();
  return value || undefined;
}

export const CANVAS_NEON_GREEN = "#ccff00";

import type { CreditPackageId } from "@/lib/credit-packages";

/**
 * Client-visible Stripe Price IDs for credit top-ups.
 * Map these in .env.local to your live Stripe prices (Small → XL).
 */
export const CLIENT_STRIPE_CREDIT_PRICE_ENV: Record<CreditPackageId, string> = {
  small: "NEXT_PUBLIC_STRIPE_PRICE_SMALL",
  medium: "NEXT_PUBLIC_STRIPE_PRICE_MEDIUM",
  large: "NEXT_PUBLIC_STRIPE_PRICE_LARGE",
  xl: "NEXT_PUBLIC_STRIPE_PRICE_XL",
};

export function getClientStripeCreditPriceId(
  packageId: CreditPackageId
): string | undefined {
  const envName = CLIENT_STRIPE_CREDIT_PRICE_ENV[packageId];
  const value = process.env[envName]?.trim();
  return value || undefined;
}

export const CANVAS_NEON_GREEN = "#ccff00";

import {
  CREDIT_PACKAGES,
  getStripePriceIdForPackage,
  type CreditPackage,
} from "@/lib/credit-packages";

const ENV_CREDIT_MAP: { env: string; credits: number }[] = [
  { env: "STRIPE_CREDITS_100", credits: 100 },
  { env: "STRIPE_CREDITS_300", credits: 300 },
  { env: "STRIPE_CREDITS_700", credits: 700 },
  { env: "STRIPE_CREDITS_1500", credits: 1500 },
];

/** Whitelisted Stripe Price IDs → credit amounts (server + webhook). */
export function getCreditsByStripePriceId(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const { env, credits } of ENV_CREDIT_MAP) {
    const priceId = process.env[env]?.trim();
    if (priceId) map[priceId] = credits;
  }
  return map;
}

export function creditsForStripePriceId(priceId: string): number {
  return getCreditsByStripePriceId()[priceId] ?? 0;
}

export function isWhitelistedCreditPriceId(priceId: string): boolean {
  return creditsForStripePriceId(priceId) > 0;
}

export function packageForStripePriceId(
  priceId: string
): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(
    (pkg) => getStripePriceIdForPackage(pkg) === priceId
  );
}

export function listWhitelistedCreditPackages(): CreditPackage[] {
  return CREDIT_PACKAGES.filter((pkg) => getStripePriceIdForPackage(pkg));
}

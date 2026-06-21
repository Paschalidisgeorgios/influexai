import {
  CREDIT_PACKAGES,
  getStripePriceEnvKeysForPackage,
  getStripePriceIdForPackage,
  type CreditPackage,
} from "@/lib/credit-packages";

/** Whitelisted Stripe Price IDs → credit amounts (server + webhook). */
export function getCreditsByStripePriceId(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const pkg of CREDIT_PACKAGES) {
    for (const envKey of getStripePriceEnvKeysForPackage(pkg)) {
      const priceId = process.env[envKey]?.trim();
      if (priceId) map[priceId] = pkg.credits;
    }
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

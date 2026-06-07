import type { AgencyPlanId, BillingInterval } from "@/lib/agency-plans";

/** Primary env key first; optional aliases for legacy Vercel naming. */
export const AGENCY_STRIPE_PRICE_ENV_KEYS: Record<
  AgencyPlanId,
  Record<BillingInterval, readonly string[]>
> = {
  starter: {
    monthly: ["STRIPE_AGENCY_STARTER_MONTHLY"],
    yearly: ["STRIPE_AGENCY_STARTER_YEARLY"],
  },
  pro: {
    monthly: ["STRIPE_AGENCY_PRO_MONTHLY"],
    yearly: ["STRIPE_AGENCY_PRO_YEARLY"],
  },
  enterprise: {
    monthly: [
      "STRIPE_AGENCY_ENTERPRISE_MONTHLY",
      "NEXT_PUBLIC_STRIPE_AGENCY_ENTERPRISE_MONTHLY",
    ],
    yearly: [
      "STRIPE_AGENCY_ENTERPRISE_YEARLY",
      "NEXT_PUBLIC_STRIPE_AGENCY_ENTERPRISE_YEARLY",
    ],
  },
};

function resolveEnvValue(keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function getExpectedAgencyStripePriceEnvName(
  planId: AgencyPlanId,
  interval: BillingInterval
): string {
  return AGENCY_STRIPE_PRICE_ENV_KEYS[planId][interval][0];
}

/** Server-side only — STRIPE_AGENCY_* is not exposed to the browser. */
export function getAgencyStripePriceId(
  planId: AgencyPlanId,
  interval: BillingInterval
): string | undefined {
  return resolveEnvValue(AGENCY_STRIPE_PRICE_ENV_KEYS[planId][interval]);
}

export function planFromAgencyStripePriceId(
  priceId: string
): AgencyPlanId | null {
  for (const planId of Object.keys(AGENCY_STRIPE_PRICE_ENV_KEYS) as AgencyPlanId[]) {
    for (const interval of ["monthly", "yearly"] as const) {
      if (getAgencyStripePriceId(planId, interval) === priceId) {
        return planId;
      }
    }
  }
  return null;
}

export function logMissingAgencyStripePriceId(
  planId: AgencyPlanId,
  interval: BillingInterval
): void {
  console.error("Missing Stripe price id", {
    plan: planId,
    billingInterval: interval,
    expectedEnvName: getExpectedAgencyStripePriceEnvName(planId, interval),
  });
}

export const AGENCY_CHECKOUT_UNAVAILABLE_MESSAGE =
  "Dieser Plan ist aktuell nicht verfügbar. Bitte kontaktiere den Support.";

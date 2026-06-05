export type AgencyPlanId = "starter" | "pro" | "enterprise";

export type BillingInterval = "monthly" | "yearly";

export type AgencyPlan = {
  id: AgencyPlanId;
  name: string;
  monthlyPriceEur: number;
  yearlyPricePerMonthEur: number;
  maxSeats: number;
  creditsPool: number;
  customDomain: boolean;
  hidePoweredBy: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  popular?: boolean;
  stripeMonthlyEnv: string;
  stripeYearlyEnv: string;
};

export const AGENCY_PLAN_ORDER: AgencyPlanId[] = [
  "starter",
  "pro",
  "enterprise",
];

export const AGENCY_PLANS: Record<AgencyPlanId, AgencyPlan> = {
  starter: {
    id: "starter",
    name: "Starter Agency",
    monthlyPriceEur: 49,
    yearlyPricePerMonthEur: 39,
    maxSeats: 10,
    creditsPool: 500,
    customDomain: false,
    hidePoweredBy: false,
    prioritySupport: false,
    apiAccess: false,
    stripeMonthlyEnv: "STRIPE_AGENCY_STARTER_MONTHLY",
    stripeYearlyEnv: "STRIPE_AGENCY_STARTER_YEARLY",
  },
  pro: {
    id: "pro",
    name: "Pro Agency",
    monthlyPriceEur: 149,
    yearlyPricePerMonthEur: 119,
    maxSeats: 50,
    creditsPool: 2000,
    customDomain: false,
    hidePoweredBy: true,
    prioritySupport: true,
    apiAccess: false,
    popular: true,
    stripeMonthlyEnv: "STRIPE_AGENCY_PRO_MONTHLY",
    stripeYearlyEnv: "STRIPE_AGENCY_PRO_YEARLY",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyPriceEur: 499,
    yearlyPricePerMonthEur: 399,
    maxSeats: 9999,
    creditsPool: 10000,
    customDomain: true,
    hidePoweredBy: true,
    prioritySupport: true,
    apiAccess: true,
    stripeMonthlyEnv: "STRIPE_AGENCY_ENTERPRISE_MONTHLY",
    stripeYearlyEnv: "STRIPE_AGENCY_ENTERPRISE_YEARLY",
  },
};

/** @deprecated use monthlyPriceEur */
export function agencyPlanLegacyPrice(plan: AgencyPlan): {
  priceEur: number;
  priceCents: number;
} {
  return {
    priceEur: plan.monthlyPriceEur,
    priceCents: Math.round(plan.monthlyPriceEur * 100),
  };
}

export function getAgencyStripePriceId(
  planId: AgencyPlanId,
  interval: BillingInterval
): string | undefined {
  const plan = AGENCY_PLANS[planId];
  const key =
    interval === "yearly" ? plan.stripeYearlyEnv : plan.stripeMonthlyEnv;
  return process.env[key];
}

export function planFromStripePriceId(priceId: string): AgencyPlanId | null {
  for (const plan of Object.values(AGENCY_PLANS)) {
    if (process.env[plan.stripeMonthlyEnv] === priceId) return plan.id;
    if (process.env[plan.stripeYearlyEnv] === priceId) return plan.id;
  }
  return null;
}

export const AGENCY_CREDITS_PACKAGES = [
  {
    id: "pool_500",
    credits: 500,
    priceCents: 19900,
    label: "500 Credits Pool",
  },
  {
    id: "pool_2000",
    credits: 2000,
    priceCents: 69900,
    label: "2000 Credits Pool",
  },
] as const;

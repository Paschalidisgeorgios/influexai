export type AgencyPlanId = "starter" | "pro" | "enterprise";

export type AgencyPlan = {
  id: AgencyPlanId;
  name: string;
  priceEur: number;
  priceCents: number;
  maxSeats: number;
  customDomain: boolean;
  hidePoweredBy: boolean;
  stripePriceEnv: string;
};

export const AGENCY_PLANS: Record<AgencyPlanId, AgencyPlan> = {
  starter: {
    id: "starter",
    name: "Starter Agency",
    priceEur: 49,
    priceCents: 4900,
    maxSeats: 10,
    customDomain: false,
    hidePoweredBy: false,
    stripePriceEnv: "STRIPE_PRICE_AGENCY_STARTER",
  },
  pro: {
    id: "pro",
    name: "Pro Agency",
    priceEur: 149,
    priceCents: 14900,
    maxSeats: 50,
    customDomain: false,
    hidePoweredBy: false,
    stripePriceEnv: "STRIPE_PRICE_AGENCY_PRO",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceEur: 499,
    priceCents: 49900,
    maxSeats: 9999,
    customDomain: true,
    hidePoweredBy: true,
    stripePriceEnv: "STRIPE_PRICE_AGENCY_ENTERPRISE",
  },
};

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

export function planFromStripePriceId(priceId: string): AgencyPlanId | null {
  const map: Record<string, AgencyPlanId> = {};
  for (const p of Object.values(AGENCY_PLANS)) {
    const envId = process.env[p.stripePriceEnv];
    if (envId) map[envId] = p.id;
  }
  return map[priceId] ?? null;
}

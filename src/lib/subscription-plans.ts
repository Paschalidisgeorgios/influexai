import { hasActivePlan } from "@/lib/access";

export type SubscriptionPlanId =
  | "free"
  | "starter"
  | "creator"
  | "pro"
  | "business";

export type BillingInterval = "monthly" | "yearly";

export type SubscriptionPlan = {
  id: Exclude<SubscriptionPlanId, "free">;
  monthlyCredits: number;
  monthlyPriceEur: number;
  yearlyPricePerMonthEur: number;
  stripeMonthlyEnv: string;
  stripeYearlyEnv: string;
  popular?: boolean;
};

export const YEARLY_DISCOUNT_PERCENT = 20;

export const SUBSCRIPTION_PLANS: Record<
  Exclude<SubscriptionPlanId, "free">,
  SubscriptionPlan
> = {
  starter: {
    id: "starter",
    monthlyCredits: 50,
    monthlyPriceEur: 7.99,
    yearlyPricePerMonthEur: 7.99,
    stripeMonthlyEnv: "NEXT_PUBLIC_STRIPE_STARTER_MONTHLY",
    stripeYearlyEnv: "NEXT_PUBLIC_STRIPE_STARTER_YEARLY",
  },
  creator: {
    id: "creator",
    monthlyCredits: 300,
    monthlyPriceEur: 49,
    yearlyPricePerMonthEur: 39,
    stripeMonthlyEnv: "NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY",
    stripeYearlyEnv: "NEXT_PUBLIC_STRIPE_CREATOR_YEARLY",
    popular: true,
  },
  pro: {
    id: "pro",
    monthlyCredits: 800,
    monthlyPriceEur: 99,
    yearlyPricePerMonthEur: 79,
    stripeMonthlyEnv: "NEXT_PUBLIC_STRIPE_PRO_MONTHLY",
    stripeYearlyEnv: "NEXT_PUBLIC_STRIPE_PRO_YEARLY",
  },
  business: {
    id: "business",
    monthlyCredits: 2500,
    monthlyPriceEur: 199,
    yearlyPricePerMonthEur: 159,
    stripeMonthlyEnv: "NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY",
    stripeYearlyEnv: "NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY",
  },
};

export const SUBSCRIPTION_PLAN_ORDER: Exclude<SubscriptionPlanId, "free">[] = [
  "starter",
  "creator",
  "pro",
  "business",
];

const PLAN_RANK: Record<SubscriptionPlanId, number> = {
  free: 0,
  starter: 1,
  creator: 2,
  pro: 3,
  business: 4,
};

/** Client-safe price ID map (NEXT_PUBLIC_* inlined at build) */
function readPublicPriceId(key: string | undefined): string | undefined {
  const trimmed = key?.trim();
  return trimmed || undefined;
}

export const CLIENT_STRIPE_PRICE_IDS: Record<
  Exclude<SubscriptionPlanId, "free">,
  Record<BillingInterval, string | undefined>
> = {
  starter: {
    monthly: readPublicPriceId(process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY),
    yearly: readPublicPriceId(process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY),
  },
  creator: {
    monthly: readPublicPriceId(process.env.NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY),
    yearly: readPublicPriceId(process.env.NEXT_PUBLIC_STRIPE_CREATOR_YEARLY),
  },
  pro: {
    monthly: readPublicPriceId(process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY),
    yearly: readPublicPriceId(process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY),
  },
  business: {
    monthly: readPublicPriceId(process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY),
    yearly: readPublicPriceId(process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY),
  },
};

export function normalizePlan(plan: string | null | undefined): SubscriptionPlanId {
  if (
    plan === "starter" ||
    plan === "creator" ||
    plan === "pro" ||
    plan === "business"
  ) {
    return plan;
  }
  return "free";
}

export function planMeetsRequirement(
  userPlan: string | null | undefined,
  _requiredPlan?: SubscriptionPlanId
): boolean {
  return hasActivePlan({ plan: userPlan });
}

export function getPlanMonthlyCredits(plan: string | null | undefined): number {
  const id = normalizePlan(plan);
  if (id === "free") return 50;
  return SUBSCRIPTION_PLANS[id].monthlyCredits;
}

export function getPlanDisplayName(plan: string | null | undefined): string {
  const id = normalizePlan(plan);
  if (id === "free") return "Free";
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export function getStripePriceId(
  plan: Exclude<SubscriptionPlanId, "free">,
  interval: BillingInterval
): string | undefined {
  const fromClient = CLIENT_STRIPE_PRICE_IDS[plan][interval];
  if (fromClient) return fromClient;

  const config = SUBSCRIPTION_PLANS[plan];
  const legacyKey =
    interval === "yearly"
      ? config.stripeYearlyEnv.replace("NEXT_PUBLIC_STRIPE_", "STRIPE_PRICE_")
      : config.stripeMonthlyEnv.replace("NEXT_PUBLIC_STRIPE_", "STRIPE_PRICE_");
  return readPublicPriceId(process.env[legacyKey]);
}

export function getClientStripePriceId(
  plan: Exclude<SubscriptionPlanId, "free">,
  interval: BillingInterval
): string | undefined {
  return CLIENT_STRIPE_PRICE_IDS[plan][interval];
}

export function displayPrice(
  plan: Exclude<SubscriptionPlanId, "free">,
  interval: BillingInterval
): number {
  const config = SUBSCRIPTION_PLANS[plan];
  return interval === "yearly"
    ? config.yearlyPricePerMonthEur
    : config.monthlyPriceEur;
}

/** Lowest Starter €/month — matches the cheapest row in the pricing table. */
export function getStarterFromPriceEur(): number {
  const starter = SUBSCRIPTION_PLANS.starter;
  return Math.min(starter.monthlyPriceEur, starter.yearlyPricePerMonthEur);
}

/** Format plan price for UI copy (DE: comma decimal, EN: dot). */
export function formatPlanPrice(amount: number, locale?: string | null): string {
  const formatted = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2);
  return locale === "en" ? formatted : formatted.replace(".", ",");
}

export const EXTRA_CREDIT_UNIT_EUR = 12;
export const EXTRA_CREDIT_UNIT_CENTS = 1200;
export const EXTRA_CREDITS_PER_UNIT = 100;
/** @deprecated Use STRIPE_CREDITS_* env vars in credit-packages.ts */
export const STRIPE_EXTRA_CREDITS_ENV = "STRIPE_CREDITS_50";

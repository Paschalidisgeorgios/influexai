import {
  normalizePlan,
  planMeetsRequirement,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans";

/** Documented daily limits (API access requires Business). */
export const API_RATE_LIMIT_PRO_PER_DAY = 100;
export const API_RATE_LIMIT_BUSINESS_PER_DAY = 1000;

export function getDailyRateLimitForPlan(
  plan: string | null | undefined
): number {
  const normalized = normalizePlan(plan);
  if (planMeetsRequirement(normalized, "business")) {
    return API_RATE_LIMIT_BUSINESS_PER_DAY;
  }
  if (planMeetsRequirement(normalized, "pro")) {
    return API_RATE_LIMIT_PRO_PER_DAY;
  }
  return 0;
}

export function canUsePublicApi(plan: string | null | undefined): boolean {
  return planMeetsRequirement(normalizePlan(plan), "business");
}

export function startOfUtcDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export function planLabel(plan: SubscriptionPlanId): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

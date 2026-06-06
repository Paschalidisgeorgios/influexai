import { hasActivePlan, type AccessUser } from "@/lib/access";
import { normalizePlan, type SubscriptionPlanId } from "@/lib/subscription-plans";

/** Documented daily limits — any paid plan may use the API. */
export const API_RATE_LIMIT_PRO_PER_DAY = 100;
export const API_RATE_LIMIT_BUSINESS_PER_DAY = 1000;

export function getDailyRateLimitForPlan(
  user: AccessUser | string | null | undefined
): number {
  const accessUser: AccessUser =
    typeof user === "string" || user == null ? { plan: user ?? "free" } : user;
  if (!hasActivePlan(accessUser)) return 0;
  const plan = normalizePlan(accessUser.plan);
  if (plan === "business") return API_RATE_LIMIT_BUSINESS_PER_DAY;
  return API_RATE_LIMIT_PRO_PER_DAY;
}

export function canUsePublicApi(user: AccessUser | string | null | undefined): boolean {
  const accessUser: AccessUser =
    typeof user === "string" || user == null ? { plan: user ?? "free" } : user;
  return hasActivePlan(accessUser);
}

export function startOfUtcDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export function planLabel(plan: SubscriptionPlanId): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

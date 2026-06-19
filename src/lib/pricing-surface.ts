import {
  CREDIT_PACKAGES,
  type CreditPackage,
  type CreditPackageId,
} from "@/lib/credit-packages";
import {
  SUBSCRIPTION_PLAN_ORDER,
  SUBSCRIPTION_PLANS,
  formatPlanPrice,
  type BillingInterval,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans";
import { getCreditDisplayMeta } from "@/lib/tools/credit-display";

export type SubscriptionPlanDisplay = {
  id: Exclude<SubscriptionPlanId, "free">;
  monthlyPriceEur: number;
  monthlyCredits: number;
  priceLabel: string;
  creditsLabel: string;
};

export type CreditPackDisplay = {
  id: CreditPackageId;
  credits: number;
  priceEur: number;
  priceLabel: string;
  creditsLabel: string;
};

const STALE_PRICING_PATTERNS = [
  /€4[,.]99/i,
  /€5\s*\(\s*50\s*credits?\s*\)/i,
  /€5\s*\/\s*50\s*credits?/i,
  /5\s*€\s*\(\s*50/i,
] as const;

export function formatMonthlyCreditsLabel(credits: number): string {
  return `${credits.toLocaleString("de-DE")} Credits / Monat`;
}

export function getSubscriptionPlanDisplay(
  planId: Exclude<SubscriptionPlanId, "free">,
  interval: BillingInterval = "monthly"
): SubscriptionPlanDisplay {
  const plan = SUBSCRIPTION_PLANS[planId];
  const monthlyPriceEur =
    interval === "yearly" ? plan.yearlyPricePerMonthEur : plan.monthlyPriceEur;

  return {
    id: planId,
    monthlyPriceEur,
    monthlyCredits: plan.monthlyCredits,
    priceLabel: `€${formatPlanPrice(monthlyPriceEur)}`,
    creditsLabel: formatMonthlyCreditsLabel(plan.monthlyCredits),
  };
}

export function listSubscriptionPlanDisplays(
  interval: BillingInterval = "monthly"
): SubscriptionPlanDisplay[] {
  return SUBSCRIPTION_PLAN_ORDER.map((id) =>
    getSubscriptionPlanDisplay(id, interval)
  );
}

export function getCreditPackDisplay(pkg: CreditPackage): CreditPackDisplay {
  return {
    id: pkg.id,
    credits: pkg.credits,
    priceEur: pkg.priceNumeric,
    priceLabel: `€${pkg.priceNumeric.toFixed(2).replace(".", ",")}`,
    creditsLabel: `${pkg.credits} Credits`,
  };
}

export function listCreditPackDisplays(): CreditPackDisplay[] {
  return CREDIT_PACKAGES.map(getCreditPackDisplay);
}

/** True on public/client surfaces when Stripe test mode should be disclosed (not production). */
export function shouldShowStripeTestModeNotice(): boolean {
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV?.trim();
  if (vercelEnv === "production") return false;

  const stripeMode = process.env.NEXT_PUBLIC_STRIPE_MODE?.trim().toLowerCase();
  if (stripeMode === "test") return true;

  return process.env.NODE_ENV === "development";
}

export function containsStalePricingCopy(text: string): boolean {
  return STALE_PRICING_PATTERNS.some((pattern) => pattern.test(text));
}

export function isDynamicCreditToolDisplay(toolId: string): boolean {
  return getCreditDisplayMeta(toolId).isDynamic === true;
}

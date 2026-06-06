import {
  formatPlanPrice,
  getStarterFromPriceEur,
  SUBSCRIPTION_PLANS,
} from "@/lib/subscription-plans";

/** Re-export — Starter is the lowest plan row in the pricing table. */
export { formatPlanPrice, getStarterFromPriceEur, SUBSCRIPTION_PLANS };

/** ICU `{price}` params for landing copy, modals, and agent strings. */
export function getStarterPriceParams(locale?: string | null): { price: string } {
  return { price: formatPlanPrice(getStarterFromPriceEur(), locale) };
}

/** Formatted Starter €/month for inline German copy (e.g. Melodia prompts). */
export function formatStarterFromPrice(locale?: string | null): string {
  return formatPlanPrice(getStarterFromPriceEur(), locale);
}

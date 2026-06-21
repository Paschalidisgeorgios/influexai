/**
 * Detect placeholder / template Stripe price IDs in env values.
 * Real Stripe test price IDs may start with price_ (not necessarily price_test_).
 */
export function isPlaceholderPriceId(value) {
  if (!value || typeof value !== "string") return false;
  const v = value.trim();
  if (!v.startsWith("price_")) return true;
  const lower = v.toLowerCase();
  if (lower.includes("xxx")) return true;
  if (lower.includes("your_")) return true;
  if (lower.endsWith("_key")) return true;
  if (v === "price_test_xxx") return true;
  if (/^price_test_+$/.test(v)) return true;
  return false;
}

export function priceIdEnvStatus(value) {
  if (!value?.trim()) return "missing";
  if (isPlaceholderPriceId(value)) return "invalid_placeholder";
  if (value.trim().startsWith("price_")) return "price_id_set";
  return "invalid_format";
}

export const ACTIVE_CREDIT_PRICE_KEYS = [
  "STRIPE_CREDITS_25",
  "STRIPE_CREDITS_50",
  "STRIPE_CREDITS_150",
  "STRIPE_CREDITS_350",
  "STRIPE_CREDITS_800",
];

export function hasInvalidCheckoutPriceIds(report) {
  const subscription = Object.values(report.subscriptionPriceIds ?? {});
  const creditActive = ACTIVE_CREDIT_PRICE_KEYS.map(
    (key) => report.creditPackPriceIds?.[key]
  );

  const all = [...subscription, ...creditActive];
  return all.some(
    (status) =>
      status === "missing" || status === "invalid_placeholder" || status === "invalid_format"
  );
}

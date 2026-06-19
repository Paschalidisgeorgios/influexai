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

export function hasInvalidCheckoutPriceIds(report) {
  const subscription = Object.values(report.subscriptionPriceIds ?? {});
  const creditRequired = [report.creditPack25];
  const creditOptionalLegacy =
    report.creditPack25 === "price_id_set"
      ? []
      : [report.creditPackPriceIds?.STRIPE_CREDITS_50].filter(Boolean);

  const creditOther = ["STRIPE_CREDITS_150", "STRIPE_CREDITS_350", "STRIPE_CREDITS_800"]
    .map((key) => report.creditPackPriceIds?.[key])
    .filter(Boolean);

  const all = [...subscription, ...creditRequired, ...creditOptionalLegacy, ...creditOther];
  return all.some(
    (status) =>
      status === "missing" || status === "invalid_placeholder" || status === "invalid_format"
  );
}

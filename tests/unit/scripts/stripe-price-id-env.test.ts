import { describe, it, expect } from "vitest";
import {
  hasInvalidCheckoutPriceIds,
  isPlaceholderPriceId,
  priceIdEnvStatus,
} from "../../../scripts/lib/stripe-price-id-env.mjs";

describe("stripe price id env helpers", () => {
  it("flags template placeholders", () => {
    expect(isPlaceholderPriceId("price_test_xxx")).toBe(true);
    expect(isPlaceholderPriceId("price_xxx")).toBe(true);
    expect(isPlaceholderPriceId("YOUR_PRICE_ID")).toBe(true);
  });

  it("accepts real-looking price ids without xxx", () => {
    expect(isPlaceholderPriceId("price_1Q2w3E4r5T6y7U8i")).toBe(false);
    expect(priceIdEnvStatus("price_1Q2w3E4r5T6y7U8i")).toBe("price_id_set");
  });

  it("detects invalid checkout config", () => {
    const bad = hasInvalidCheckoutPriceIds({
      subscriptionPriceIds: {
        NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY: "price_id_set",
      },
      creditPackPriceIds: {
        STRIPE_CREDITS_25: "invalid_placeholder",
      },
    });
    expect(bad).toBe(true);
  });
});

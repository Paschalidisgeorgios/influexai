import { describe, it, expect } from "vitest";
import {
  isStripeMissingPriceError,
} from "@/lib/stripe-checkout-error.server";
import {
  CHECKOUT_ERROR_CODES,
  CHECKOUT_USER_MESSAGES,
  resolveCheckoutErrorMessage,
} from "@/lib/checkout-messages";

describe("stripe checkout missing price errors", () => {
  it("detects Stripe resource_missing price errors", () => {
    expect(
      isStripeMissingPriceError({
        code: "resource_missing",
        param: "line_items[0][price]",
      })
    ).toBe(true);
    expect(isStripeMissingPriceError({ code: "resource_missing" })).toBe(false);
  });

  it("maps MISSING_PRICE_ID API code to user message", () => {
    expect(
      resolveCheckoutErrorMessage(
        {
          code: CHECKOUT_ERROR_CODES.missingPriceId,
          error: "ignored",
        },
        503
      )
    ).toBe(CHECKOUT_USER_MESSAGES.missingConfig);
  });
});

import { describe, expect, it } from "vitest";
import { shouldGrantSubscriptionRenewalCredits } from "@/lib/stripe-subscription-invoice.server";

describe("shouldGrantSubscriptionRenewalCredits", () => {
  it("grants only on subscription_cycle (renewal)", () => {
    expect(shouldGrantSubscriptionRenewalCredits("subscription_cycle")).toBe(
      true
    );
  });

  it("blocks initial subscription_create invoice (no double credit)", () => {
    expect(shouldGrantSubscriptionRenewalCredits("subscription_create")).toBe(
      false
    );
  });

  it("blocks subscription_update and other reasons", () => {
    expect(shouldGrantSubscriptionRenewalCredits("subscription_update")).toBe(
      false
    );
    expect(shouldGrantSubscriptionRenewalCredits("manual")).toBe(false);
    expect(shouldGrantSubscriptionRenewalCredits(null)).toBe(false);
    expect(shouldGrantSubscriptionRenewalCredits(undefined)).toBe(false);
  });
});

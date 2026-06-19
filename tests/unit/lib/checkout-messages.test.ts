import { describe, it, expect } from "vitest";
import {
  CHECKOUT_ERROR_CODES,
  CHECKOUT_USER_MESSAGES,
  isSafeCheckoutUserMessage,
  resolveCheckoutErrorMessage,
} from "@/lib/checkout-messages";

describe("resolveCheckoutErrorMessage", () => {
  it("maps DEV_WRITE_GUARD_BLOCKED to safe dev message", () => {
    const message = resolveCheckoutErrorMessage(
      { code: CHECKOUT_ERROR_CODES.devWriteGuard },
      403
    );
    expect(message).toBe(CHECKOUT_USER_MESSAGES.devWriteGuardBlocked);
    expect(message).not.toBe(CHECKOUT_USER_MESSAGES.runtimeBlocked);
  });

  it("maps STRIPE_RUNTIME_CONFIG_BLOCKED to stripe runtime message", () => {
    const message = resolveCheckoutErrorMessage(
      { code: CHECKOUT_ERROR_CODES.stripeRuntimeBlocked },
      503
    );
    expect(message).toBe(CHECKOUT_USER_MESSAGES.stripeRuntimeBlocked);
  });

  it("maps PLAN_REQUIRED_FOR_CREDITS to plan required message", () => {
    const message = resolveCheckoutErrorMessage(
      { code: CHECKOUT_ERROR_CODES.planRequired },
      403
    );
    expect(message).toBe(CHECKOUT_USER_MESSAGES.planRequired);
    expect(message).toContain("Zusatz-Credits");
  });

  it("maps MISSING_PRICE_ID code to missing config message", () => {
    const message = resolveCheckoutErrorMessage(
      { code: CHECKOUT_ERROR_CODES.missingPriceId, error: "Stripe Price ID" },
      400
    );
    expect(message).toBe(CHECKOUT_USER_MESSAGES.missingConfig);
  });

  it("maps 400 Price ID errors to missing config message", () => {
    const message = resolveCheckoutErrorMessage(
      { error: "Stripe Price ID nicht konfiguriert" },
      400
    );
    expect(message).toBe(CHECKOUT_USER_MESSAGES.missingConfig);
  });

  it("does not expose secrets in mapped messages", () => {
    const cases = [
      resolveCheckoutErrorMessage({ code: CHECKOUT_ERROR_CODES.devWriteGuard }, 403),
      resolveCheckoutErrorMessage(
        { code: CHECKOUT_ERROR_CODES.stripeRuntimeBlocked },
        503
      ),
      resolveCheckoutErrorMessage({ code: CHECKOUT_ERROR_CODES.planRequired }, 403),
      CHECKOUT_USER_MESSAGES.missingConfig,
    ];
    for (const message of cases) {
      expect(isSafeCheckoutUserMessage(message)).toBe(true);
    }
  });
});

describe("isSafeCheckoutUserMessage", () => {
  it("rejects strings that look like secrets", () => {
    expect(isSafeCheckoutUserMessage("sk_test_abc123")).toBe(false);
    expect(isSafeCheckoutUserMessage("pk_live_xyz")).toBe(false);
    expect(isSafeCheckoutUserMessage("whsec_secret")).toBe(false);
  });
});

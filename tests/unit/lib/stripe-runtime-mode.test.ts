import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  assertStripeCheckoutRuntimeAllowed,
  assertStripeWebhookRuntimeAllowed,
  getStripeRuntimeMode,
  isStripeEventModeAllowed,
  StripeRuntimeConfigError,
  STRIPE_RUNTIME_CONFIG_ERROR_CODE,
} from "@/lib/stripe-runtime-mode.server";

const TEST_SECRET = "sk_test_runtime_mode_unit_test_placeholder";
const LIVE_SECRET = "sk_live_runtime_mode_unit_test_placeholder";

function setSafeDevStripeEnv() {
  vi.stubEnv("VERCEL_ENV", "development");
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("STRIPE_MODE", "test");
  vi.stubEnv("STRIPE_SECRET_KEY", TEST_SECRET);
}

describe("stripe runtime mode", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows non-production with STRIPE_MODE=test and sk_test_", () => {
    setSafeDevStripeEnv();
    const mode = getStripeRuntimeMode();

    expect(mode.checkoutAllowed).toBe(true);
    expect(mode.webhookAllowed).toBe(true);
    expect(() => assertStripeCheckoutRuntimeAllowed()).not.toThrow();
    expect(() => assertStripeWebhookRuntimeAllowed()).not.toThrow();
  });

  it("blocks sk_live_ in non-production", () => {
    setSafeDevStripeEnv();
    vi.stubEnv("STRIPE_SECRET_KEY", LIVE_SECRET);

    const mode = getStripeRuntimeMode();
    expect(mode.checkoutAllowed).toBe(false);
    expect(() => assertStripeCheckoutRuntimeAllowed()).toThrow(
      StripeRuntimeConfigError
    );
    expect(mode.blockReason).toMatch(/Live Secret Key|STRIPE_MODE=test/i);
  });

  it("blocks STRIPE_MODE=test with sk_live_", () => {
    setSafeDevStripeEnv();
    vi.stubEnv("STRIPE_SECRET_KEY", LIVE_SECRET);

    expect(() => assertStripeCheckoutRuntimeAllowed()).toThrow(
      StripeRuntimeConfigError
    );

    try {
      assertStripeCheckoutRuntimeAllowed();
    } catch (error) {
      expect(error).toBeInstanceOf(StripeRuntimeConfigError);
      const message = (error as Error).message;
      expect(message).toMatch(/STRIPE_MODE=test/i);
      expect(message).not.toContain(LIVE_SECRET);
      expect(message).not.toMatch(/sk_live_/);
    }
  });

  it("blocks STRIPE_MODE=live in VERCEL_ENV=development", () => {
    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("STRIPE_MODE", "live");
    vi.stubEnv("STRIPE_SECRET_KEY", TEST_SECRET);

    const mode = getStripeRuntimeMode();
    expect(mode.checkoutAllowed).toBe(false);
    expect(mode.blockReason).toMatch(/STRIPE_MODE=live/i);
  });

  it("returns safe config error when STRIPE_SECRET_KEY is missing", () => {
    setSafeDevStripeEnv();
    vi.stubEnv("STRIPE_SECRET_KEY", "");

    expect(() => assertStripeCheckoutRuntimeAllowed()).toThrow(
      StripeRuntimeConfigError
    );

    try {
      assertStripeCheckoutRuntimeAllowed();
    } catch (error) {
      expect((error as StripeRuntimeConfigError).code).toBe(
        STRIPE_RUNTIME_CONFIG_ERROR_CODE
      );
      expect((error as Error).message).not.toMatch(/sk_(test|live)_/);
    }
  });

  it("blocks event.livemode=true in non-production", () => {
    setSafeDevStripeEnv();
    const check = isStripeEventModeAllowed(true);

    expect(check.allowed).toBe(false);
    expect(check.reason).toMatch(/Live-Mode Stripe Events/i);
    expect(check.reason).not.toContain(TEST_SECRET);
  });

  it("allows event.livemode=false in test/non-production", () => {
    setSafeDevStripeEnv();
    const check = isStripeEventModeAllowed(false);

    expect(check.allowed).toBe(true);
    expect(check.reason).toBeNull();
  });

  it("blocks test events in production with live mode", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("STRIPE_MODE", "live");
    vi.stubEnv("STRIPE_SECRET_KEY", LIVE_SECRET);

    const check = isStripeEventModeAllowed(false);
    expect(check.allowed).toBe(false);
    expect(check.reason).toMatch(/Test-Mode Stripe Events/i);
  });

  it("error messages never include secret key material", () => {
    setSafeDevStripeEnv();
    vi.stubEnv("STRIPE_SECRET_KEY", LIVE_SECRET);

    const cases = [
      () => assertStripeCheckoutRuntimeAllowed(),
      () => assertStripeWebhookRuntimeAllowed(),
    ];

    for (const run of cases) {
      try {
        run();
      } catch (error) {
        const message = (error as Error).message;
        expect(message).not.toContain(LIVE_SECRET);
        expect(message).not.toMatch(/sk_live_[A-Za-z0-9]+/);
      }
    }
  });
});

describe("checkout runtime guard integration", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("credit checkout path rejects unsafe runtime before Stripe client use", () => {
    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv("STRIPE_MODE", "test");
    vi.stubEnv("STRIPE_SECRET_KEY", LIVE_SECRET);

    expect(() =>
      assertStripeCheckoutRuntimeAllowed("credit_pack_checkout")
    ).toThrow(StripeRuntimeConfigError);
  });

  it("subscribe checkout path rejects unsafe runtime before Stripe client use", () => {
    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv("STRIPE_MODE", "live");
    vi.stubEnv("STRIPE_SECRET_KEY", TEST_SECRET);

    expect(() =>
      assertStripeCheckoutRuntimeAllowed("platform_subscription_checkout")
    ).toThrow(StripeRuntimeConfigError);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("assessSafeDevStripeTestCheckout", () => {
  const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...envBackup, NODE_ENV: "development" };
    process.env.VERCEL_ENV = "development";
    process.env.STRIPE_MODE = "test";
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_example";
    process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${STAGING_REF}.supabase.co`;
    process.env.PROVIDERS_DISABLED = "true";
    process.env.ALLOW_SAFE_DEV_STRIPE_TEST_CHECKOUT = "true";
  });

  afterEach(() => {
    process.env = envBackup;
    vi.resetModules();
  });

  it("allows safe checkout when all staging test conditions match", async () => {
    const { assessSafeDevStripeTestCheckout } = await import(
      "@/lib/environment-safety.server"
    );
    expect(assessSafeDevStripeTestCheckout()).toEqual({
      allowed: true,
      blockReasons: [],
    });
  });

  it("blocks when override flag is not active", async () => {
    delete process.env.ALLOW_SAFE_DEV_STRIPE_TEST_CHECKOUT;
    const { assessSafeDevStripeTestCheckout } = await import(
      "@/lib/environment-safety.server"
    );
    const result = assessSafeDevStripeTestCheckout();
    expect(result.allowed).toBe(false);
    expect(result.blockReasons).toContain("override_not_active");
  });

  it("blocks live stripe secret even with override", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_example";
    const { assessSafeDevStripeTestCheckout } = await import(
      "@/lib/environment-safety.server"
    );
    const result = assessSafeDevStripeTestCheckout();
    expect(result.allowed).toBe(false);
    expect(result.blockReasons).toContain("stripe_secret_not_test");
  });

  it("checkoutWriteGuardResponse bypasses dev guard when safe override is active", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-present";
    const { checkoutWriteGuardResponse, developmentWriteGuardResponse } =
      await import("@/lib/environment-safety.server");
    expect(developmentWriteGuardResponse()).not.toBeNull();
    expect(checkoutWriteGuardResponse()).toBeNull();
  });

  it("checkoutWriteGuardResponse still blocks without safe override", async () => {
    delete process.env.ALLOW_SAFE_DEV_STRIPE_TEST_CHECKOUT;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-present";
    const { checkoutWriteGuardResponse } = await import(
      "@/lib/environment-safety.server"
    );
    expect(checkoutWriteGuardResponse()).not.toBeNull();
  });
});

describe("detectProductionLikeSignals", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = envBackup;
    vi.resetModules();
  });

  it("flags service_role_present without exposing the key", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "present-but-not-logged";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://jvjmqtxlqfqaoyjklpxh.supabase.co";
    const { detectProductionLikeSignals } = await import(
      "@/lib/environment-safety.server"
    );
    expect(detectProductionLikeSignals()).toContain("service_role_present");
  });
});

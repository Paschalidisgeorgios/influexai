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

describe("assessSafeDevProviderSmoke", () => {
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
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-present";
    process.env.PROVIDERS_DISABLED = "false";
    process.env.FAL_API_KEY = "fal_test_key_example";
    process.env.ALLOW_SAFE_DEV_PROVIDER_SMOKE = "true";
  });

  afterEach(() => {
    process.env = envBackup;
    vi.resetModules();
  });

  it("allows generate-image smoke when all staging-safe conditions match", async () => {
    const { assessSafeDevProviderSmoke } = await import(
      "@/lib/environment-safety.server"
    );
    expect(assessSafeDevProviderSmoke()).toEqual({
      allowed: true,
      blockReasons: [],
    });
  });

  it("blocks when override flag is not active", async () => {
    delete process.env.ALLOW_SAFE_DEV_PROVIDER_SMOKE;
    const { assessSafeDevProviderSmoke } = await import(
      "@/lib/environment-safety.server"
    );
    const result = assessSafeDevProviderSmoke();
    expect(result.allowed).toBe(false);
    expect(result.blockReasons).toContain("override_not_active");
  });

  it("blocks when providers are disabled", async () => {
    process.env.PROVIDERS_DISABLED = "true";
    const { assessSafeDevProviderSmoke } = await import(
      "@/lib/environment-safety.server"
    );
    const result = assessSafeDevProviderSmoke();
    expect(result.allowed).toBe(false);
    expect(result.blockReasons).toContain("providers_disabled");
  });

  it("blocks production supabase ref even with override", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      "https://hszjafdelcydnppyolkm.supabase.co";
    const { assessSafeDevProviderSmoke } = await import(
      "@/lib/environment-safety.server"
    );
    const result = assessSafeDevProviderSmoke();
    expect(result.allowed).toBe(false);
    expect(result.blockReasons).toContain("supabase_production_ref");
  });

  it("blocks when Akool keys are present", async () => {
    process.env.AKOOL_CLIENT_ID = "akool-id";
    process.env.AKOOL_CLIENT_SECRET = "akool-secret";
    const { assessSafeDevProviderSmoke } = await import(
      "@/lib/environment-safety.server"
    );
    const result = assessSafeDevProviderSmoke();
    expect(result.allowed).toBe(false);
    expect(result.blockReasons).toContain("akool_keys_present");
  });

  it("allows Akool keys on Vercel preview during supervised smoke window", async () => {
    process.env.VERCEL_ENV = "preview";
    process.env.AKOOL_CLIENT_ID = "akool-id";
    process.env.AKOOL_CLIENT_SECRET = "akool-secret";
    process.env.ELEVENLABS_API_KEY = "elevenlabs-test-key-long";
    const { assessSafeDevProviderSmoke } = await import(
      "@/lib/environment-safety.server"
    );
    const result = assessSafeDevProviderSmoke();
    expect(result.allowed).toBe(true);
    expect(result.blockReasons).not.toContain("akool_keys_present");
    expect(result.blockReasons).not.toContain("elevenlabs_key_present");
  });

  it("generateImageProviderGuardResponse bypasses dev guard when safe override is active", async () => {
    const {
      generateImageProviderGuardResponse,
      providerRouteGuardResponse,
    } = await import("@/lib/environment-safety.server");
    expect(providerRouteGuardResponse()).not.toBeNull();
    expect(generateImageProviderGuardResponse()).toBeNull();
  });

  it("generateImageProviderGuardResponse still blocks without safe override", async () => {
    delete process.env.ALLOW_SAFE_DEV_PROVIDER_SMOKE;
    const { generateImageProviderGuardResponse } = await import(
      "@/lib/environment-safety.server"
    );
    const res = generateImageProviderGuardResponse();
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
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

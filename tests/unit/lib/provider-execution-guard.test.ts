import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("provider execution guard", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks provider routes when PROVIDERS_DISABLED=true", async () => {
    vi.stubEnv("PROVIDERS_DISABLED", "true");
    const { providerExecutionGuardResponse, PROVIDER_EXECUTION_GUARD_CODE } =
      await import("@/lib/environment-safety.server");

    const res = providerExecutionGuardResponse();
    expect(res).not.toBeNull();
    expect(res?.status).toBe(503);
    const body = await res!.json();
    expect(body.code).toBe(PROVIDER_EXECUTION_GUARD_CODE);
  });

  it("allows provider routes when PROVIDERS_DISABLED is unset", async () => {
    vi.stubEnv("PROVIDERS_DISABLED", "");
    const { providerExecutionGuardResponse } = await import(
      "@/lib/environment-safety.server"
    );

    expect(providerExecutionGuardResponse()).toBeNull();
  });

  it("providerRouteGuardResponse returns provider block before dev guard when disabled", async () => {
    vi.stubEnv("PROVIDERS_DISABLED", "true");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_should_not_matter");
    const { providerRouteGuardResponse, PROVIDER_EXECUTION_GUARD_CODE } =
      await import("@/lib/environment-safety.server");

    const res = providerRouteGuardResponse();
    expect(res?.status).toBe(503);
    const body = await res!.json();
    expect(body.code).toBe(PROVIDER_EXECUTION_GUARD_CODE);
  });

  it("critical provider API routes use providerRouteGuardResponse", () => {
    const routes = [
      "src/app/api/seedance/route.ts",
      "src/app/api/lora/train/route.ts",
      "src/app/api/agent/copilot/route.ts",
    ];
    for (const route of routes) {
      const src = readFileSync(join(process.cwd(), route), "utf8");
      expect(src).toContain("providerRouteGuardResponse");
    }
  });

  it("generate-image uses narrow generateImageProviderGuardResponse", () => {
    const src = readFileSync(
      join(process.cwd(), "src/app/api/generate-image/route.ts"),
      "utf8"
    );
    expect(src).toContain("generateImageProviderGuardResponse");
    expect(src).not.toContain("providerRouteGuardResponse");
  });
});

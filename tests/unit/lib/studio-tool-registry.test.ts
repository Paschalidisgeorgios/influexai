import { afterEach, describe, expect, it, vi } from "vitest";

describe("isStudioProviderExecutionDisabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks image-gen when NEXT_PUBLIC_PROVIDERS_DISABLED is true", async () => {
    vi.stubEnv("NEXT_PUBLIC_PROVIDERS_DISABLED", "true");
    const { isStudioProviderExecutionDisabled } = await import(
      "@/lib/tools/studio-tool-registry"
    );
    expect(isStudioProviderExecutionDisabled("image-gen")).toBe(true);
  });

  it("allows image-gen SPA execution when providers flag is false", async () => {
    vi.stubEnv("NEXT_PUBLIC_PROVIDERS_DISABLED", "false");
    const { isStudioProviderExecutionDisabled } = await import(
      "@/lib/tools/studio-tool-registry"
    );
    expect(isStudioProviderExecutionDisabled("image-gen")).toBe(false);
  });

  it("keeps other tools disabled when registry marks them disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_PROVIDERS_DISABLED", "false");
    const { isStudioProviderExecutionDisabled } = await import(
      "@/lib/tools/studio-tool-registry"
    );
    expect(isStudioProviderExecutionDisabled("text-to-video")).toBe(true);
  });
});

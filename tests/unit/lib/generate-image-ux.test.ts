import { describe, expect, it, vi } from "vitest";
import {
  GENERATE_IMAGE_PROVIDER_DISABLED_MESSAGE,
  isProviderDisabledApiResponse,
  isProvidersDisabledForGenerateImageClient,
  mapGenerateImageApiError,
  formatCreditsUsedLabel,
} from "@/lib/generate-image-ux";

describe("generate-image-ux", () => {
  it("detects client providers disabled flag", () => {
    vi.stubEnv("NEXT_PUBLIC_PROVIDERS_DISABLED", "true");
    expect(isProvidersDisabledForGenerateImageClient()).toBe(true);
    vi.unstubAllEnvs();
  });

  it("maps 503 PROVIDERS_DISABLED response", () => {
    expect(
      isProviderDisabledApiResponse(503, { code: "PROVIDERS_DISABLED" })
    ).toBe(true);
    const mapped = mapGenerateImageApiError(503, {
      code: "PROVIDERS_DISABLED",
      error: "Provider deaktiviert",
    });
    expect(mapped.isProviderDisabled).toBe(true);
    expect(mapped.message).toBe(GENERATE_IMAGE_PROVIDER_DISABLED_MESSAGE);
    expect(mapped.showRefundHint).toBe(false);
  });

  it("shows refund hint on server errors", () => {
    const mapped = mapGenerateImageApiError(500, { error: "Interner Fehler" });
    expect(mapped.showRefundHint).toBe(true);
  });

  it("hides credit used label for exempt users", () => {
    expect(formatCreditsUsedLabel(5, true)).toBeNull();
    expect(formatCreditsUsedLabel(5, false)).toBe("5 Credits verwendet");
  });
});

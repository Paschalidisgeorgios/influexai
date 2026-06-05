import { describe, it, expect } from "vitest";
import {
  API_RATE_LIMIT_BUSINESS_PER_DAY,
  API_RATE_LIMIT_PRO_PER_DAY,
  canUsePublicApi,
  getDailyRateLimitForPlan,
} from "@/lib/api-v1/rate-limits";

describe("api-v1 rate limits", () => {
  it("allows public API only for business", () => {
    expect(canUsePublicApi("free")).toBe(false);
    expect(canUsePublicApi("pro")).toBe(false);
    expect(canUsePublicApi("business")).toBe(true);
  });

  it("returns daily limits by plan", () => {
    expect(getDailyRateLimitForPlan("pro")).toBe(API_RATE_LIMIT_PRO_PER_DAY);
    expect(getDailyRateLimitForPlan("business")).toBe(
      API_RATE_LIMIT_BUSINESS_PER_DAY
    );
    expect(getDailyRateLimitForPlan("free")).toBe(0);
  });
});

import { describe, it, expect } from "vitest";
import { scoreChurnFromData, type ChurnInputData } from "@/lib/churn-score";

function baseInput(overrides: Partial<ChurnInputData> = {}): ChurnInputData {
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  return {
    generationCount: 5,
    distinctFeatureCount: 3,
    lastGenerationAt: yesterday,
    credits: 50,
    onboardingCompleted: true,
    hasPurchase: true,
    hasReferred: true,
    recentVisitsWithoutGen: false,
    ...overrides,
  };
}

describe("scoreChurnFromData", () => {
  it("returns low risk for active engaged user", () => {
    const result = scoreChurnFromData(baseInput());
    expect(result.risk).toBe("low");
    expect(result.score).toBeLessThan(26);
  });

  it("returns critical risk for inactive user with no credits", () => {
    const result = scoreChurnFromData(
      baseInput({
        generationCount: 0,
        lastGenerationAt: null,
        credits: 2,
        onboardingCompleted: false,
        hasPurchase: false,
        hasReferred: false,
        recentVisitsWithoutGen: true,
      })
    );
    expect(result.risk).toBe("critical");
    expect(result.score).toBeGreaterThan(75);
  });

  it("includes reasons array", () => {
    const result = scoreChurnFromData(baseInput({ credits: 2 }));
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("includes recommendedAction string", () => {
    const result = scoreChurnFromData(baseInput());
    expect(typeof result.recommendedAction).toBe("string");
    expect(result.recommendedAction.length).toBeGreaterThan(0);
  });

  it("recommends win-back for critical risk", () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 86400000).toISOString();
    const result = scoreChurnFromData({
      generationCount: 0,
      distinctFeatureCount: 0,
      lastGenerationAt: eightDaysAgo,
      credits: 0,
      onboardingCompleted: false,
      hasPurchase: false,
      hasReferred: false,
      recentVisitsWithoutGen: true,
    });
    expect(result.risk).toBe("critical");
    expect(result.recommendedAction).toMatch(/win-back|critical/i);
  });
});

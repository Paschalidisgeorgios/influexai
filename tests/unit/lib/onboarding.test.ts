import { describe, it, expect } from "vitest";
import { shouldRequireOnboarding } from "@/lib/onboarding";

describe("shouldRequireOnboarding", () => {
  it("returns false when onboarding completed", () => {
    expect(
      shouldRequireOnboarding(
        { onboarding_completed: true, created_at: new Date().toISOString() },
        0
      )
    ).toBe(false);
  });

  it("returns true for new user without generations", () => {
    expect(
      shouldRequireOnboarding(
        { onboarding_completed: false, created_at: new Date().toISOString() },
        0
      )
    ).toBe(true);
  });

  it("returns false when user has generations and account is older than 24h", () => {
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(
      shouldRequireOnboarding(
        { onboarding_completed: false, created_at: old },
        3
      )
    ).toBe(false);
  });
});

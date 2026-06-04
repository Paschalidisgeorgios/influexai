import { describe, it, expect } from "vitest";
import {
  generateReferralCode,
  normalizeReferralCode,
} from "@/lib/referral-code";

describe("referral-code", () => {
  it("generates 8-character codes", () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("normalizes referral codes", () => {
    expect(normalizeReferralCode(" test-code! ")).toBe("TESTCODE");
    expect(normalizeReferralCode("abc123")).toBe("ABC123");
  });
});

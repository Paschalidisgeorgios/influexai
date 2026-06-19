import { describe, it, expect } from "vitest";
import { hasActivePlan, hasPaidBillingPlan } from "@/lib/access";

describe("billing eligibility vs tool access", () => {
  const adminUser = {
    email: "test@influexai.test",
    plan: "free" as const,
    is_admin: true,
  };

  const paidUser = {
    email: "creator@example.com",
    plan: "creator" as const,
  };

  const freeUser = {
    email: "free@example.com",
    plan: "free" as const,
  };

  it("hasActivePlan grants admin bypass for tool access", () => {
    expect(hasActivePlan(adminUser)).toBe(true);
  });

  it("hasPaidBillingPlan does not grant admin bypass for billing", () => {
    expect(hasPaidBillingPlan(adminUser)).toBe(false);
  });

  it("hasPaidBillingPlan is true for paid profiles.plan", () => {
    expect(hasPaidBillingPlan(paidUser)).toBe(true);
    expect(hasActivePlan(paidUser)).toBe(true);
  });

  it("hasPaidBillingPlan is false for free plan", () => {
    expect(hasPaidBillingPlan(freeUser)).toBe(false);
    expect(hasActivePlan(freeUser)).toBe(false);
  });
});

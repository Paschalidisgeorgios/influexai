import { describe, it, expect } from "vitest";
import { buildAbResults, rateWinner, countWinner } from "@/lib/ab-stats";

describe("ab-stats", () => {
  it("builds metrics from event rows", () => {
    const results = buildAbResults([
      { variant: "a", event: "view", count: 100 },
      { variant: "a", event: "signup_click", count: 10 },
      { variant: "a", event: "signup_complete", count: 5 },
      { variant: "b", event: "view", count: 100 },
      { variant: "b", event: "signup_click", count: 20 },
      { variant: "b", event: "signup_complete", count: 12 },
    ]);

    expect(results.a.views).toBe(100);
    expect(results.a.signups).toBe(5);
    expect(results.b.clickRate).toBe(20);
    expect(results.b.conversionRate).toBe(12);
  });

  it("picks rate winner when difference > 5", () => {
    expect(rateWinner(10, 20)).toBe("b");
    expect(rateWinner(20, 10)).toBe("a");
    expect(rateWinner(10, 12)).toBe(null);
  });

  it("picks count winner", () => {
    expect(countWinner(5, 10)).toBe("b");
    expect(countWinner(10, 5)).toBe("a");
    expect(countWinner(5, 5)).toBe(null);
  });
});

import { describe, it, expect } from "vitest";

/** Mirror of supabase/functions/churn-prevention/lib.ts pickChurnEmailType */
function pickChurnEmailType(
  daysInactive: number,
  hasDay3: boolean,
  hasDay7: boolean,
  hasDay14: boolean,
  churnEmailInLast7Days: boolean
): "day3" | "day7" | "day14" | null {
  if (churnEmailInLast7Days) return null;
  if (daysInactive >= 3 && !hasDay3) return "day3";
  if (daysInactive >= 7 && hasDay3 && !hasDay7) return "day7";
  if (daysInactive >= 14 && hasDay7 && !hasDay14) return "day14";
  return null;
}

describe("pickChurnEmailType", () => {
  it("sends day3 at 3+ days inactive", () => {
    expect(pickChurnEmailType(3, false, false, false, false)).toBe("day3");
    expect(pickChurnEmailType(5, false, false, false, false)).toBe("day3");
  });

  it("blocks repeat within 7 days", () => {
    expect(pickChurnEmailType(5, false, false, false, true)).toBeNull();
  });

  it("sends day7 after day3 at 7+ days", () => {
    expect(pickChurnEmailType(7, true, false, false, false)).toBe("day7");
    expect(pickChurnEmailType(10, true, false, false, false)).toBe("day7");
  });

  it("does not skip to day7 without day3", () => {
    expect(pickChurnEmailType(10, false, false, false, false)).toBe("day3");
  });

  it("sends day14 after day7 at 14+ days", () => {
    expect(pickChurnEmailType(14, true, true, false, false)).toBe("day14");
  });

  it("does not skip to day14 without day7", () => {
    expect(pickChurnEmailType(20, true, false, false, false)).toBe("day7");
  });
});

import { describe, it, expect } from "vitest";
import { insufficientCreditsError } from "@/lib/credit-action-result";

describe("insufficientCreditsError", () => {
  it("returns structured failure", () => {
    const err = insufficientCreditsError(1, 2);
    expect(err.success).toBe(false);
    expect(err.error).toBe("Nicht genug Credits.");
    expect(err.credits).toBe(1);
    expect(err.required).toBe(2);
  });
});

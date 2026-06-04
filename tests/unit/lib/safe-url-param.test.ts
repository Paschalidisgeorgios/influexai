import { describe, expect, it } from "vitest";
import { getSafeSearchParam } from "@/lib/safe-url-param";

describe("getSafeSearchParam", () => {
  it("returns decoded topic", () => {
    const params = new URLSearchParams("topic=5%20Tipps");
    expect(getSafeSearchParam(params, "topic")).toBe("5 Tipps");
  });

  it("does not throw on lone percent (URI malformed)", () => {
    const params = new URLSearchParams();
    params.set("topic", "100%");
    expect(getSafeSearchParam(params, "topic")).toBe("100%");
  });

  it("returns empty when missing", () => {
    const params = new URLSearchParams();
    expect(getSafeSearchParam(params, "topic")).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import {
  ANTHROPIC_MODEL,
  CLAUDE_SONNET_45_MODEL,
  SCRIPT_GENERATOR_MODEL,
} from "@/lib/anthropic";

const EXPECTED = "claude-sonnet-4-5-20250929";

describe("anthropic model defaults", () => {
  it("CLAUDE_SONNET_45_MODEL is the canonical Sonnet 4.5 ID", () => {
    expect(CLAUDE_SONNET_45_MODEL).toBe(EXPECTED);
  });

  it("ANTHROPIC_MODEL defaults to Sonnet 4.5", () => {
    expect(ANTHROPIC_MODEL).toBe(EXPECTED);
  });

  it("SCRIPT_GENERATOR_MODEL defaults to Sonnet 4.5", () => {
    expect(SCRIPT_GENERATOR_MODEL).toBe(EXPECTED);
  });
});

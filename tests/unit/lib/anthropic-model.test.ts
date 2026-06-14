import { describe, expect, it } from "vitest";
import {
  ANTHROPIC_MODEL,
  CLAUDE_SONNET_45_MODEL,
  SCRIPT_GENERATOR_MODEL,
} from "@/lib/anthropic";
import { LANDING_DEMO_MODEL } from "@/lib/claude-landing-demo";
import { CLAUDE_PREMIUM_MODEL } from "@/lib/claude-premium-generate";

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

  it("CLAUDE_PREMIUM_MODEL defaults to Sonnet 4.5", () => {
    expect(CLAUDE_PREMIUM_MODEL).toBe(EXPECTED);
  });

  it("LANDING_DEMO_MODEL defaults to Sonnet 4.5", () => {
    expect(LANDING_DEMO_MODEL).toBe(EXPECTED);
  });
});

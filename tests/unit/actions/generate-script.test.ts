import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateScript } from "@/app/actions/generate-script";
import { requireKiToolAccessForAction } from "@/lib/access.server";
import { mockRequireKiToolAccessForAction } from "../helpers/ki-tool-access-mock";

vi.mock("@/lib/access.server", () => ({
  requireKiToolAccessForAction: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn().mockResolvedValue("de"),
}));

vi.mock("@/lib/e2e-mock-generations", () => ({
  isE2eMockGenerationsEnabled: vi.fn(() => true),
  e2eMockScript: vi.fn((topic: string) => ({
    script: `[HOOK]\n${topic}\n\n[MAIN]\nBody\n\n[CTA]\nCTA`,
    hookVariants: ["A", "B", "C"],
    wordCount: 10,
    estimatedSeconds: 8,
    toneDescription: "Test",
  })),
}));

describe("generateScript action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireKiToolAccessForAction(
      vi.mocked(requireKiToolAccessForAction),
      50
    );
  });

  it("returns script on valid input", async () => {
    const result = await generateScript({
      topic: "Morning Routine",
      duration: "60 Sek",
      tone: "Energetisch & Motivierend",
      language: "Deutsch",
      hookVariants: true,
      bRoll: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result.script).toContain("[HOOK]");
      expect(result.result.wordCount).toBeGreaterThan(0);
      expect(result.result.hookVariants).toHaveLength(3);
    }
  });

  it("deducts 2 credits on success", async () => {
    const { state } = mockRequireKiToolAccessForAction(
      vi.mocked(requireKiToolAccessForAction),
      50
    );

    const result = await generateScript({
      topic: "Test",
      duration: "30 Sek",
      tone: "Informativ & Sachlich",
      language: "Deutsch",
      hookVariants: false,
      bRoll: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.creditsLeft).toBe(48);
      expect(state.credits).toBe(48);
    }
  });

  it("returns error when topic is empty", async () => {
    const result = await generateScript({
      topic: "   ",
      duration: "60 Sek",
      tone: "Energetisch & Motivierend",
      language: "Deutsch",
      hookVariants: false,
      bRoll: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("returns error when not logged in", async () => {
    vi.mocked(requireKiToolAccessForAction).mockResolvedValue({
      ok: false,
      error: "Nicht eingeloggt.",
    });

    const result = await generateScript({
      topic: "Test",
      duration: "60 Sek",
      tone: "Energetisch & Motivierend",
      language: "Deutsch",
      hookVariants: false,
      bRoll: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/nicht eingeloggt/i);
    }
  });
});

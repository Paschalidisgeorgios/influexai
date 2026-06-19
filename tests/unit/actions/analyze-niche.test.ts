import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeNiche } from "@/app/actions/analyze-niche";
import { requireKiToolAccessForAction } from "@/lib/access.server";
import { mockRequireKiToolAccessForAction } from "../helpers/ki-tool-access-mock";

vi.mock("@/lib/access.server", () => ({
  requireKiToolAccessForAction: vi.fn(),
}));

vi.mock("@/lib/e2e-mock-generations", () => ({
  isE2eMockGenerationsEnabled: vi.fn(() => true),
  e2eMockNiches: vi.fn((topic: string) =>
    Array.from({ length: 5 }, (_, i) => ({
      title: `${topic} ${i + 1}`,
      description: "Desc",
      competition: "low" as const,
      potential: 4 as const,
      trend: "rising" as const,
      videoIdeas: ["a", "b", "c"] as [string, string, string],
    }))
  ),
}));

describe("analyzeNiche action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireKiToolAccessForAction(
      vi.mocked(requireKiToolAccessForAction),
      20
    );
  });

  it("returns 5 niches on valid topic", async () => {
    const result = await analyzeNiche("Fitness", "18-24", "YouTube Shorts");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.niches).toHaveLength(5);
      expect(result.creditsLeft).toBe(18);
    }
  });

  it("rejects empty topic", async () => {
    const result = await analyzeNiche("  ", "18-24", "YouTube Shorts");
    expect(result.success).toBe(false);
  });
});

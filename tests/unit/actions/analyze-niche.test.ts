import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeNiche } from "@/app/actions/analyze-niche";
import { createMockSupabase } from "../helpers/supabase-mock";

const mockUser = { id: "user-123" };

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
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
  beforeEach(async () => {
    const { createServerSupabaseClient } =
      await import("@/lib/supabase/server");
    const { client } = createMockSupabase({ credits: 20 });
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      ...client,
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    } as never);
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

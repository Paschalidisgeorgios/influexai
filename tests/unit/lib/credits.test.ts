import { describe, it, expect, beforeEach, vi } from "vitest";
import { deductCredits, addCredits, hasEnoughCredits } from "@/lib/credits";
import { createMockSupabase } from "../helpers/supabase-mock";

describe("deductCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deducts credits successfully", async () => {
    const { client, state } = createMockSupabase({ credits: 50 });
    const result = await deductCredits(
      client,
      "user-123",
      2,
      "Script Generator"
    );

    expect(result.success).toBe(true);
    expect(result.remainingCredits).toBe(48);
    expect(state.credits).toBe(48);
  });

  it("returns error when insufficient credits", async () => {
    const { client } = createMockSupabase({ credits: 1 });
    const result = await deductCredits(
      client,
      "user-123",
      2,
      "Script Generator"
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/nicht genug credits/i);
    expect(result.remainingCredits).toBe(1);
  });

  it("returns error when profile not found", async () => {
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "missing", email: "missing@test.com" } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      }),
      rpc: vi.fn(),
    } as never;

    const result = await deductCredits(
      client,
      "missing",
      2,
      "Script Generator"
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/profil nicht gefunden/i);
  });

  it("handles exactly enough credits", async () => {
    const { client, state } = createMockSupabase({ credits: 2 });
    const result = await deductCredits(
      client,
      "user-123",
      2,
      "Script Generator"
    );

    expect(result.success).toBe(true);
    expect(result.remainingCredits).toBe(0);
    expect(state.credits).toBe(0);
  });

  it("rejects non-positive amounts", async () => {
    const { client } = createMockSupabase({ credits: 50 });
    const result = await deductCredits(client, "user-123", 0, "test");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ungültig/i);
  });
});

describe("addCredits", () => {
  it("adds credits successfully", async () => {
    const { client, state } = createMockSupabase({ credits: 50 });
    const result = await addCredits(client, "user-123", 10, "referral_bonus");

    expect(result.success).toBe(true);
    expect(result.remainingCredits).toBe(60);
    expect(state.credits).toBe(60);
  });

  it("rejects non-positive amounts", async () => {
    const { client } = createMockSupabase({ credits: 50 });
    const result = await addCredits(client, "user-123", -5, "refund");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ungültig/i);
  });
});

describe("hasEnoughCredits", () => {
  it("returns ok when balance is sufficient", async () => {
    const { client } = createMockSupabase({ credits: 10 });
    const check = await hasEnoughCredits(client, "user-123", 2);
    expect(check.ok).toBe(true);
    expect(check.credits).toBe(10);
  });

  it("returns not ok when balance is too low", async () => {
    const { client } = createMockSupabase({ credits: 1 });
    const check = await hasEnoughCredits(client, "user-123", 2);
    expect(check.ok).toBe(false);
    expect(check.credits).toBe(1);
  });
});

import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileState = { credits: number };

export function createMockSupabase(initial: ProfileState) {
  const state = { ...initial };

  const profileChain = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockImplementation((payload: { credits?: number }) => {
      if (typeof payload.credits === "number") {
        state.credits = payload.credits;
      }
      return {
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
    }),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(async () => ({
      data: { credits: state.credits },
      error: null,
    })),
  };

  const noopChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  const from = vi.fn((table: string) => {
    if (table === "profiles") return profileChain;
    if (table === "generations" || table === "credit_transactions") {
      return {
        ...noopChain,
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    return noopChain;
  });

  return { client: { from } as unknown as SupabaseClient, state };
}

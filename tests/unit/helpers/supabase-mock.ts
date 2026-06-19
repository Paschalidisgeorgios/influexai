import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileState = { credits: number };

type MockSupabaseOptions = {
  userId?: string;
  /** When false, auth.getUser returns null (logged out). */
  authenticated?: boolean;
};

export function createMockSupabase(
  initial: ProfileState,
  options: MockSupabaseOptions = {}
) {
  const userId = options.userId ?? "user-123";
  const authenticated = options.authenticated !== false;
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
      data: {
        credits: state.credits,
        is_admin: false,
        role: "user",
      },
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

  const rpc = vi.fn(
    async (
      fn: string,
      params: { p_user_id?: string; p_amount?: number } = {}
    ) => {
      const amount = params.p_amount ?? 0;

      if (fn === "deduct_credits") {
        if (state.credits < amount) {
          return { data: null, error: null };
        }
        state.credits -= amount;
        return { data: state.credits, error: null };
      }

      if (fn === "add_credits") {
        state.credits += amount;
        return { data: state.credits, error: null };
      }

      return { data: null, error: { message: `Unknown RPC: ${fn}` } };
    }
  );

  const auth = {
    getUser: vi.fn().mockResolvedValue(
      authenticated
        ? {
            data: { user: { id: userId, email: "test@test.com" } },
            error: null,
          }
        : { data: { user: null }, error: null }
    ),
  };

  return { client: { from, rpc, auth } as unknown as SupabaseClient, state };
}

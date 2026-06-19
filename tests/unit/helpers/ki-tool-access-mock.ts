import { vi } from "vitest";
import type { KiToolAccessGranted } from "@/lib/access.server";
import { createMockSupabase } from "./supabase-mock";

export function createMockKiToolAccess(credits: number, userId = "user-123") {
  const { client, state } = createMockSupabase({ credits }, { userId });

  const access: KiToolAccessGranted = {
    ok: true,
    userId,
    profile: {
      plan: "starter",
      role: "user",
      email: "test@test.com",
    },
    isAdmin: false,
    supabase: client,
  };

  return { client, state, access };
}

export function mockRequireKiToolAccessForAction(
  mockFn: ReturnType<typeof vi.fn>,
  credits: number,
  userId = "user-123"
) {
  const { state, access } = createMockKiToolAccess(credits, userId);
  mockFn.mockResolvedValue(access);
  return { state, access };
}

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { confirmReferralSignupRewards } from "@/lib/referral-signup-confirm";

const REFERRAL_ROW = {
  id: "ref-1",
  referrer_id: "referrer-1",
  referred_id: "referred-1",
  status: "signed_up",
  credits_awarded_signup: false,
  credits_awarded_purchase: false,
};

vi.mock("@/lib/referral-rewards", () => ({
  awardReferredSignupBonus: vi.fn().mockResolvedValue(undefined),
  grantReferrerSignupBonusAfterClaim: vi
    .fn()
    .mockResolvedValue({ ok: true }),
}));

import {
  awardReferredSignupBonus,
  grantReferrerSignupBonusAfterClaim,
} from "@/lib/referral-rewards";

function createReferralsMock(initialClaimed: boolean) {
  let claimed = initialClaimed;

  const referralsChain = {
    update: vi.fn().mockImplementation((payload: Record<string, unknown>) => ({
      eq: vi.fn().mockImplementation((col: string, val: unknown) => {
        if (col === "referred_id") {
          return {
            eq: vi.fn().mockImplementation((col2: string, val2: unknown) => {
              if (col2 === "credits_awarded_signup" && val2 === false) {
                return {
                  select: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockImplementation(async () => {
                      if (claimed) {
                        return { data: null, error: null };
                      }
                      claimed = true;
                      return {
                        data: {
                          ...REFERRAL_ROW,
                          credits_awarded_signup: payload.credits_awarded_signup,
                        },
                        error: null,
                      };
                    }),
                  }),
                };
              }
              return {
                select: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              };
            }),
          };
        }
        if (col === "id") {
          return {
            eq: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {
          eq: vi.fn().mockResolvedValue({ error: null }),
        };
      }),
    })),
  };

  return {
    client: {
      from: vi.fn((table: string) => {
        if (table === "referrals") return referralsChain;
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as unknown as SupabaseClient,
    isClaimed: () => claimed,
  };
}

describe("confirmReferralSignupRewards idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("awards credits only once when called twice for the same user", async () => {
    const { client } = createReferralsMock(false);

    const first = await confirmReferralSignupRewards(client, "referred-1");
    const second = await confirmReferralSignupRewards(client, "referred-1");

    expect(first).toEqual({ success: true, awarded: true });
    expect(second).toEqual({ success: true, awarded: false });
    expect(awardReferredSignupBonus).toHaveBeenCalledTimes(1);
    expect(grantReferrerSignupBonusAfterClaim).toHaveBeenCalledTimes(1);
  });

  it("no-ops when no pending referral row exists", async () => {
    const { client } = createReferralsMock(true);

    const result = await confirmReferralSignupRewards(client, "referred-1");

    expect(result).toEqual({ success: true, awarded: false });
    expect(awardReferredSignupBonus).not.toHaveBeenCalled();
    expect(grantReferrerSignupBonusAfterClaim).not.toHaveBeenCalled();
  });
});

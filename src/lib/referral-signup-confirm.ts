import type { SupabaseClient } from "@supabase/supabase-js";
import {
  awardReferredSignupBonus,
  grantReferrerSignupBonusAfterClaim,
  type ReferralRow,
} from "@/lib/referral-rewards";

async function rollbackReferralSignupClaim(
  supabase: SupabaseClient,
  referralId: string
): Promise<void> {
  await supabase
    .from("referrals")
    .update({
      credits_awarded_signup: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", referralId);
}

/**
 * Idempotent referral signup reward grant.
 * Atomically claims the referral row (credits_awarded_signup: false → true)
 * before awarding credits so concurrent callback invocations cannot double-grant.
 */
export async function confirmReferralSignupRewards(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; awarded: boolean }> {
  const { data: claimed, error } = await supabase
    .from("referrals")
    .update({
      credits_awarded_signup: true,
      updated_at: new Date().toISOString(),
    })
    .eq("referred_id", userId)
    .eq("credits_awarded_signup", false)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("confirmReferralSignupRewards claim:", error.message);
    return { success: false, awarded: false };
  }

  if (!claimed) {
    return { success: true, awarded: false };
  }

  const referral = claimed as ReferralRow;

  try {
    await awardReferredSignupBonus(supabase, userId);
    const referrerResult = await grantReferrerSignupBonusAfterClaim(
      supabase,
      referral
    );
    if (!referrerResult.ok) {
      await rollbackReferralSignupClaim(supabase, referral.id);
      return { success: false, awarded: false };
    }
    return { success: true, awarded: true };
  } catch (err) {
    console.error("confirmReferralSignupRewards:", err);
    await rollbackReferralSignupClaim(supabase, referral.id);
    return { success: false, awarded: false };
  }
}

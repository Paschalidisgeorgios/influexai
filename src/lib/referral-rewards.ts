import type { SupabaseClient } from "@supabase/supabase-js";
import { addCredits } from "@/lib/credits";
import { invokePushNotification } from "@/lib/push-notifications";
import {
  REFERRAL_PURCHASE_BONUS_REFERRER,
  REFERRAL_SIGNUP_BONUS_REFERRED,
  REFERRAL_SIGNUP_BONUS_REFERRER,
  REFERRAL_TX_LABEL,
} from "@/lib/referral-code";

export type ReferralRow = {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  credits_awarded_signup: boolean;
  credits_awarded_purchase: boolean;
};

/** Award 5 credits to referred user (on signup with ref). */
export async function awardReferredSignupBonus(
  supabase: SupabaseClient,
  referredUserId: string
): Promise<void> {
  await addCredits(
    supabase,
    referredUserId,
    REFERRAL_SIGNUP_BONUS_REFERRED,
    `${REFERRAL_TX_LABEL} (Welcome)`
  );
}

async function notifyReferrerSignupJoined(
  supabase: SupabaseClient,
  referral: ReferralRow
): Promise<void> {
  const { data: referred } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", referral.referred_id)
    .single();
  const name = referred?.full_name?.trim().split(/\s+/)[0] ?? "Ein Freund";
  void invokePushNotification({
    userId: referral.referrer_id,
    type: "REFERRAL_JOINED",
    variables: { name },
  });
}

/** Award referrer signup bonus after atomic claim in confirmReferralSignupRewards. */
export async function grantReferrerSignupBonusAfterClaim(
  supabase: SupabaseClient,
  referral: ReferralRow
): Promise<{ ok: boolean }> {
  const result = await addCredits(
    supabase,
    referral.referrer_id,
    REFERRAL_SIGNUP_BONUS_REFERRER,
    `${REFERRAL_TX_LABEL} (Invite signup)`
  );

  if (!result.success) return { ok: false };

  await notifyReferrerSignupJoined(supabase, referral);
  return { ok: true };
}

/** Award referrer signup bonus (edge function / legacy path with flag check). */
export async function awardReferrerSignupBonus(
  supabase: SupabaseClient,
  referral: ReferralRow
): Promise<{ ok: boolean }> {
  if (referral.credits_awarded_signup) return { ok: true };

  const result = await addCredits(
    supabase,
    referral.referrer_id,
    REFERRAL_SIGNUP_BONUS_REFERRER,
    `${REFERRAL_TX_LABEL} (Invite signup)`
  );

  if (!result.success) return { ok: false };

  await supabase
    .from("referrals")
    .update({
      credits_awarded_signup: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", referral.id);

  await notifyReferrerSignupJoined(supabase, referral);
  return { ok: true };
}

/** Award 20 credits to referrer on first purchase by referred user. */
export async function awardReferrerPurchaseBonus(
  supabase: SupabaseClient,
  referral: ReferralRow
): Promise<{ ok: boolean }> {
  if (referral.credits_awarded_purchase) return { ok: true };

  const result = await addCredits(
    supabase,
    referral.referrer_id,
    REFERRAL_PURCHASE_BONUS_REFERRER,
    `${REFERRAL_TX_LABEL} (Invite purchase)`
  );

  if (!result.success) return { ok: false };

  await supabase
    .from("referrals")
    .update({
      credits_awarded_purchase: true,
      status: "purchased",
      updated_at: new Date().toISOString(),
    })
    .eq("id", referral.id);

  return { ok: true };
}

/** Process new referral row (edge function / idempotent). */
export async function processReferralInsert(
  supabase: SupabaseClient,
  referralId: string
): Promise<void> {
  const { data: referral } = await supabase
    .from("referrals")
    .select("*")
    .eq("id", referralId)
    .single();

  if (!referral) return;

  await awardReferrerSignupBonus(supabase, referral as ReferralRow);
}

/** Process referral marked as purchased. */
export async function processReferralPurchase(
  supabase: SupabaseClient,
  referredUserId: string
): Promise<void> {
  const { data: referral } = await supabase
    .from("referrals")
    .select("*")
    .eq("referred_id", referredUserId)
    .eq("status", "signed_up")
    .maybeSingle();

  if (!referral) return;

  await supabase
    .from("referrals")
    .update({ status: "purchased", updated_at: new Date().toISOString() })
    .eq("id", referral.id);

  const updated = {
    ...referral,
    status: "purchased",
  } as ReferralRow;

  await awardReferrerPurchaseBonus(supabase, updated);
}

"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import {
  generateReferralCode,
  normalizeReferralCode,
} from "@/lib/referral-code";
import {
  awardReferredSignupBonus,
  awardReferrerSignupBonus,
  processReferralPurchase,
} from "@/lib/referral-rewards";

async function getAdminClient() {
  try {
    return createServiceSupabaseClient();
  } catch {
    return await createServerSupabaseClient();
  }
}

async function ensureUniqueReferralCode(
  supabase: Awaited<ReturnType<typeof getAdminClient>>,
  userId: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .single();

  if (existing?.referral_code) {
    return existing.referral_code;
  }

  for (let attempt = 0; attempt < 15; attempt++) {
    const code = generateReferralCode();
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();

    if (taken) continue;

    const { error } = await supabase
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", userId);

    if (!error) return code;
  }

  const fallback = `${generateReferralCode()}${userId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
  await supabase
    .from("profiles")
    .update({ referral_code: fallback })
    .eq("id", userId);
  return fallback;
}

/** Call after signup (stores ref, awards 5 to new user, creates referral row). */
export async function registerReferralOnSignup(
  userId: string,
  referrerCodeRaw?: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getAdminClient();
  await ensureUniqueReferralCode(supabase, userId);

  const referrerCode = referrerCodeRaw
    ? normalizeReferralCode(referrerCodeRaw)
    : null;

  if (!referrerCode) {
    return { success: true };
  }

  const { data: referrer } = await supabase
    .from("profiles")
    .select("id, referral_code")
    .eq("referral_code", referrerCode)
    .maybeSingle();

  if (!referrer || referrer.id === userId) {
    return { success: true };
  }

  const { data: existingReferral } = await supabase
    .from("referrals")
    .select("id")
    .eq("referred_id", userId)
    .maybeSingle();

  if (existingReferral) {
    return { success: true };
  }

  await supabase
    .from("profiles")
    .update({ referred_by: referrerCode })
    .eq("id", userId);

  await awardReferredSignupBonus(supabase, userId);

  const { data: inserted, error: insertError } = await supabase
    .from("referrals")
    .insert({
      referrer_id: referrer.id,
      referred_id: userId,
      status: "signed_up",
      credits_awarded_signup: false,
      credits_awarded_purchase: false,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("registerReferralOnSignup insert:", insertError.message);
    return { success: false, error: insertError.message };
  }

  void inserted?.id;

  return { success: true };
}

/** Call on email confirmation / first session (auth callback). */
export async function confirmReferralRewards(
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await getAdminClient();

  const { data: referral } = await supabase
    .from("referrals")
    .select("*")
    .eq("referred_id", userId)
    .maybeSingle();

  if (!referral) return { success: true };

  const awarded = await awardReferrerSignupBonus(supabase, referral);
  if (awarded.ok) {
    await invokeProcessReferralEdge(referral.id, "insert");
  }

  return { success: true };
}

async function invokeProcessReferralEdge(
  referralId: string | undefined,
  event: "insert" | "purchase"
) {
  if (!referralId) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    await fetch(`${url}/functions/v1/process-referral`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ referralId, event }),
    });
  } catch (e) {
    console.error("process-referral invoke:", e);
  }
}

export type ReferralDashboardData = {
  referralCode: string;
  referralLink: string;
  stats: {
    signedUp: number;
    purchased: number;
    creditsEarned: number;
  };
  history: {
    id: string;
    date: string;
    status: "signed_up" | "purchased";
    creditsEarned: number;
    label: string;
  }[];
};

export async function getReferralDashboard(): Promise<
  ReferralDashboardData | { error: string }
> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt." };

  const admin = await getAdminClient();
  const code = await ensureUniqueReferralCode(admin, user.id);

  const { data: referrals } = await supabase
    .from("referrals")
    .select(
      "id, status, credits_awarded_signup, credits_awarded_purchase, created_at, updated_at"
    )
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const list = referrals ?? [];
  let creditsEarned = 0;
  let purchased = 0;

  const history = list.map((r, index) => {
    let earned = 0;
    if (r.credits_awarded_signup) earned += 10;
    if (r.credits_awarded_purchase) {
      earned += 20;
      purchased += 1;
    }
    creditsEarned += earned;
    const status = r.status === "purchased" ? "purchased" : "signed_up";
    return {
      id: r.id,
      date: r.created_at,
      status: status as "signed_up" | "purchased",
      creditsEarned: earned,
      label: `Freund #${index + 1}`,
    };
  });

  const { SITE_URL } = await import("@/lib/referral-code");

  return {
    referralCode: code,
    referralLink: `${SITE_URL}/signup?ref=${code}`,
    stats: {
      signedUp: list.length,
      purchased,
      creditsEarned,
    },
    history,
  };
}

/** Used by Stripe webhook after purchase. */
export async function markReferralPurchased(
  referredUserId: string
): Promise<void> {
  const supabase = await getAdminClient();
  await processReferralPurchase(supabase, referredUserId);

  const { data: referral } = await supabase
    .from("referrals")
    .select("id")
    .eq("referred_id", referredUserId)
    .maybeSingle();

  if (referral?.id) {
    await invokeProcessReferralEdge(referral.id, "purchase");
  }
}

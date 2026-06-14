"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import {
  generateReferralCode,
  normalizeReferralCode,
  SITE_URL,
} from "@/lib/referral-code";
import { isReferralUserId } from "@/lib/referral-ref-cookie";
import { assertSessionUserId } from "@/lib/server-action-auth";
import { processReferralPurchase } from "@/lib/referral-rewards";
import { confirmReferralSignupRewards } from "@/lib/referral-signup-confirm";

async function resolveReferrerId(
  supabase: Awaited<ReturnType<typeof getAdminClient>>,
  refRaw: string
): Promise<string | null> {
  const trimmed = refRaw.trim();
  if (!trimmed) return null;

  if (isReferralUserId(trimmed)) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", trimmed)
      .maybeSingle();
    return data?.id ?? null;
  }

  const code = normalizeReferralCode(trimmed);
  if (!code) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, referral_code")
    .eq("referral_code", code)
    .maybeSingle();

  return data?.id ?? null;
}

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

/** Records referral relationship only — no credit grants (see confirmReferralRewards). */
export async function recordReferralIntent(
  userId: string,
  referrerCodeRaw?: string | null
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertSessionUserId(userId);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const supabase = await getAdminClient();
  await ensureUniqueReferralCode(supabase, userId);

  if (!referrerCodeRaw?.trim()) {
    return { success: true };
  }

  const referrerId = await resolveReferrerId(supabase, referrerCodeRaw);
  if (!referrerId || referrerId === userId) {
    return { success: true };
  }

  const { data: referrer } = await supabase
    .from("profiles")
    .select("id, referral_code")
    .eq("id", referrerId)
    .single();

  if (!referrer) {
    return { success: true };
  }

  const referrerCode =
    referrer.referral_code ?? normalizeReferralCode(referrerCodeRaw);

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
    console.error("recordReferralIntent insert:", insertError.message);
    return { success: false, error: insertError.message };
  }

  return { success: true };
}

/** @deprecated Use recordReferralIntent — kept for import compatibility. */
export const registerReferralOnSignup = recordReferralIntent;

/** Call on email confirmation / first session (auth callback only). */
export async function confirmReferralRewards(
  userId: string
): Promise<{ success: boolean }> {
  const auth = await assertSessionUserId(userId);
  if (!auth.ok) {
    return { success: false };
  }

  const supabase = await getAdminClient();
  const result = await confirmReferralSignupRewards(supabase, userId);

  if (result.awarded) {
    const { data: referral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_id", userId)
      .maybeSingle();
    if (referral?.id) {
      await invokeProcessReferralEdge(referral.id, "insert");
    }
  }

  return { success: result.success };
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
  signupLink: string;
  stats: {
    signedUp: number;
    purchased: number;
    creditsEarned: number;
    activeReferrals: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  history: {
    id: string;
    date: string;
    status: "signed_up" | "purchased";
    creditsEarned: number;
    label: string;
  }[];
};

const REFERRAL_PAGE_SIZE = 10;

export async function getReferralDashboard(
  page = 1
): Promise<ReferralDashboardData | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt." };

  const safePage = Math.max(1, Math.floor(page));
  const from = (safePage - 1) * REFERRAL_PAGE_SIZE;
  const to = from + REFERRAL_PAGE_SIZE - 1;

  const admin = await getAdminClient();
  const code = await ensureUniqueReferralCode(admin, user.id);

  const { data: referrals, count } = await supabase
    .from("referrals")
    .select(
      "id, status, credits_awarded_signup, credits_awarded_purchase, created_at, updated_at",
      { count: "exact" }
    )
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const list = referrals ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / REFERRAL_PAGE_SIZE));

  const { count: activeCount } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id)
    .eq("status", "signed_up");

  const history = list.map((r, index) => {
    let earned = 0;
    if (r.credits_awarded_signup) earned += 20;
    if (r.credits_awarded_purchase) {
      earned += 20;
    }
    const status = r.status === "purchased" ? "purchased" : "signed_up";
    return {
      id: r.id,
      date: r.created_at,
      status: status as "signed_up" | "purchased",
      creditsEarned: earned,
      label: `Freund #${from + index + 1}`,
    };
  });

  const { data: allForCredits } = await supabase
    .from("referrals")
    .select("credits_awarded_signup, credits_awarded_purchase, status")
    .eq("referrer_id", user.id);

  let totalCreditsEarned = 0;
  let totalPurchased = 0;
  for (const r of allForCredits ?? []) {
    if (r.credits_awarded_signup) totalCreditsEarned += 20;
    if (r.credits_awarded_purchase) {
      totalCreditsEarned += 20;
      totalPurchased += 1;
    }
  }

  return {
    referralCode: code,
    referralLink: `${SITE_URL}?ref=${user.id}`,
    signupLink: `${SITE_URL}/auth/sign-up?ref=${code}`,
    stats: {
      signedUp: total,
      purchased: totalPurchased,
      creditsEarned: totalCreditsEarned,
      activeReferrals: activeCount ?? 0,
    },
    pagination: {
      page: safePage,
      pageSize: REFERRAL_PAGE_SIZE,
      total,
      totalPages,
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

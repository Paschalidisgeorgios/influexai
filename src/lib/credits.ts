import type { SupabaseClient } from "@supabase/supabase-js";
import { logCreditTransaction, logGeneration } from "@/lib/activity-log";
import { invalidateUserCredits, invalidateUserGenerations } from "@/lib/cache";
import { invokePushNotification } from "@/lib/push-notifications";

export type DeductCreditsResult = {
  success: boolean;
  remainingCredits: number;
  error?: string;
};

export type DeductCreditsMeta = {
  generationType?: string;
  prompt?: string;
  /** Skip auto generations row when the route manages asset storage itself */
  skipGenerationLog?: boolean;
};

function getCrossedThreshold(
  previousCredits: number,
  remainingCredits: number
): 10 | 3 | 0 | null {
  if (previousCredits > 0 && remainingCredits === 0) return 0;
  if (previousCredits > 3 && remainingCredits <= 3 && remainingCredits > 0)
    return 3;
  if (previousCredits > 10 && remainingCredits <= 10 && remainingCredits > 3)
    return 10;
  return null;
}

async function invokeLowCreditEmail(
  userId: string,
  previousCredits: number,
  remainingCredits: number
): Promise<void> {
  if (getCrossedThreshold(previousCredits, remainingCredits) === null) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/credits-low-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        previousCredits,
        remainingCredits,
      }),
    });
    if (!res.ok) {
      console.error("credits-low-email:", await res.text());
    }
  } catch (e) {
    console.error("credits-low-email invoke failed:", e);
  }
}

/**
 * Deduct credits after a successful action. Checks balance, updates profile,
 * logs generation + transaction, and triggers low-credit email when a threshold is crossed.
 */
export async function deductCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  action: string,
  meta?: DeductCreditsMeta
): Promise<DeductCreditsResult> {
  if (amount <= 0) {
    return {
      success: false,
      remainingCredits: 0,
      error: "Ungültiger Credit-Betrag.",
    };
  }

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    return {
      success: false,
      remainingCredits: 0,
      error: "Profil nicht gefunden.",
    };
  }

  const previousCredits = profile.credits ?? 0;
  if (previousCredits < amount) {
    return {
      success: false,
      remainingCredits: previousCredits,
      error: "Nicht genug Credits.",
    };
  }

  const remainingCredits = previousCredits - amount;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits: remainingCredits })
    .eq("id", userId);

  if (updateError) {
    console.error("deductCredits update:", updateError.message);
    return {
      success: false,
      remainingCredits: previousCredits,
      error: "Credits konnten nicht abgezogen werden.",
    };
  }

  const generationType = meta?.generationType ?? action;
  const prompt = meta?.prompt ?? action;

  if (!meta?.skipGenerationLog) {
    await logGeneration(supabase, userId, {
      type: generationType,
      prompt,
      creditsUsed: amount,
    });
  }
  await logCreditTransaction(supabase, userId, {
    amount: -amount,
    description: action,
  });

  await invokeLowCreditEmail(userId, previousCredits, remainingCredits);

  const threshold = getCrossedThreshold(previousCredits, remainingCredits);
  if (threshold !== null) {
    const type = threshold === 0 ? "CREDITS_EMPTY" : "LOW_CREDITS";
    void invokePushNotification({
      userId,
      type,
      variables: { n: remainingCredits },
    });
  }

  invalidateUserGenerations(userId);

  return { success: true, remainingCredits };
}

export type AddCreditsResult = {
  success: boolean;
  remainingCredits: number;
  error?: string;
};

/** Add credits (referrals, purchases, bonuses). Logs to credit_transactions only. */
export async function addCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  description: string
): Promise<AddCreditsResult> {
  if (amount <= 0) {
    return {
      success: false,
      remainingCredits: 0,
      error: "Ungültiger Credit-Betrag.",
    };
  }

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    return {
      success: false,
      remainingCredits: 0,
      error: "Profil nicht gefunden.",
    };
  }

  const previousCredits = profile.credits ?? 0;
  const remainingCredits = previousCredits + amount;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits: remainingCredits })
    .eq("id", userId);

  if (updateError) {
    console.error("addCredits update:", updateError.message);
    return {
      success: false,
      remainingCredits: previousCredits,
      error: "Credits konnten nicht gutgeschrieben werden.",
    };
  }

  await logCreditTransaction(supabase, userId, {
    amount,
    description,
  });

  invalidateUserCredits(userId);

  return { success: true, remainingCredits };
}

/** Pre-flight check before expensive API calls. */
export async function hasEnoughCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number
): Promise<{ ok: boolean; credits: number }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  const credits = profile?.credits ?? 0;
  return { ok: credits >= amount, credits };
}

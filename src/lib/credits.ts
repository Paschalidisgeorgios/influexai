import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logCreditTransaction, logGeneration } from "@/lib/activity-log";
import { invalidateUserCredits, invalidateUserGenerations } from "@/lib/cache";
import { isPlatformAdminServer } from "@/lib/platform-admin.server";
import { invokePushNotification } from "@/lib/push-notifications";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

/**
 * Credit bypass for platform admins — session + profile verified (never trust client input).
 * Uses the same admin rules as requireKiToolAccess / isPlatformAdminServer.
 */
export async function isCreditExemptUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return false;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .single();

  return isPlatformAdminServer({
    email: user.email,
    is_admin: profile?.is_admin,
    role: profile?.role,
  });
}

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

async function readProfileCredits(
  supabase: SupabaseClient,
  userId: string
): Promise<number | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error || !profile) return null;
  return profile.credits ?? 0;
}

/**
 * Deduct credits after a successful action. Uses atomic RPC (deduct_credits).
 * Logs generation + transaction and triggers low-credit email when a threshold is crossed.
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

  if (await isCreditExemptUser(supabase, userId)) {
    const remainingCredits = (await readProfileCredits(supabase, userId)) ?? 0;
    const generationType = meta?.generationType ?? action;
    const prompt = meta?.prompt ?? action;

    if (!meta?.skipGenerationLog) {
      await logGeneration(supabase, userId, {
        type: generationType,
        prompt,
        creditsUsed: 0,
      });
    }

    invalidateUserGenerations(userId);
    return { success: true, remainingCredits };
  }

  const balanceBefore = await readProfileCredits(supabase, userId);
  if (balanceBefore === null) {
    return {
      success: false,
      remainingCredits: 0,
      error: "Profil nicht gefunden.",
    };
  }

  const { data: newBalance, error: rpcError } = await supabase.rpc(
    "deduct_credits",
    {
      p_user_id: userId,
      p_amount: amount,
    }
  );

  if (rpcError) {
    console.error("[deductCredits] RPC error:", rpcError);
    return {
      success: false,
      remainingCredits: balanceBefore,
      error: "Credits konnten nicht abgezogen werden.",
    };
  }

  if (newBalance === null) {
    return {
      success: false,
      remainingCredits: balanceBefore,
      error: "Nicht genug Credits.",
    };
  }

  const remainingCredits = newBalance;
  const previousCredits = remainingCredits + amount;
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

/** Add credits (referrals, purchases, bonuses). Uses atomic RPC (add_credits). */
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

  const balanceBefore = await readProfileCredits(supabase, userId);
  if (balanceBefore === null) {
    return {
      success: false,
      remainingCredits: 0,
      error: "Profil nicht gefunden.",
    };
  }

  let rpcClient: SupabaseClient;
  try {
    rpcClient = createServiceSupabaseClient();
  } catch {
    rpcClient = supabase;
  }

  const { data: newBalance, error: rpcError } = await rpcClient.rpc(
    "add_credits",
    {
      p_user_id: userId,
      p_amount: amount,
    }
  );

  if (rpcError) {
    console.error("[addCredits] RPC error:", rpcError);
    return {
      success: false,
      remainingCredits: balanceBefore,
      error: "Credits konnten nicht gutgeschrieben werden.",
    };
  }

  if (newBalance === null) {
    return {
      success: false,
      remainingCredits: balanceBefore,
      error: "Profil nicht gefunden.",
    };
  }

  await logCreditTransaction(supabase, userId, {
    amount,
    description,
  });

  invalidateUserCredits(userId);

  return { success: true, remainingCredits: newBalance };
}

/** Pre-flight check before expensive API calls. */
export async function hasEnoughCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number
): Promise<{ ok: boolean; credits: number }> {
  const credits = (await readProfileCredits(supabase, userId)) ?? 0;

  if (await isCreditExemptUser(supabase, userId)) {
    return { ok: true, credits };
  }

  return { ok: credits >= amount, credits };
}

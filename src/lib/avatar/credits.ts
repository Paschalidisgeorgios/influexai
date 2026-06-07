import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceSupabaseClient } from "@/lib/supabase/service";

function getRpcClient(supabase: SupabaseClient): SupabaseClient {
  try {
    return createServiceSupabaseClient();
  } catch {
    return supabase;
  }
}

/** Refund credits when a job failed after an earlier charge (legacy / edge cases). */
export async function refundCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  if (amount <= 0) return;

  await getRpcClient(supabase).rpc("add_credits", {
    p_user_id: userId,
    p_amount: amount,
  });

  console.log(`[refund] ${amount} Credits zurück an ${userId}: ${reason}`);
}

/** Charge avatar render credits atomically after successful output. Returns new balance or null. */
export async function chargeAvatarCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  jobId: string
): Promise<number | null> {
  if (amount <= 0) return 0;

  const { data, error } = await getRpcClient(supabase).rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error("[chargeAvatarCredits] RPC error:", error);
    return null;
  }

  if (data === null) {
    console.error("[callback] Credits nicht abziehbar", jobId);
    return null;
  }

  return data;
}

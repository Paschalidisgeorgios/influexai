import type { SupabaseClient } from "@supabase/supabase-js";

export async function logGeneration(
  supabase: SupabaseClient,
  userId: string,
  payload: { type: string; prompt: string; creditsUsed: number }
) {
  await supabase.from("generations").insert({
    user_id: userId,
    type: payload.type,
    prompt: payload.prompt.slice(0, 500),
    credits_used: payload.creditsUsed,
  });
}

export async function logCreditTransaction(
  supabase: SupabaseClient,
  userId: string,
  payload: { amount: number; description: string }
) {
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: payload.amount,
    description: payload.description,
  });
}

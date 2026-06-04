import type { SupabaseClient } from "@supabase/supabase-js";

export async function logGeneration(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    type: string;
    prompt: string;
    creditsUsed: number;
    result?: Record<string, unknown>;
  }
) {
  const row: Record<string, unknown> = {
    user_id: userId,
    type: payload.type,
    prompt: payload.prompt.slice(0, 500),
    credits_used: payload.creditsUsed,
  };
  if (payload.result != null) {
    row.result = payload.result;
  }
  await supabase.from("generations").insert(row);
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

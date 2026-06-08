import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireCredits(
  userId: string,
  amount: number
): Promise<{ ok: boolean; balance?: number }> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (!data || data.credits < amount) {
    return { ok: false, balance: data?.credits ?? 0 };
  }

  return { ok: true, balance: data.credits };
}

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireActivePlan(userId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (!profile) return false;

  const hasPlan =
    profile.plan && profile.plan !== "free" && profile.plan !== null;

  return !!hasPlan;
}

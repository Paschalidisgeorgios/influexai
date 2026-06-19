"use server";

import { hasPaidBillingPlan } from "@/lib/access";
import { getCachedCredits } from "@/lib/cache";
import { getPlanMonthlyCredits, getPlanDisplayName } from "@/lib/subscription-plans";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCreditsPageStats() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [cachedCredits, { data: profile }] = await Promise.all([
    getCachedCredits(user.id),
    supabase
      .from("profiles")
      .select("credits, plan, created_at, role, is_admin")
      .eq("id", user.id)
      .single(),
  ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: spentRows } = await supabase
    .from("credit_transactions")
    .select("amount")
    .eq("user_id", user.id)
    .lt("amount", 0)
    .gte("created_at", startOfMonth.toISOString());

  const usedThisMonth = (spentRows ?? []).reduce(
    (sum, r) => sum + Math.abs(r.amount),
    0
  );

  const { data: purchaseRows } = await supabase
    .from("credit_transactions")
    .select("amount")
    .eq("user_id", user.id)
    .like("description", "Credits gekauft%");

  const totalPurchased = (purchaseRows ?? []).reduce(
    (sum, r) => sum + r.amount,
    0
  );

  const hasPurchased = (purchaseRows?.length ?? 0) > 0;

  const { data: gens } = await supabase
    .from("generations")
    .select("type")
    .eq("user_id", user.id);

  const typeCounts = new Map<string, number>();
  for (const g of gens ?? []) {
    typeCounts.set(g.type, (typeCounts.get(g.type) ?? 0) + 1);
  }

  let topFeatureType: string | null = null;
  let topCount = 0;
  for (const [type, count] of typeCounts) {
    if (count > topCount) {
      topCount = count;
      topFeatureType = type;
    }
  }

  const credits = cachedCredits ?? profile?.credits ?? 0;
  const planActive = hasPaidBillingPlan({
    plan: profile?.plan,
  });
  const planCapacity = getPlanMonthlyCredits(profile?.plan);
  const capacity = !planActive
    ? 0
    : totalPurchased > 0
      ? totalPurchased
      : Math.max(credits, planCapacity, 1);

  return {
    credits,
    plan: profile?.plan ?? "free",
    hasActivePlan: planActive,
    planMonthlyCredits: planCapacity,
    planDisplayName: getPlanDisplayName(profile?.plan),
    usedThisMonth,
    totalPurchased,
    hasPurchased,
    topFeatureType,
    progressPercent:
      capacity > 0
        ? Math.min(100, Math.round((credits / capacity) * 100))
        : 0,
    capacity,
  };
}

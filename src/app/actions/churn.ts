"use server";

import { requireAdmin } from "@/lib/admin";
import { addCredits } from "@/lib/credits";
import {
  calculateChurnRisk,
  loadChurnInputForUser,
  scoreChurnFromData,
  type ChurnRiskLevel,
} from "@/lib/churn-score";
import {
  FEATURE_NUDGE_ORDER,
  type FeatureNudgeKey,
} from "@/lib/churn-features";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ChurnUserRow = {
  id: string;
  email: string;
  fullName: string | null;
  lastActiveAt: string | null;
  lastGenerationAt: string | null;
  score: number;
  risk: ChurnRiskLevel;
  reasons: string[];
};

async function getServiceClient() {
  try {
    return createServiceSupabaseClient();
  } catch {
    return await createServerSupabaseClient();
  }
}

export async function getMyChurnContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const risk = await calculateChurnRisk(user.id);
  return { userId: user.id, ...risk };
}

export async function getFeatureNudgeState() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: gens } = await supabase
    .from("generations")
    .select("type")
    .eq("user_id", user.id);

  const usedTypes = new Set((gens ?? []).map((g) => g.type));

  const { data: dismissed } = await supabase
    .from("dismissed_nudges")
    .select("feature")
    .eq("user_id", user.id);

  const dismissedSet = new Set((dismissed ?? []).map((d) => d.feature));

  const unused = FEATURE_NUDGE_ORDER.filter(
    (f) => !usedTypes.has(f.key) && !dismissedSet.has(f.key)
  );

  if (unused.length === 0) {
    const allUsed = FEATURE_NUDGE_ORDER.every((f) => usedTypes.has(f.key));
    if (allUsed || dismissedSet.size >= FEATURE_NUDGE_ORDER.length) {
      return { status: "all_discovered" as const };
    }
  }

  const next = unused[0];
  if (!next) {
    return { status: "all_discovered" as const };
  }

  return {
    status: "nudge" as const,
    feature: next.key as FeatureNudgeKey,
    name: next.name,
    href: next.href,
    description: next.description,
  };
}

export async function dismissFeatureNudge(feature: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  await supabase.from("dismissed_nudges").upsert({
    user_id: user.id,
    feature,
    dismissed_at: new Date().toISOString(),
  });

  return { success: true };
}

export async function getAdminChurnDashboard(
  filter: ChurnRiskLevel | "all" = "all"
) {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: admin.error };

  const supabase = await getServiceClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, last_active_at, is_churned")
    .eq("is_churned", false)
    .not("email", "is", null);

  const rows: ChurnUserRow[] = [];

  for (const p of profiles ?? []) {
    const input = await loadChurnInputForUser(supabase, p.id);
    if (!input) continue;
    const result = scoreChurnFromData(input);
    if (result.risk === "low") continue;
    if (filter !== "all" && result.risk !== filter) continue;

    rows.push({
      id: p.id,
      email: p.email ?? "",
      fullName: p.full_name,
      lastActiveAt: p.last_active_at,
      lastGenerationAt: result.lastGenerationAt,
      score: result.score,
      risk: result.risk,
      reasons: result.reasons,
    });
  }

  rows.sort((a, b) => b.score - a.score);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: winbackLogs } = await supabase
    .from("email_logs")
    .select("user_id, email_type, sent_at")
    .in("email_type", ["winback_high", "winback_critical"])
    .gte("sent_at", startOfMonth.toISOString());

  const winbackSent = winbackLogs?.length ?? 0;

  let conversions = 0;
  for (const log of winbackLogs ?? []) {
    const { data: gen } = await supabase
      .from("generations")
      .select("id")
      .eq("user_id", log.user_id)
      .gt("created_at", log.sent_at)
      .limit(1)
      .maybeSingle();
    if (gen) conversions += 1;
  }

  const conversionRate =
    winbackSent > 0 ? Math.round((conversions / winbackSent) * 100) : 0;

  const critical = rows.filter((r) => r.risk === "critical").length;
  const high = rows.filter((r) => r.risk === "high").length;
  const medium = rows.filter((r) => r.risk === "medium").length;

  return {
    metrics: {
      critical,
      high,
      winbackSent,
      conversionRate,
      medium,
    },
    users: rows,
  };
}

export async function adminChurnAction(
  userId: string,
  action: "gift_credits" | "send_email" | "mark_churned"
) {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const supabase = await getServiceClient();

  if (action === "gift_credits") {
    const result = await addCredits(
      supabase,
      userId,
      5,
      "Admin Win-back Bonus (+5)"
    );
    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }

  if (action === "mark_churned") {
    await supabase
      .from("profiles")
      .update({ is_churned: true })
      .eq("id", userId);
    return { success: true };
  }

  if (action === "send_email") {
    const risk = await calculateChurnRisk(userId);
    const emailType =
      risk.risk === "critical" ? "winback_critical" : "winback_high";

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return { success: false, error: "Service-Konfiguration fehlt." };
    }

    const res = await fetch(`${url}/functions/v1/send-nurture-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        emailType,
        forceWinback: true,
      }),
    });

    if (!res.ok) {
      return { success: false, error: await res.text() };
    }
    const data = await res.json();
    return data.sent
      ? { success: true }
      : { success: false, error: data.reason ?? "E-Mail nicht gesendet" };
  }

  return { success: false, error: "Unbekannte Aktion" };
}

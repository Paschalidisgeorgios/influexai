import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 403 });
  }

  const supabase = createServiceSupabaseClient();
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    { count: totalKeys },
    { count: activeKeys },
    { data: logsToday },
    { data: logsMonth },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from("api_keys").select("id", { count: "exact", head: true }),
    supabase
      .from("api_keys")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("api_logs")
      .select("status_code, user_id")
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("api_logs")
      .select("status_code, user_id")
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("api_logs")
      .select(
        "id, endpoint, status_code, response_time_ms, credits_used, created_at, user_id"
      )
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const monthLogs = logsMonth ?? [];
  const errorCount = monthLogs.filter((l) => l.status_code >= 400).length;
  const errorRatePct =
    monthLogs.length > 0
      ? Math.round((errorCount / monthLogs.length) * 100)
      : 0;

  const userCounts = new Map<string, number>();
  for (const l of monthLogs) {
    userCounts.set(l.user_id, (userCounts.get(l.user_id) ?? 0) + 1);
  }
  const topUserIds = [...userCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const profiles =
    topUserIds.length > 0
      ? ((
          await supabase
            .from("profiles")
            .select("id, email")
            .in(
              "id",
              topUserIds.map(([id]) => id)
            )
        ).data ?? [])
      : [];

  const emailById = new Map(profiles.map((p) => [p.id, p.email]));

  const topUsers = topUserIds.map(([id, requests]) => ({
    userId: id,
    email: emailById.get(id) ?? id.slice(0, 8),
    requests,
  }));

  const recentUserIds = [...new Set((recentLogs ?? []).map((l) => l.user_id))];
  const recentProfiles =
    recentUserIds.length > 0
      ? ((
          await supabase
            .from("profiles")
            .select("id, email")
            .in("id", recentUserIds)
        ).data ?? [])
      : [];
  const recentEmail = new Map(recentProfiles.map((p) => [p.id, p.email]));

  return NextResponse.json({
    stats: {
      totalKeys: totalKeys ?? 0,
      activeKeys: activeKeys ?? 0,
      requestsToday: logsToday?.length ?? 0,
      requestsMonth: monthLogs.length,
      errorRatePct,
    },
    topUsers,
    recentLogs: (recentLogs ?? []).map((l) => ({
      id: l.id,
      at: l.created_at,
      user: recentEmail.get(l.user_id) ?? l.user_id.slice(0, 8),
      endpoint: l.endpoint,
      status: l.status_code,
      responseTimeMs: l.response_time_ms,
      creditsUsed: l.credits_used,
    })),
  });
}

"use server";

import { requireAdmin } from "@/lib/admin";
import { addCredits } from "@/lib/credits";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type {
  AdminAnalyticsPayload,
  CohortRow,
  FeatureUsageRow,
  FunnelStep,
  GrowthPoint,
  LiveEvent,
  RevenuePoint,
  RevenueRange,
  TopUserRow,
} from "@/lib/admin-analytics-types";

const FLOW_LABELS: Record<string, string> = {
  "script-generator": "Script Generator",
  "niche-analyzer": "Niche Analyzer",
  "outlier-detector": "Outlier Detector",
  "video-remix": "Video Remix",
  "thumbnail-concept": "Thumbnail Konzept",
  produkt: "Produkt-Werbung",
  "ki-ich": "KI-Ich",
  "voice-tts": "Voice",
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDeShort(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
  });
}

function weekLabel(d: Date) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );
  return `KW ${week}`;
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function revenueRangeDays(range: RevenueRange) {
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  return 365;
}

async function getSupabase() {
  return createServiceSupabaseClient();
}

async function sumPayments(
  supabase: Awaited<ReturnType<typeof getSupabase>>,
  from: Date,
  to?: Date
) {
  let q = supabase
    .from("stripe_payments")
    .select("amount_cents")
    .gte("created_at", from.toISOString());
  if (to) q = q.lt("created_at", to.toISOString());
  const { data } = await q;
  return (data ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
}

/** Fallback revenue from credit_transactions when stripe_payments empty */
async function sumPurchasesFromTransactions(
  supabase: Awaited<ReturnType<typeof getSupabase>>,
  from: Date,
  to?: Date
) {
  let q = supabase
    .from("credit_transactions")
    .select("amount, description, created_at")
    .like("description", "Credits gekauft%")
    .gte("created_at", from.toISOString());
  if (to) q = q.lt("created_at", to.toISOString());
  const { data } = await q;
  const PACKAGE_EUR: Record<string, number> = {
    "50": 499,
    "100": 499,
    "120": 999,
    "500": 3900,
    "2500": 9900,
    "300": 1999,
  };
  return (data ?? []).reduce((sum, row) => {
    const m = row.description?.match(/\+(\d+)/);
    const credits = m ? parseInt(m[1], 10) : 0;
    const cents =
      PACKAGE_EUR[String(credits)] ?? (row.amount > 0 ? row.amount * 100 : 999);
    return sum + cents;
  }, 0);
}

async function getPaymentRows(
  supabase: Awaited<ReturnType<typeof getSupabase>>,
  from: Date
) {
  const { data } = await supabase
    .from("stripe_payments")
    .select("amount_cents, created_at")
    .gte("created_at", from.toISOString())
    .order("created_at", { ascending: true });
  if (data?.length) return data;
  const { data: txs } = await supabase
    .from("credit_transactions")
    .select("description, created_at")
    .like("description", "Credits gekauft%")
    .gte("created_at", from.toISOString());
  return (txs ?? []).map((t) => {
    const m = t.description?.match(/\+(\d+)/);
    const credits = m ? parseInt(m[1], 10) : 50;
    const map: Record<number, number> = {
      50: 499,
      120: 999,
      300: 1999,
    };
    return {
      amount_cents: map[credits] ?? 999,
      created_at: t.created_at,
    };
  });
}

export async function getAdminBusinessAnalytics(
  revenueRange: RevenueRange = "90d"
): Promise<AdminAnalyticsPayload | { error: string }> {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: admin.error };

  const supabase = await getSupabase();
  const now = new Date();

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const weekStart = startOfDay(
    new Date(now.getTime() - ((now.getDay() + 6) % 7) * 86400000)
  );

  const [
    mrrStripe,
    lastMrrStripe,
    totalStripe,
    profilesRes,
    gens7dRes,
    gens30dRes,
    purchaseUsersRes,
    gensAllRes,
    profilesWeekRes,
  ] = await Promise.all([
    sumPayments(supabase, monthStart),
    sumPayments(supabase, lastMonthStart, monthStart),
    supabase.from("stripe_payments").select("amount_cents"),
    supabase.from("profiles").select("id, email, created_at"),
    supabase
      .from("generations")
      .select("user_id")
      .gte("created_at", weekAgo.toISOString()),
    supabase
      .from("generations")
      .select("user_id, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("credit_transactions")
      .select("user_id")
      .like("description", "Credits gekauft%"),
    supabase
      .from("generations")
      .select("user_id, type, created_at, credits_used"),
    supabase
      .from("profiles")
      .select("id")
      .gte("created_at", weekStart.toISOString()),
  ]);

  let mrrCents = mrrStripe;
  let lastMrrCents = lastMrrStripe;
  let totalRevenueCents = (totalStripe.data ?? []).reduce(
    (s, r) => s + (r.amount_cents ?? 0),
    0
  );

  if (mrrCents === 0) {
    mrrCents = await sumPurchasesFromTransactions(supabase, monthStart);
    lastMrrCents = await sumPurchasesFromTransactions(
      supabase,
      lastMonthStart,
      monthStart
    );
  }
  if (totalRevenueCents === 0) {
    totalRevenueCents = await sumPurchasesFromTransactions(
      supabase,
      new Date(0)
    );
  }

  const profiles = profilesRes.data ?? [];
  const totalUsers = profiles.length;
  const activeUsers7d = new Set((gens7dRes.data ?? []).map((g) => g.user_id))
    .size;
  const newUsersThisWeek = profilesWeekRes.data?.length ?? 0;

  const purchasers = new Set(
    (purchaseUsersRes.data ?? []).map((p) => p.user_id)
  );
  const arpuCents =
    purchasers.size > 0 ? Math.round(totalRevenueCents / purchasers.size) : 0;

  const gens30 = gens30dRes.data ?? [];
  const activeLastMonth = new Set(
    gens30
      .filter((g) => new Date(g.created_at) >= thirtyDaysAgo)
      .map((g) => g.user_id)
  ).size;
  const churned = profiles.filter((p) => {
    const userGens = gens30.filter((g) => g.user_id === p.id);
    if (userGens.length === 0) {
      const age = now.getTime() - new Date(p.created_at).getTime();
      return age > 30 * 86400000;
    }
    const last = userGens.reduce(
      (a, g) => (new Date(g.created_at) > new Date(a) ? g.created_at : a),
      userGens[0].created_at
    );
    return now.getTime() - new Date(last).getTime() > 30 * 86400000;
  }).length;
  const churnRatePct =
    activeLastMonth > 0
      ? Math.round((churned / Math.max(activeLastMonth, 1)) * 100)
      : 0;

  const days = revenueRangeDays(revenueRange);
  const revFrom = startOfDay(new Date(now.getTime() - (days - 1) * 86400000));
  const paymentRows = await getPaymentRows(supabase, revFrom);
  const revenueByDay = new Map<string, number>();
  for (const row of paymentRows) {
    const key = dateKey(new Date(row.created_at));
    revenueByDay.set(
      key,
      (revenueByDay.get(key) ?? 0) + (row.amount_cents ?? 0) / 100
    );
  }
  const revenue: RevenuePoint[] = [];
  const cursor = new Date(revFrom);
  while (cursor <= now) {
    const key = dateKey(cursor);
    revenue.push({
      date: key,
      label: formatDeShort(cursor.toISOString()),
      revenueEur: Math.round((revenueByDay.get(key) ?? 0) * 100) / 100,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const growthFrom = startOfDay(new Date(now.getTime() - 89 * 86400000));
  const signupsByDay = new Map<string, number>();
  for (const p of profiles) {
    const created = new Date(p.created_at);
    if (created < growthFrom) continue;
    const key = dateKey(created);
    signupsByDay.set(key, (signupsByDay.get(key) ?? 0) + 1);
  }
  let cumulative = profiles.filter(
    (p) => new Date(p.created_at) < growthFrom
  ).length;
  const growth: GrowthPoint[] = [];
  const gCursor = new Date(growthFrom);
  while (gCursor <= now) {
    const key = dateKey(gCursor);
    const signups = signupsByDay.get(key) ?? 0;
    cumulative += signups;
    growth.push({
      date: key,
      label: formatDeShort(gCursor.toISOString()),
      signups,
      cumulative,
    });
    gCursor.setDate(gCursor.getDate() + 1);
  }

  const gensAll = gensAllRes.data ?? [];
  const thirtyStart = thirtyDaysAgo.toISOString();
  const recentGens = gensAll.filter((g) => g.created_at >= thirtyStart);
  const typeCounts = new Map<string, number>();
  for (const g of recentGens) {
    typeCounts.set(g.type, (typeCounts.get(g.type) ?? 0) + 1);
  }
  const totalGen = recentGens.length || 1;
  const featureUsage: FeatureUsageRow[] = [...typeCounts.entries()]
    .map(([type, count]) => ({
      type,
      label: FLOW_LABELS[type] ?? type,
      count,
      pct: Math.round((count / totalGen) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const userGenCount = new Map<string, { gens: number; spent: number }>();
  for (const g of gensAll) {
    const cur = userGenCount.get(g.user_id) ?? { gens: 0, spent: 0 };
    cur.gens += 1;
    cur.spent += g.credits_used ?? 0;
    userGenCount.set(g.user_id, cur);
  }
  const emailMap = new Map(profiles.map((p) => [p.id, p.email ?? ""]));
  const createdMap = new Map(profiles.map((p) => [p.id, p.created_at]));
  const topUsers: TopUserRow[] = [...userGenCount.entries()]
    .map(([id, v]) => ({
      id,
      email: emailMap.get(id) ?? "",
      generations: v.gens,
      creditsSpent: v.spent,
      memberSince: createdMap.get(id) ?? "",
    }))
    .sort((a, b) => b.generations - a.generations)
    .slice(0, 10);

  const signups = profiles.length;
  const usersWithGen = new Set(gensAll.map((g) => g.user_id));
  const firstGenUsers = usersWithGen.size;
  const genCountByUser = new Map<string, number>();
  for (const g of gensAll) {
    genCountByUser.set(g.user_id, (genCountByUser.get(g.user_id) ?? 0) + 1);
  }
  const secondGenUsers = [...genCountByUser.values()].filter(
    (c) => c >= 2
  ).length;
  const firstPurchase = purchasers.size;
  const purchaseCount = new Map<string, number>();
  for (const row of purchaseUsersRes.data ?? []) {
    purchaseCount.set(row.user_id, (purchaseCount.get(row.user_id) ?? 0) + 1);
  }
  const secondPurchase = [...purchaseCount.values()].filter(
    (c) => c >= 2
  ).length;

  const funnel: FunnelStep[] = [
    {
      key: "visitors",
      label: "Landing Page (geschätzt)",
      count: Math.max(signups * 8, signups),
      pct: 100,
    },
    {
      key: "signup",
      label: "Signups",
      count: signups,
      pct:
        signups > 0
          ? Math.round((signups / Math.max(signups * 8, 1)) * 100)
          : 0,
    },
    {
      key: "first_gen",
      label: "Erste Generation",
      count: firstGenUsers,
      pct: signups > 0 ? Math.round((firstGenUsers / signups) * 100) : 0,
    },
    {
      key: "second_gen",
      label: "Zweite Generation",
      count: secondGenUsers,
      pct:
        firstGenUsers > 0
          ? Math.round((secondGenUsers / firstGenUsers) * 100)
          : 0,
    },
    {
      key: "first_purchase",
      label: "Erster Kauf",
      count: firstPurchase,
      pct: signups > 0 ? Math.round((firstPurchase / signups) * 100) : 0,
    },
    {
      key: "second_purchase",
      label: "Zweiter Kauf",
      count: secondPurchase,
      pct:
        firstPurchase > 0
          ? Math.round((secondPurchase / firstPurchase) * 100)
          : 0,
    },
  ];

  const cohortWeeks = 6;
  const cohortMap = new Map<string, { signups: number; userIds: string[] }>();
  for (const p of profiles) {
    const w = startOfDay(new Date(p.created_at));
    w.setDate(w.getDate() - ((w.getDay() + 6) % 7));
    const key = dateKey(w);
    const c = cohortMap.get(key) ?? { signups: 0, userIds: [] };
    c.signups += 1;
    c.userIds.push(p.id);
    cohortMap.set(key, c);
  }

  const sortedCohortKeys = [...cohortMap.keys()].sort().slice(-cohortWeeks);
  const cohorts: CohortRow[] = sortedCohortKeys.map((key) => {
    const cohort = cohortMap.get(key)!;
    const cohortStart = new Date(key);
    const retention: (number | null)[] = [];
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(cohortStart);
      weekStart.setDate(weekStart.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      if (weekStart > now) {
        retention.push(null);
        continue;
      }
      const activeInWeek = new Set(
        gensAll
          .filter((g) => {
            const t = new Date(g.created_at);
            return (
              cohort.userIds.includes(g.user_id) &&
              t >= weekStart &&
              t < weekEnd
            );
          })
          .map((g) => g.user_id)
      ).size;
      retention.push(
        cohort.signups > 0
          ? Math.round((activeInWeek / cohort.signups) * 100)
          : 0
      );
    }
    return {
      weekLabel: weekLabel(cohortStart),
      signupCount: cohort.signups,
      retention,
    };
  });

  return {
    kpis: {
      mrrCents,
      mrrChangePct: pctChange(mrrCents, lastMrrCents),
      totalRevenueCents,
      activeUsers7d,
      totalUsers,
      newUsersThisWeek,
      arpuCents,
      churnRatePct,
    },
    revenue,
    growth,
    featureUsage,
    topUsers,
    funnel,
    cohorts,
    landingNote:
      "Landing-Besucher geschätzt (8× Signups).",
  };
}

export async function getAdminLiveActivity(): Promise<
  LiveEvent[] | { error: string }
> {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: admin.error };

  const supabase = await getSupabase();
  const events: LiveEvent[] = [];

  const [profiles, gens, payments, referrals] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("generations")
      .select("user_id, type, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("stripe_payments")
      .select("user_id, amount_cents, plan, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("referrals")
      .select("referrer_id, referred_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const userNum = (id: string) => {
    const n = parseInt(id.replace(/-/g, "").slice(0, 6), 16) % 900;
    return `#${n + 100}`;
  };

  for (const p of profiles.data ?? []) {
    events.push({
      id: `signup-${p.id}`,
      at: p.created_at,
      type: "signup",
      userLabel: `User ${userNum(p.id)}`,
      detail: "organic",
    });
  }
  for (const g of gens.data ?? []) {
    events.push({
      id: `gen-${g.user_id}-${g.created_at}`,
      at: g.created_at,
      type: "generation",
      userLabel: `User ${userNum(g.user_id)}`,
      detail: FLOW_LABELS[g.type] ?? g.type,
    });
  }
  for (const pay of payments.data ?? []) {
    const eur = ((pay.amount_cents ?? 0) / 100).toFixed(2);
    events.push({
      id: `pay-${pay.user_id}-${pay.created_at}`,
      at: pay.created_at,
      type: "purchase",
      userLabel: `User ${userNum(pay.user_id)}`,
      detail: `€${eur} ${pay.plan ?? "Credits"}`,
    });
  }
  for (const r of referrals.data ?? []) {
    events.push({
      id: `ref-${r.created_at}`,
      at: r.created_at,
      type: "referral",
      userLabel: `User ${userNum(r.referrer_id)}`,
      detail: `referred ${userNum(r.referred_id)}`,
    });
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return events.slice(0, 20);
}

export async function adminGiftCreditsByEmail(
  email: string,
  amount: number,
  reason: string
) {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const supabase = await getSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (!profile) return { success: false, error: "Nutzer nicht gefunden." };

  const result = await addCredits(
    supabase,
    profile.id,
    amount,
    reason.trim() || `Admin Bonus (+${amount})`
  );
  return result.success
    ? { success: true }
    : { success: false, error: result.error };
}

export async function adminSearchUser(email: string) {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: admin.error };

  const supabase = await getSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, credits, plan, created_at, is_admin, is_churned"
    )
    .ilike("email", `%${email.trim()}%`)
    .limit(5);

  if (!profile?.length) return { users: [] };

  const users = [];
  for (const p of profile) {
    const { count } = await supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", p.id);
    users.push({ ...p, generationCount: count ?? 0 });
  }
  return { users };
}

export async function adminCreateAnnouncement(message: string) {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const supabase = await getSupabase();
  const expires = new Date(Date.now() + 24 * 3600000).toISOString();

  await supabase
    .from("announcements")
    .update({ is_active: false })
    .eq("is_active", true);

  const { error } = await supabase.from("announcements").insert({
    message: message.trim(),
    expires_at: expires,
    is_active: true,
    created_by: admin.userId,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function adminSetMaintenanceMode(enabled: boolean) {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const supabase = await getSupabase();
  const { error } = await supabase.from("platform_settings").upsert({
    key: "maintenance_mode",
    value: enabled,
    updated_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };
  return { success: true, enabled };
}

export async function getMaintenanceMode(): Promise<boolean> {
  try {
    const supabase = await getSupabase();
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();
    return data?.value === true || data?.value === "true";
  } catch {
    return false;
  }
}

export async function getActiveAnnouncement(): Promise<string | null> {
  try {
    const supabase = await getSupabase();
    const { data } = await supabase
      .from("announcements")
      .select("message")
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.message ?? null;
  } catch {
    return null;
  }
}

import type { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { winbackCriticalEmail, winbackHighEmail } from "./templates.ts";

type Supabase = ReturnType<typeof createClient>;

export type WinbackType = "winback_high" | "winback_critical";

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export async function computeChurnScore(
  supabase: Supabase,
  userId: string
): Promise<{ score: number; lastGen: string | null; days: number | null }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, onboarding_completed, is_churned")
    .eq("id", userId)
    .single();

  if (!profile || profile.is_churned) {
    return { score: 0, lastGen: null, days: null };
  }

  const { data: gens } = await supabase
    .from("generations")
    .select("type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const count = gens?.length ?? 0;
  const types = new Set((gens ?? []).map((g) => g.type));
  const lastGen = gens?.[0]?.created_at ?? null;
  const days = daysSince(lastGen);

  let score = 0;
  if (days === null || count === 0) score += 30;
  else if (days >= 7) score += 30;
  else if (days >= 3) score += 20;

  if ((profile.credits ?? 0) < 5) score += 25;
  if (count > 0 && types.size <= 1) score += 15;
  if (!profile.onboarding_completed) score += 20;

  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data: visits } = await supabase
    .from("user_activity_visits")
    .select("visited_at")
    .eq("user_id", userId)
    .gte("visited_at", threeDaysAgo)
    .limit(3);

  const genRecent = lastGen && new Date(lastGen) >= new Date(threeDaysAgo);
  if ((visits?.length ?? 0) >= 2 && !genRecent) score += 10;

  if (days !== null && days < 1) score -= 10;

  const { data: purchase } = await supabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .like("description", "Credits gekauft%")
    .limit(1)
    .maybeSingle();
  if (purchase) score -= 15;

  const { count: refCount } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId);
  if ((refCount ?? 0) > 0) score -= 10;

  return {
    score: Math.max(0, Math.min(100, score)),
    lastGen,
    days,
  };
}

async function winbackSentWithin30Days(
  supabase: Supabase,
  userId: string,
  type: WinbackType
): Promise<boolean> {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data } = await supabase
    .from("email_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("email_type", type)
    .gte("sent_at", since)
    .limit(1)
    .maybeSingle();
  return !!data;
}

async function addCredits(
  supabase: Supabase,
  userId: string,
  amount: number,
  description: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();
  if (!profile) return false;

  const remaining = (profile.credits ?? 0) + amount;
  const { error } = await supabase
    .from("profiles")
    .update({ credits: remaining })
    .eq("id", userId);
  if (error) return false;

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount,
    description,
  });
  return true;
}

export async function processWinbackUser(
  supabase: Supabase,
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    credits: number | null;
    nurture_unsubscribed: boolean;
  },
  sendResend: (to: string, subject: string, html: string) => Promise<boolean>,
  unsubUrl: string,
  forceType?: WinbackType,
  skipCooldown = false
): Promise<{ sent?: WinbackType; skipped?: string }> {
  if (profile.nurture_unsubscribed || !profile.email) {
    return { skipped: "unsubscribed" };
  }

  const { score, days } = await computeChurnScore(supabase, profile.id);
  if (score < 51 && !forceType) {
    return { skipped: "low_score" };
  }

  const name = profile.full_name?.trim().split(/\s+/)[0] ?? "Creator";

  let type: WinbackType | null = forceType ?? null;
  if (!type) {
    if (score >= 76 && (days === null || days >= 10)) {
      type = "winback_critical";
    } else if (score >= 51 && (days === null || days >= 5)) {
      type = "winback_high";
    }
  }

  if (!type) return { skipped: "not_eligible" };

  if (
    !skipCooldown &&
    (await winbackSentWithin30Days(supabase, profile.id, type))
  ) {
    return { skipped: "sent_recently" };
  }

  if (type === "winback_critical") {
    await addCredits(supabase, profile.id, 5, "Win-back Bonus (+5 Credits)");
  }

  const { subject, html } =
    type === "winback_critical"
      ? winbackCriticalEmail(name, unsubUrl)
      : winbackHighEmail(name, profile.credits ?? 10, 3, unsubUrl);

  const sent = await sendResend(profile.email, subject, html);
  if (sent) {
    await supabase.from("email_logs").insert({
      user_id: profile.id,
      email_type: type,
    });

    const pushType =
      type === "winback_critical" ? "WIN_BACK_BONUS" : "WIN_BACK_5_DAYS";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceKey) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: profile.id, type: pushType }),
        });
      } catch (e) {
        console.error("[churn] push failed:", e);
      }
    }

    return { sent: type };
  }
  return { skipped: "resend_failed" };
}

export async function runChurnWinbackCron(
  supabase: Supabase,
  sendResend: (to: string, subject: string, html: string) => Promise<boolean>,
  getUnsubUrl: (userId: string) => Promise<string>
) {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, credits, nurture_unsubscribed, is_churned")
    .eq("is_churned", false)
    .not("email", "is", null);

  const results = [];
  for (const p of profiles ?? []) {
    const unsub = await getUnsubUrl(p.id);
    results.push(await processWinbackUser(supabase, p, sendResend, unsub));
  }
  return results;
}

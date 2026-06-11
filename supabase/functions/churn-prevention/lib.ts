import type { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildChurnEmail, sendChurnEmail } from "./email.ts";
import type {
  ChurnEmailType,
  ChurnProfile,
  Day3Idea,
  Day7Trends,
} from "./types.ts";

type Supabase = ReturnType<typeof createClient>;

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";
const SITE = "https://influexaicreator.com";

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function firstName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "Creator";
  return fullName.trim().split(/\s+/)[0];
}

function stripJson(raw: string): string {
  let text = raw.trim();
  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = text.search(/[[{]/);
  if (start > 0) text = text.slice(start);
  return text.trim();
}

async function claudeJson<T>(userPrompt: string): Promise<T> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY")?.trim();
  if (!apiKey?.startsWith("sk-ant-")) {
    throw new Error("ANTHROPIC_API_KEY missing");
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system:
        "Antworte NUR mit validem JSON, ohne Markdown. Sprache: Deutsch.",
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";
  return JSON.parse(stripJson(text)) as T;
}

export async function resolveNiche(
  supabase: Supabase,
  userId: string
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("creator_niche")
    .eq("id", userId)
    .single();

  if (profile?.creator_niche?.trim()) {
    return profile.creator_niche.trim();
  }

  const { data: save } = await supabase
    .from("niche_saves")
    .select("niche_data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const title = (save?.niche_data as { title?: string } | null)?.title;
  return title?.trim() || "YouTube Shorts";
}

async function getLastActivityAt(
  supabase: Supabase,
  userId: string,
  profile: ChurnProfile
): Promise<string | null> {
  const { data: gens } = await supabase
    .from("generations")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const lastGen = gens?.[0]?.created_at ?? null;
  const candidates = [lastGen, profile.last_active_at, profile.created_at].filter(
    Boolean
  ) as string[];

  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) =>
    new Date(a) > new Date(b) ? a : b
  );
}

async function churnSentWithinDays(
  supabase: Supabase,
  userId: string,
  days: number
): Promise<boolean> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from("churn_prevention")
    .select("id")
    .eq("user_id", userId)
    .gte("sent_at", since)
    .limit(1)
    .maybeSingle();
  return !!data;
}

async function hasChurnType(
  supabase: Supabase,
  userId: string,
  type: ChurnEmailType
): Promise<boolean> {
  const { data } = await supabase
    .from("churn_prevention")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .limit(1)
    .maybeSingle();
  return !!data;
}

async function unsubscribeUrl(userId: string): Promise<string> {
  const secret =
    Deno.env.get("NURTURE_UNSUBSCRIBE_SECRET") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    "nurture-unsubscribe-dev";
  const data = new TextEncoder().encode(userId + secret);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const token = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${SITE}/api/unsubscribe?uid=${encodeURIComponent(userId)}&token=${token}`;
}

async function generateDay3Idea(niche: string): Promise<Day3Idea> {
  const raw = await claudeJson<{ title?: string; hook?: string }>(
    `Generiere eine konkrete, trending Video-Idee für die Nische: ${niche}.
Antworte als JSON: { "title": "fesselnder Titel", "hook": "Hook in einem Satz" }`
  );
  return {
    title: String(raw.title ?? "Dein nächster viral Short").trim(),
    hook: String(raw.hook ?? "Starte mit einer Frage, die sofort Neugier weckt.").trim(),
  };
}

async function generateDay7Trends(niche: string): Promise<Day7Trends> {
  const raw = await claudeJson<{ trends?: string[] }>(
    `Nenne 3 aktuelle, konkrete YouTube-Shorts-Trends für die Nische "${niche}".
Antworte als JSON: { "trends": ["...", "...", "..."] }`
  );
  const trends = Array.isArray(raw.trends)
    ? raw.trends.filter((t) => typeof t === "string").slice(0, 3)
    : [];
  while (trends.length < 3) {
    trends.push(`Trend ${trends.length + 1} in ${niche}`);
  }
  return { trends };
}

async function grantBonusCredits(
  supabase: Supabase,
  userId: string,
  amount: number
): Promise<boolean> {
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
    description: "Churn Prevention Bonus (+10 Credits)",
  });
  return true;
}

export function pickChurnEmailType(
  daysInactive: number,
  hasDay3: boolean,
  hasDay7: boolean,
  hasDay14: boolean,
  churnEmailInLast7Days: boolean
): ChurnEmailType | null {
  if (churnEmailInLast7Days) return null;
  // Sequenz: Tag 3 → Tag 7 → Tag 14 (jeweils einmalig)
  if (daysInactive >= 3 && !hasDay3) return "day3";
  if (daysInactive >= 7 && hasDay3 && !hasDay7) return "day7";
  if (daysInactive >= 14 && hasDay7 && !hasDay14) return "day14";
  return null;
}

/** User mit letzter Generation >3 Tage, ohne Generation in den letzten 3 Tagen */
export async function fetchInactiveUserIds(
  supabase: Supabase
): Promise<string[]> {
  const cutoff = new Date(Date.now() - 3 * 86400000).toISOString();

  const { data: recent, error: recentErr } = await supabase
    .from("generations")
    .select("user_id")
    .gte("created_at", cutoff);

  if (recentErr) throw new Error(recentErr.message);

  const activeSet = new Set(
    (recent ?? []).map((r) => r.user_id as string).filter(Boolean)
  );

  const { data: older, error: olderErr } = await supabase
    .from("generations")
    .select("user_id")
    .lt("created_at", cutoff);

  if (olderErr) throw new Error(olderErr.message);

  const inactive = new Set<string>();
  for (const row of older ?? []) {
    const uid = row.user_id as string;
    if (uid && !activeSet.has(uid)) inactive.add(uid);
  }
  return [...inactive];
}

export type ProcessResult = {
  userId: string;
  sent?: ChurnEmailType;
  skipped?: string;
};

export async function processChurnUser(
  supabase: Supabase,
  profile: ChurnProfile
): Promise<ProcessResult> {
  if (profile.is_churned || profile.nurture_unsubscribed || !profile.email) {
    return { userId: profile.id, skipped: "ineligible" };
  }

  const lastActivity = await getLastActivityAt(supabase, profile.id, profile);
  const daysInactive = daysSince(lastActivity);
  if (daysInactive === null || daysInactive < 3) {
    return { userId: profile.id, skipped: "active" };
  }

  const churnIn7 = await churnSentWithinDays(supabase, profile.id, 7);
  const hasDay3 = await hasChurnType(supabase, profile.id, "day3");
  const hasDay7 = await hasChurnType(supabase, profile.id, "day7");
  const hasDay14 = await hasChurnType(supabase, profile.id, "day14");

  const emailType = pickChurnEmailType(
    daysInactive,
    hasDay3,
    hasDay7,
    hasDay14,
    churnIn7
  );

  if (!emailType) {
    return { userId: profile.id, skipped: "no_type_due" };
  }

  const niche = await resolveNiche(supabase, profile.id);
  const name = firstName(profile.full_name);
  const credits = profile.credits ?? 0;
  const unsub = await unsubscribeUrl(profile.id);

  let idea: Day3Idea | undefined;
  let trends: Day7Trends | undefined;

  try {
    if (emailType === "day3") {
      idea = await generateDay3Idea(niche);
    } else if (emailType === "day7") {
      trends = await generateDay7Trends(niche);
    } else if (emailType === "day14") {
      const ok = await grantBonusCredits(supabase, profile.id, 10);
      if (!ok) {
        return { userId: profile.id, skipped: "credits_failed" };
      }
    }
  } catch (e) {
    console.error("[churn-prevention] Claude:", profile.id, e);
    return { userId: profile.id, skipped: "claude_failed" };
  }

  const { subject, html } = buildChurnEmail(
    emailType,
    name,
    emailType === "day14" ? credits + 10 : credits,
    niche,
    unsub,
    idea,
    trends
  );

  const sent = await sendChurnEmail(profile.email, subject, html);
  if (!sent) {
    return { userId: profile.id, skipped: "resend_failed" };
  }

  await supabase.from("churn_prevention").insert({
    user_id: profile.id,
    type: emailType,
  });

  return { userId: profile.id, sent: emailType };
}

export async function runChurnPreventionCron(supabase: Supabase) {
  const inactiveIds = await fetchInactiveUserIds(supabase);
  if (inactiveIds.length === 0) return [];

  const results: ProcessResult[] = [];
  const batchSize = 100;

  for (let i = 0; i < inactiveIds.length; i += batchSize) {
    const batch = inactiveIds.slice(i, i + batchSize);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, credits, nurture_unsubscribed, is_churned, last_active_at, created_at"
      )
      .in("id", batch)
      .eq("is_churned", false)
      .eq("onboarding_completed", true)
      .eq("nurture_unsubscribed", false)
      .not("email", "is", null);

    if (error) throw new Error(error.message);

    for (const p of profiles ?? []) {
      results.push(await processChurnUser(supabase, p as ChurnProfile));
    }
  }

  return results;
}

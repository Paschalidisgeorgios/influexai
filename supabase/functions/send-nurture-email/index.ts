import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  activationEmail,
  featureDiscoveryEmail,
  retentionEmail,
  upgradeEmail,
  welcomeEmail,
} from "./templates.ts";
import {
  processWinbackUser,
  runChurnWinbackCron,
  type WinbackType,
} from "./churn.ts";

const FROM_EMAIL = "noreply@influexaicreator.com";
const SITE = "https://influexaicreator.com";

type EmailType =
  | "welcome"
  | "activation"
  | "feature_discovery"
  | "retention"
  | "upgrade";

const SEQUENCE_DAY: Record<EmailType, number> = {
  welcome: 0,
  activation: 1,
  feature_discovery: 3,
  retention: 7,
  upgrade: 14,
};

const ORDER: EmailType[] = [
  "welcome",
  "activation",
  "feature_discovery",
  "retention",
  "upgrade",
];

function firstName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "Creator";
  return fullName.trim().split(/\s+/)[0];
}

function daysSince(iso: string): number {
  const start = new Date(iso);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

async function unsubscribeToken(userId: string): Promise<string> {
  const secret =
    Deno.env.get("NURTURE_UNSUBSCRIBE_SECRET") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    "nurture-unsubscribe-dev";
  const data = new TextEncoder().encode(userId + secret);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function unsubscribeUrl(userId: string, token: string): string {
  return `${SITE}/api/unsubscribe?uid=${encodeURIComponent(userId)}&token=${token}`;
}

async function sendResend(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.log("[send-nurture-email] RESEND_API_KEY not set — skipped:", {
      to,
      subject,
    });
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `InfluexAI <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    console.error("[send-nurture-email] Resend error:", await res.text());
    return false;
  }
  return true;
}

type UserStats = {
  generationCount: number;
  lastGenerationAt: string | null;
};

async function getUserStats(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<UserStats> {
  const { count } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data: lastGen } = await supabase
    .from("generations")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    generationCount: count ?? 0,
    lastGenerationAt: lastGen?.created_at ?? null,
  };
}

async function hasStripePurchase(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .like("description", "Credits gekauft%")
    .limit(1)
    .maybeSingle();
  return !!data;
}

async function getSentTypes(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Set<EmailType>> {
  const { data } = await supabase
    .from("email_logs")
    .select("email_type")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.email_type as EmailType));
}

function isEligible(
  type: EmailType,
  days: number,
  sent: Set<EmailType>,
  stats: UserStats,
  purchased: boolean
): boolean {
  if (sent.has(type)) return false;
  if (days < SEQUENCE_DAY[type]) return false;

  switch (type) {
    case "welcome":
      return true;
    case "activation":
      return stats.generationCount === 0;
    case "feature_discovery":
      return true;
    case "retention": {
      if (stats.generationCount >= 5) return false;
      if (!stats.lastGenerationAt) return true;
      const last = new Date(stats.lastGenerationAt);
      const inactiveDays = Math.floor((Date.now() - last.getTime()) / 86400000);
      return inactiveDays > 5;
    }
    case "upgrade":
      return !purchased;
    default:
      return false;
  }
}

function buildEmail(
  type: EmailType,
  name: string,
  credits: number,
  stats: UserStats,
  unsub: string
): { subject: string; html: string } {
  switch (type) {
    case "welcome":
      return welcomeEmail(name, credits, unsub);
    case "activation":
      return activationEmail(name, unsub);
    case "feature_discovery":
      return featureDiscoveryEmail(name, credits, unsub);
    case "retention":
      return retentionEmail(name, stats.generationCount, credits, unsub);
    case "upgrade":
      return upgradeEmail(name, credits, unsub);
  }
}

async function sendOne(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  fullName: string | null,
  credits: number,
  createdAt: string,
  type: EmailType
): Promise<boolean> {
  const stats = await getUserStats(supabase, userId);
  const token = await unsubscribeToken(userId);
  const unsub = unsubscribeUrl(userId, token);
  const name = firstName(fullName);
  const { subject, html } = buildEmail(type, name, credits, stats, unsub);
  const sent = await sendResend(email, subject, html);

  if (sent) {
    await supabase.from("email_logs").insert({
      user_id: userId,
      email_type: type,
    });
    await supabase
      .from("profiles")
      .update({
        email_sequence_day: SEQUENCE_DAY[type],
        last_nurture_email_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  return sent;
}

async function processUser(
  supabase: ReturnType<typeof createClient>,
  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
    credits: number | null;
    created_at: string;
    nurture_unsubscribed: boolean;
  }
): Promise<{ userId: string; sent?: EmailType; skipped?: string }> {
  if (profile.nurture_unsubscribed || !profile.email) {
    return { userId: profile.id, skipped: "unsubscribed_or_no_email" };
  }

  const days = daysSince(profile.created_at);
  const sent = await getSentTypes(supabase, profile.id);
  const stats = await getUserStats(supabase, profile.id);
  const purchased = await hasStripePurchase(supabase, profile.id);

  for (const type of ORDER) {
    if (isEligible(type, days, sent, stats, purchased)) {
      const ok = await sendOne(
        supabase,
        profile.id,
        profile.email,
        profile.full_name,
        profile.credits ?? 10,
        profile.created_at,
        type
      );
      return {
        userId: profile.id,
        sent: ok ? type : undefined,
        skipped: ok ? undefined : "resend_failed",
      };
    }
  }

  return { userId: profile.id, skipped: "nothing_due" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceKey
    );

    const getUnsubForUser = async (userId: string) => {
      const token = await unsubscribeToken(userId);
      return unsubscribeUrl(userId, token);
    };

    if (body.forceWinback && body.userId) {
      const winType = body.emailType as WinbackType;
      if (winType !== "winback_high" && winType !== "winback_critical") {
        return new Response(JSON.stringify({ error: "Invalid winback type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, credits, nurture_unsubscribed, is_churned"
        )
        .eq("id", body.userId)
        .single();

      if (!profile?.email || profile.is_churned) {
        return new Response(
          JSON.stringify({ sent: false, reason: "no_email_or_churned" }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      const unsub = await getUnsubForUser(profile.id);
      const result = await processWinbackUser(
        supabase,
        profile,
        sendResend,
        unsub,
        winType,
        true
      );

      return new Response(
        JSON.stringify({
          sent: !!result.sent,
          emailType: result.sent,
          reason: result.skipped,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (body.mode === "churn_winback") {
      const results = await runChurnWinbackCron(
        supabase,
        sendResend,
        getUnsubForUser
      );
      const sentCount = results.filter((r) => r.sent).length;
      return new Response(
        JSON.stringify({
          mode: "churn_winback",
          processed: results.length,
          sent: sentCount,
          results,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (body.userId && body.emailType) {
      const type = body.emailType as EmailType;
      if (!ORDER.includes(type)) {
        return new Response(JSON.stringify({ error: "Invalid emailType" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, credits, created_at, nurture_unsubscribed"
        )
        .eq("id", body.userId)
        .single();

      if (!profile?.email) {
        return new Response(
          JSON.stringify({ sent: false, reason: "no_email" }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (profile.nurture_unsubscribed) {
        return new Response(
          JSON.stringify({ sent: false, reason: "unsubscribed" }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      const sentSet = await getSentTypes(supabase, profile.id);
      if (sentSet.has(type)) {
        return new Response(
          JSON.stringify({ sent: false, reason: "already_sent" }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      if (type !== "welcome") {
        const days = daysSince(profile.created_at);
        const stats = await getUserStats(supabase, profile.id);
        const purchased = await hasStripePurchase(supabase, profile.id);
        if (!isEligible(type, days, sentSet, stats, purchased)) {
          return new Response(
            JSON.stringify({ sent: false, reason: "not_eligible" }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
      }

      const ok = await sendOne(
        supabase,
        profile.id,
        profile.email,
        profile.full_name,
        profile.credits ?? 10,
        profile.created_at,
        type
      );

      return new Response(JSON.stringify({ sent: ok, emailType: type }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, credits, created_at, nurture_unsubscribed")
      .not("email", "is", null);

    if (error) {
      console.error("[send-nurture-email] profiles query:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = [];
    for (const profile of profiles ?? []) {
      results.push(await processUser(supabase, profile));
    }

    const sentCount = results.filter((r) => r.sent).length;
    return new Response(
      JSON.stringify({
        mode: body.mode ?? "cron",
        processed: results.length,
        sent: sentCount,
        results,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[send-nurture-email]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

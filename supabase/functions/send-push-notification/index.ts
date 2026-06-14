import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type NotificationType =
  | "LOW_CREDITS"
  | "CREDITS_EMPTY"
  | "WIN_BACK_5_DAYS"
  | "WIN_BACK_BONUS"
  | "COMMUNITY_REPLY"
  | "WEEKLY_CHALLENGE"
  | "REFERRAL_JOINED";

type NotificationPreferences = {
  credits_warnings?: boolean;
  community_replies?: boolean;
  weekly_challenges?: boolean;
  reengagement?: boolean;
  new_features?: boolean;
};

const DEFAULT_PREFS: NotificationPreferences = {
  credits_warnings: true,
  community_replies: true,
  weekly_challenges: true,
  reengagement: true,
  new_features: false,
};

const PREF_KEY: Record<NotificationType, keyof NotificationPreferences> = {
  LOW_CREDITS: "credits_warnings",
  CREDITS_EMPTY: "credits_warnings",
  WIN_BACK_5_DAYS: "reengagement",
  WIN_BACK_BONUS: "reengagement",
  COMMUNITY_REPLY: "community_replies",
  WEEKLY_CHALLENGE: "weekly_challenges",
  REFERRAL_JOINED: "reengagement",
};

const TEMPLATES: Record<
  NotificationType,
  { title: string; body: string; screen: string }
> = {
  LOW_CREDITS: {
    title: "⚡ Credits werden knapp",
    body: "Du hast nur noch {n} Credits. Jetzt aufladen.",
    screen: "/credits",
  },
  CREDITS_EMPTY: {
    title: "🚨 Keine Credits mehr",
    body: "Lade jetzt auf um weiter zu erstellen.",
    screen: "/credits",
  },
  WIN_BACK_5_DAYS: {
    title: "Dein KI Studio wartet 👀",
    body: "Du warst 5 Tage weg. Los geht's!",
    screen: "/",
  },
  WIN_BACK_BONUS: {
    title: "🎁 5 Bonus-Credits für dich",
    body: "Komm zurück und hol dir deine Credits.",
    screen: "/",
  },
  COMMUNITY_REPLY: {
    title: "💬 Jemand hat geantwortet",
    body: "{name} hat auf deinen Post geantwortet.",
    screen: "/community",
  },
  WEEKLY_CHALLENGE: {
    title: "🏆 Neue Weekly Challenge!",
    body: "{challengeTitle} — mach mit!",
    screen: "/community",
  },
  REFERRAL_JOINED: {
    title: "👥 Dein Freund ist dabei!",
    body: "{name} hat sich mit deinem Link angemeldet. +10 Credits!",
    screen: "/referral",
  },
};

function interpolate(
  template: string,
  vars: Record<string, string | number> = {}
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

function prefsAllow(
  type: NotificationType,
  prefs: NotificationPreferences | null
): boolean {
  const merged = { ...DEFAULT_PREFS, ...(prefs ?? {}) };
  const key = PREF_KEY[type];
  return merged[key] !== false;
}

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<boolean> {
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: pushToken,
      sound: "default",
      title,
      body,
      data,
      badge: 1,
    }),
  });

  if (!res.ok) {
    console.error("[send-push-notification] Expo error:", await res.text());
    return false;
  }
  return true;
}

async function sendToUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  type: NotificationType,
  variables: Record<string, string | number> = {}
): Promise<{ sent: boolean; reason?: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("push_token, notification_preferences")
    .eq("id", userId)
    .single();

  if (!profile?.push_token) {
    return { sent: false, reason: "no_push_token" };
  }

  const prefs =
    profile.notification_preferences as NotificationPreferences | null;
  if (!prefsAllow(type, prefs)) {
    return { sent: false, reason: "preference_off" };
  }

  const tpl = TEMPLATES[type];
  const title = interpolate(tpl.title, variables);
  const body = interpolate(tpl.body, variables);

  const sent = await sendPushNotification(pushToken, title, body, {
    screen: tpl.screen,
    type,
    ...variables,
  });

  return { sent, reason: sent ? undefined : "expo_failed" };
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

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      userId,
      type,
      variables,
      pushToken,
      title,
      body: pushBody,
      data,
    } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Direct send (batch / internal)
    if (pushToken && title && pushBody) {
      const ok = await sendPushNotification(
        pushToken,
        title,
        pushBody,
        data ?? {}
      );
      return new Response(JSON.stringify({ sent: ok }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId || !type || !TEMPLATES[type as NotificationType]) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await sendToUser(
      supabase,
      userId,
      type as NotificationType,
      variables ?? {}
    );

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[send-push-notification]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

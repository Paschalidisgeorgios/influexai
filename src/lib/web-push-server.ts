import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type NotificationPreferences = {
  credits_warnings?: boolean;
  community_replies?: boolean;
  weekly_challenges?: boolean;
  reengagement?: boolean;
  new_features?: boolean;
  generation_complete?: boolean;
  daily_ideas?: boolean;
};

const DEFAULT_PREFS: NotificationPreferences = {
  credits_warnings: true,
  community_replies: true,
  weekly_challenges: true,
  reengagement: true,
  new_features: false,
  generation_complete: true,
  daily_ideas: true,
};

let vapidConfigured = false;

function configureVapid(): boolean {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() ?? "mailto:noreply@influexaicreator.com",
    publicKey,
    privateKey
  );
  vapidConfigured = true;
  return true;
}

function subscriptionFromRow(row: PushSubscriptionRow): webpush.PushSubscription {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

export async function sendPushToSubscription(
  row: PushSubscriptionRow,
  payload: PushPayload
): Promise<{ ok: boolean; statusCode?: number; gone?: boolean }> {
  if (!configureVapid()) {
    console.log("[web-push] VAPID keys not configured — skipped");
    return { ok: false };
  }

  try {
    await webpush.sendNotification(
      subscriptionFromRow(row),
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { statusCode?: number; body?: string };
    const statusCode = err.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, statusCode, gone: true };
    }
    console.error("[web-push] send failed:", statusCode, err.body ?? e);
    return { ok: false, statusCode };
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  options?: {
    supabase?: SupabaseClient;
    prefKey?: keyof NotificationPreferences;
  }
): Promise<{ sent: number; failed: number; reason?: string }> {
  if (!configureVapid()) {
    return { sent: 0, failed: 0, reason: "vapid_not_configured" };
  }

  const supabase = options?.supabase ?? createServiceSupabaseClient();

  if (options?.prefKey) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", userId)
      .maybeSingle();

    const prefs = {
      ...DEFAULT_PREFS,
      ...(profile?.notification_preferences as NotificationPreferences | null),
    };
    if (prefs[options.prefKey] === false) {
      return { sent: 0, failed: 0, reason: "preference_off" };
    }
  }

  const { data: rows, error } = await supabase
    .from("push_notifications")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    console.error("[web-push] load subscriptions:", error.message);
    return { sent: 0, failed: 0, reason: "db_error" };
  }

  if (!rows?.length) {
    return { sent: 0, failed: 0, reason: "no_subscription" };
  }

  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];

  for (const row of rows as PushSubscriptionRow[]) {
    const result = await sendPushToSubscription(row, payload);
    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      if (result.gone) staleIds.push(row.id);
    }
  }

  if (staleIds.length > 0) {
    await supabase.from("push_notifications").delete().in("id", staleIds);
  }

  return { sent, failed };
}

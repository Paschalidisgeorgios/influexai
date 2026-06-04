export type PushNotificationType =
  | "LOW_CREDITS"
  | "CREDITS_EMPTY"
  | "WIN_BACK_5_DAYS"
  | "WIN_BACK_BONUS"
  | "COMMUNITY_REPLY"
  | "WEEKLY_CHALLENGE"
  | "REFERRAL_JOINED";

export async function invokePushNotification(payload: {
  userId: string;
  type: PushNotificationType;
  variables?: Record<string, string | number>;
}): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;

  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/send-push-notification`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      console.error("send-push-notification:", await res.text());
    }
  } catch (e) {
    console.error("invokePushNotification failed:", e);
  }
}

export async function invokePushToMany(
  userIds: string[],
  type: PushNotificationType,
  variables?: Record<string, string | number>
): Promise<void> {
  await Promise.all(
    userIds.map((userId) => invokePushNotification({ userId, type, variables }))
  );
}

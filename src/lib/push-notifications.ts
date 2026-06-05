import { sendPushToUser } from "@/lib/web-push-server";

export type PushNotificationType =
  | "LOW_CREDITS"
  | "CREDITS_EMPTY"
  | "GENERATION_COMPLETE"
  | "DAILY_VIDEO_IDEA"
  | "LORA_READY"
  | "WIN_BACK_5_DAYS"
  | "WIN_BACK_BONUS"
  | "COMMUNITY_REPLY"
  | "COMMUNITY_LIKE"
  | "COMMUNITY_FOLLOW"
  | "WEEKLY_CHALLENGE"
  | "REFERRAL_JOINED";

type PrefKey =
  | "credits_warnings"
  | "community_replies"
  | "weekly_challenges"
  | "reengagement"
  | "generation_complete"
  | "daily_ideas";

const TEMPLATES: Record<
  PushNotificationType,
  {
    title: string;
    body: string;
    url: string;
    prefKey?: PrefKey;
  }
> = {
  LOW_CREDITS: {
    title: "⚡ Credits werden knapp",
    body: "Du hast nur noch {n} Credits. Jetzt aufladen.",
    url: "/dashboard/credits",
    prefKey: "credits_warnings",
  },
  CREDITS_EMPTY: {
    title: "🚨 Keine Credits mehr",
    body: "Lade jetzt auf, um weiter zu erstellen.",
    url: "/dashboard/credits",
    prefKey: "credits_warnings",
  },
  GENERATION_COMPLETE: {
    title: "✅ Generierung fertig",
    body: "{label} ist bereit — jetzt ansehen.",
    url: "{url}",
    prefKey: "generation_complete",
  },
  DAILY_VIDEO_IDEA: {
    title: "💡 Deine Video-Idee für heute",
    body: "{title}",
    url: "/dashboard/script-generator?topic={topic}",
    prefKey: "daily_ideas",
  },
  LORA_READY: {
    title: "🎨 LoRA Training fertig",
    body: "{name} ist einsatzbereit — jetzt Bilder generieren.",
    url: "/dashboard/lora-training",
    prefKey: "generation_complete",
  },
  WIN_BACK_5_DAYS: {
    title: "Dein KI Studio wartet 👀",
    body: "Du warst 5 Tage weg. Los geht's!",
    url: "/dashboard",
    prefKey: "reengagement",
  },
  WIN_BACK_BONUS: {
    title: "🎁 5 Bonus-Credits für dich",
    body: "Komm zurück und hol dir deine Credits.",
    url: "/dashboard",
    prefKey: "reengagement",
  },
  COMMUNITY_REPLY: {
    title: "💬 Neuer Kommentar",
    body: "{name} hat deine Creation kommentiert.",
    url: "/community",
    prefKey: "community_replies",
  },
  COMMUNITY_LIKE: {
    title: "❤️ Neues Like",
    body: "{name} hat deine Creation geliked.",
    url: "/community",
    prefKey: "community_replies",
  },
  COMMUNITY_FOLLOW: {
    title: "👤 Neuer Follower",
    body: "{name} folgt dir jetzt.",
    url: "/community",
    prefKey: "community_replies",
  },
  WEEKLY_CHALLENGE: {
    title: "🏆 Neue Weekly Challenge!",
    body: "{challengeTitle} — mach mit!",
    url: "/community",
    prefKey: "weekly_challenges",
  },
  REFERRAL_JOINED: {
    title: "👥 Dein Freund ist dabei!",
    body: "{name} hat sich mit deinem Link angemeldet. +10 Credits!",
    url: "/dashboard/referral",
    prefKey: "reengagement",
  },
};

function interpolate(
  template: string,
  vars: Record<string, string | number> = {}
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    String(vars[key] ?? "")
  );
}

export async function invokePushNotification(payload: {
  userId: string;
  type: PushNotificationType;
  variables?: Record<string, string | number>;
}): Promise<void> {
  const tpl = TEMPLATES[payload.type];
  const vars = payload.variables ?? {};

  try {
    await sendPushToUser(
      payload.userId,
      {
        title: interpolate(tpl.title, vars),
        body: interpolate(tpl.body, vars),
        url: interpolate(tpl.url, vars) || "/dashboard",
      },
      tpl.prefKey ? { prefKey: tpl.prefKey } : undefined
    );
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
    userIds.map((userId) =>
      invokePushNotification({ userId, type, variables })
    )
  );
}

/** Direct push with custom title/body (API route + internal use) */
export async function sendCustomPush(
  userId: string,
  title: string,
  body: string,
  url = "/dashboard"
): Promise<{ sent: number; failed: number; reason?: string }> {
  return sendPushToUser(userId, { title, body, url });
}

export function notifyGenerationCompletePush(
  userId: string,
  label: string,
  url: string
): void {
  void invokePushNotification({
    userId,
    type: "GENERATION_COMPLETE",
    variables: { label, url },
  });
}

/** Invoke welcome nurture email immediately after signup. */
export async function invokeWelcomeNurtureEmail(userId: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-nurture-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, emailType: "welcome" }),
    });
    if (!res.ok) {
      console.error("send-nurture-email welcome:", await res.text());
    }
  } catch (e) {
    console.error("send-nurture-email welcome invoke failed:", e);
  }
}

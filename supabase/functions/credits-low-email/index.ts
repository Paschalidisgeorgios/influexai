import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CREDITS_URL = "https://influexaicreator.com/dashboard/credits";
const FROM_EMAIL = "noreply@influexaicreator.com";

type Threshold = 10 | 3 | 0;

function getCrossedThreshold(
  previousCredits: number,
  remainingCredits: number
): Threshold | null {
  if (previousCredits > 0 && remainingCredits === 0) return 0;
  if (previousCredits > 3 && remainingCredits <= 3 && remainingCredits > 0)
    return 3;
  if (previousCredits > 10 && remainingCredits <= 10 && remainingCredits > 3)
    return 10;
  return null;
}

function firstName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "Creator";
  return fullName.trim().split(/\s+/)[0];
}

function emailContent(threshold: Threshold, name: string) {
  const templates: Record<
    Threshold,
    { subject: string; text: string; html: string }
  > = {
    10: {
      subject: "⚡ Du hast noch 10 Credits bei InfluexAI",
      text: `Hey ${name}, deine Credits werden knapp. Du hast noch 10 Credits übrig.
Lade jetzt auf und erstelle weiter virale Shorts.
Credits kaufen → ${CREDITS_URL}`,
      html: `<p>Hey ${name}, deine Credits werden knapp. Du hast noch <strong>10 Credits</strong> übrig.</p>
<p>Lade jetzt auf und erstelle weiter virale Shorts.</p>
<p><a href="${CREDITS_URL}" style="color:#B4FF00;font-weight:bold;">Credits kaufen</a></p>`,
    },
    3: {
      subject: "🚨 Nur noch 3 Credits – bald leer!",
      text: `Hey ${name}, du hast fast keine Credits mehr.
Nur noch 3 Credits. Lass dein Content-Flow nicht abreißen.
Jetzt aufladen → ${CREDITS_URL}`,
      html: `<p>Hey ${name}, du hast fast keine Credits mehr.</p>
<p>Nur noch <strong>3 Credits</strong>. Lass dein Content-Flow nicht abreißen.</p>
<p><a href="${CREDITS_URL}" style="color:#ef4444;font-weight:bold;">Jetzt aufladen</a></p>`,
    },
    0: {
      subject: "Credits aufgebraucht – InfluexAI pausiert",
      text: `Hey ${name}, deine Credits sind aufgebraucht.
Alle KI-Features sind pausiert bis du neue Credits kaufst.
Credits kaufen → ${CREDITS_URL}`,
      html: `<p>Hey ${name}, deine Credits sind aufgebraucht.</p>
<p>Alle KI-Features sind pausiert bis du neue Credits kaufst.</p>
<p><a href="${CREDITS_URL}" style="color:#B4FF00;font-weight:bold;">Credits kaufen</a></p>`,
    },
  };
  return templates[threshold];
}

async function sendResend(
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    // TODO: Set RESEND_API_KEY in Supabase Edge Function secrets to enable emails.
    console.log("[credits-low-email] RESEND_API_KEY not set — email skipped:", {
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
      text,
      html,
    }),
  });

  if (!res.ok) {
    console.error("[credits-low-email] Resend error:", await res.text());
    return false;
  }
  return true;
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

  try {
    const { userId, previousCredits, remainingCredits } = await req.json();

    if (
      !userId ||
      typeof previousCredits !== "number" ||
      typeof remainingCredits !== "number"
    ) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const threshold = getCrossedThreshold(previousCredits, remainingCredits);
    if (threshold === null) {
      return new Response(
        JSON.stringify({ sent: false, reason: "no_threshold" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: existing } = await supabase
      .from("credit_emails_sent")
      .select("id")
      .eq("user_id", userId)
      .eq("threshold", threshold)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ sent: false, reason: "already_sent" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    const email = profile?.email;
    if (!email) {
      return new Response(JSON.stringify({ sent: false, reason: "no_email" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const name = firstName(profile?.full_name);
    const { subject, text, html } = emailContent(threshold, name);
    const emailed = await sendResend(email, subject, text, html);

    if (emailed) {
      await supabase.from("credit_emails_sent").insert({
        user_id: userId,
        threshold,
      });
    }

    return new Response(
      JSON.stringify({ sent: emailed, threshold, logged: !emailed }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[credits-low-email]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

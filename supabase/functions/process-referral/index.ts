import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIGNUP_REFERRER = 10;
const PURCHASE_REFERRER = 20;

async function addCredits(
  supabase: ReturnType<typeof createClient>,
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
    const { referralId, event } = await req.json();

    if (!referralId) {
      return new Response(JSON.stringify({ error: "referralId required" }), {
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: referral } = await supabase
      .from("referrals")
      .select("*")
      .eq("id", referralId)
      .single();

    if (!referral) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
      });
    }

    if (event === "insert" || event === "signup") {
      if (!referral.credits_awarded_signup) {
        const ok = await addCredits(
          supabase,
          referral.referrer_id,
          SIGNUP_REFERRER,
          "Referral-Bonus (Freund angemeldet)"
        );
        if (ok) {
          await supabase
            .from("referrals")
            .update({
              credits_awarded_signup: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", referral.id);
        }
      }
    }

    if (event === "purchase") {
      if (referral.status !== "purchased") {
        await supabase
          .from("referrals")
          .update({
            status: "purchased",
            updated_at: new Date().toISOString(),
          })
          .eq("id", referral.id);
      }

      if (!referral.credits_awarded_purchase) {
        const ok = await addCredits(
          supabase,
          referral.referrer_id,
          PURCHASE_REFERRER,
          "Referral-Bonus (Freund hat gekauft)"
        );
        if (ok) {
          await supabase
            .from("referrals")
            .update({
              credits_awarded_purchase: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", referral.id);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[process-referral]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
    });
  }
});

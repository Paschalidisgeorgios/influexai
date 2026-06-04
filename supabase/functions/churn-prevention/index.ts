import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processChurnUser, runChurnPreventionCron } from "./lib.ts";
import type { ChurnProfile } from "./types.ts";

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

    if (body.userId && typeof body.userId === "string") {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, credits, nurture_unsubscribed, is_churned, last_active_at, created_at"
        )
        .eq("id", body.userId)
        .single();

      if (error || !profile) {
        return new Response(JSON.stringify({ error: "Profile not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await processChurnUser(
        supabase,
        profile as ChurnProfile
      );
      return new Response(JSON.stringify({ mode: "single", result }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = await runChurnPreventionCron(supabase);
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
    console.error("[churn-prevention]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processUser, runGrowthAgentCron } from "./lib.ts";
import type { ProfileRow } from "./types.ts";

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
          "id, email, full_name, creator_niche, niche, daily_suggestions_email, onboarding_completed, credits"
        )
        .eq("id", body.userId)
        .single();

      if (error || !profile) {
        return new Response(
          JSON.stringify({ error: "Profile not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await processUser(supabase, profile as ProfileRow);
      return new Response(JSON.stringify({ mode: "single", result }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = await runGrowthAgentCron(supabase);
    const okCount = results.filter((r) => r.ok).length;
    return new Response(
      JSON.stringify({
        mode: body.mode ?? "cron",
        processed: results.length,
        succeeded: okCount,
        results,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[growth-agent]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

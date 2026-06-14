import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { hashApiKey, isValidApiKeyFormat } from "@/lib/api-keys";
import { apiError } from "@/lib/api-v1/errors";
import {
  canUsePublicApi,
  getDailyRateLimitForPlan,
  startOfUtcDay,
  API_RATE_LIMIT_BUSINESS_PER_DAY,
  API_RATE_LIMIT_PRO_PER_DAY,
} from "@/lib/api-v1/rate-limits";
import type { AccessUser } from "@/lib/access";

export { API_RATE_LIMIT_PRO_PER_DAY, API_RATE_LIMIT_BUSINESS_PER_DAY };

export type ApiAuthContext = {
  userId: string;
  apiKeyId: string;
  plan: string;
  rateLimitPerDay: number;
};

export async function authenticateApiRequest(
  request: Request
): Promise<
  | { ok: true; ctx: ApiAuthContext }
  | { ok: false; response: ReturnType<typeof apiError> }
> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: apiError(401, "Invalid API key", "INVALID_KEY"),
    };
  }

  const token = auth.slice(7).trim();
  if (!isValidApiKeyFormat(token)) {
    return {
      ok: false,
      response: apiError(401, "Invalid API key", "INVALID_KEY"),
    };
  }

  const supabase = createServiceSupabaseClient();
  const keyHash = hashApiKey(token);

  const { data: keyRow, error } = await supabase
    .from("api_keys")
    .select("id, user_id, is_active")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (error || !keyRow || !keyRow.is_active) {
    return {
      ok: false,
      response: apiError(401, "Invalid API key", "INVALID_KEY"),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, role, is_admin")
    .eq("id", keyRow.user_id)
    .single();

  const accessUser: AccessUser = profile ?? { plan: "free", role: "user" };
  if (!canUsePublicApi(accessUser)) {
    return {
      ok: false,
        response: apiError(
        403,
        "Die Public API ist im Pro- und Business-Plan verfügbar.",
        "PLAN_REQUIRED",
        { required_plan: "pro" }
      ),
    };
  }

  const rateLimitPerDay = getDailyRateLimitForPlan(accessUser);
  const sinceDay = startOfUtcDay();

  const { count } = await supabase
    .from("api_logs")
    .select("id", { count: "exact", head: true })
    .eq("api_key_id", keyRow.id)
    .gte("created_at", sinceDay);

  if ((count ?? 0) >= rateLimitPerDay) {
    return {
      ok: false,
      response: apiError(429, "Rate limit exceeded", "RATE_LIMITED", {
        limit_per_day: rateLimitPerDay,
        retry_after: secondsUntilUtcMidnight(),
      }),
    };
  }

  const { data: current } = await supabase
    .from("api_keys")
    .select("request_count")
    .eq("id", keyRow.id)
    .single();

  await supabase
    .from("api_keys")
    .update({
      last_used_at: new Date().toISOString(),
      request_count: (current?.request_count ?? 0) + 1,
    })
    .eq("id", keyRow.id);

  return {
    ok: true,
    ctx: {
      userId: keyRow.user_id,
      apiKeyId: keyRow.id,
      plan: accessUser.plan ?? "free",
      rateLimitPerDay,
    },
  };
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(60, Math.ceil((midnight.getTime() - now.getTime()) / 1000));
}

export async function logApiRequest(params: {
  apiKeyId: string;
  userId: string;
  endpoint: string;
  creditsUsed: number;
  responseTimeMs: number;
  statusCode: number;
}) {
  const supabase = createServiceSupabaseClient();
  await supabase.from("api_logs").insert({
    api_key_id: params.apiKeyId,
    user_id: params.userId,
    endpoint: params.endpoint,
    credits_used: params.creditsUsed,
    response_time_ms: params.responseTimeMs,
    status_code: params.statusCode,
  });
}

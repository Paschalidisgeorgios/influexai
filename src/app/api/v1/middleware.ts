import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { hashApiKey, isValidApiKeyFormat } from "@/lib/api-keys";
import { apiError } from "@/lib/api-v1/errors";

export const API_RATE_LIMIT = 60;
export const API_RATE_WINDOW_SEC = 60;

export type ApiAuthContext = {
  userId: string;
  apiKeyId: string;
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

  const since = new Date(Date.now() - API_RATE_WINDOW_SEC * 1000).toISOString();
  const { count } = await supabase
    .from("api_logs")
    .select("id", { count: "exact", head: true })
    .eq("api_key_id", keyRow.id)
    .gte("created_at", since);

  if ((count ?? 0) >= API_RATE_LIMIT) {
    return {
      ok: false,
      response: apiError(429, "Rate limit exceeded", "RATE_LIMITED", {
        retry_after: API_RATE_WINDOW_SEC,
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
    ctx: { userId: keyRow.user_id, apiKeyId: keyRow.id },
  };
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

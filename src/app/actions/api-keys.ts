"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateApiKey, hashApiKey, maskApiKey } from "@/lib/api-keys";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { API_RATE_LIMIT } from "@/app/api/v1/middleware";

const MAX_KEYS = 3;

export type ApiKeyRow = {
  id: string;
  name: string;
  masked: string;
  created_at: string;
  last_used_at: string | null;
  request_count: number;
  is_active: boolean;
};

export type ApiUsageStats = {
  requestsThisMonth: number;
  creditsConsumedThisMonth: number;
  rateLimitPerMinute: number;
};

export async function listApiKeys(): Promise<
  { keys: ApiKeyRow[]; usage: ApiUsageStats } | { error: string }
> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt." };

  const { data: keys } = await supabase
    .from("api_keys")
    .select(
      "id, name, key_prefix, created_at, last_used_at, request_count, is_active"
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: logs } = await supabase
    .from("api_logs")
    .select("credits_used")
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString());

  const requestsThisMonth = logs?.length ?? 0;
  const creditsConsumedThisMonth = (logs ?? []).reduce(
    (s, r) => s + (r.credits_used ?? 0),
    0
  );

  return {
    keys: (keys ?? []).map((k) => ({
      id: k.id,
      name: k.name,
      masked: maskApiKey(k.key_prefix),
      created_at: k.created_at,
      last_used_at: k.last_used_at,
      request_count: k.request_count ?? 0,
      is_active: k.is_active,
    })),
    usage: {
      requestsThisMonth,
      creditsConsumedThisMonth,
      rateLimitPerMinute: API_RATE_LIMIT,
    },
  };
}

export async function createApiKey(
  name: string
): Promise<
  { success: true; key: string; id: string } | { success: false; error: string }
> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const service = createServiceSupabaseClient();
  const { count } = await service
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  if ((count ?? 0) >= MAX_KEYS) {
    return {
      success: false,
      error: `Maximal ${MAX_KEYS} aktive API-Keys erlaubt.`,
    };
  }

  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(-4);

  const { data, error } = await service
    .from("api_keys")
    .insert({
      user_id: user.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name: name.trim() || "API Key",
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Key konnte nicht erstellt werden.",
    };
  }

  return { success: true, key: rawKey, id: data.id };
}

export async function revokeApiKey(
  keyId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

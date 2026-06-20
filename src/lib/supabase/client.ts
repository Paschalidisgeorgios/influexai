import { createBrowserClient } from "@supabase/ssr";
import { warnSupabaseEnvMismatch } from "@/lib/supabase/env-guard";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  warnSupabaseEnvMismatch(url, anonKey);
  return createBrowserClient(url, anonKey);
}

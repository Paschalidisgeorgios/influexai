import "server-only";

/** Known production project ref from repo docs — server-only, never sent to client in full. */
const KNOWN_SHARED_PRODUCTION_REF = "hszjafdelcydnppyolkm";

function extractSupabaseProjectRef(url: string): string | null {
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

/** True when local dev runs against the documented shared/production Supabase project. */
export function shouldShowSharedDbDevWarning(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  const ref = extractSupabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  return ref === KNOWN_SHARED_PRODUCTION_REF;
}

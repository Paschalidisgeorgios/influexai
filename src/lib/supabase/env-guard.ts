/** Detect Supabase URL / anon-key project ref mismatch (auth fails silently as bad credentials). */
export function supabaseUrlRef(url: string): string | null {
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

export function supabaseAnonKeyRef(anonKey: string): string | null {
  if (!anonKey.startsWith("eyJ")) return null;
  try {
    const payloadPart = anonKey.split(".")[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized.length % 4 === 0
        ? normalized
        : normalized + "=".repeat(4 - (normalized.length % 4));
    const json = atob(padded);
    const payload = JSON.parse(json) as { ref?: string; project_id?: string };
    return payload.ref ?? payload.project_id ?? null;
  } catch {
    return null;
  }
}

export function warnSupabaseEnvMismatch(url: string, anonKey: string): void {
  const urlRef = supabaseUrlRef(url);
  const keyRef = supabaseAnonKeyRef(anonKey);
  if (urlRef && keyRef && urlRef !== keyRef) {
    console.error(
      `[supabase] NEXT_PUBLIC_SUPABASE_URL ref (${urlRef}) != anon key ref (${keyRef}). Login will fail until Preview env keys match the same project.`
    );
  }
}

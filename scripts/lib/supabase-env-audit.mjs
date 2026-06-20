/**
 * Supabase env/bundle audit helpers — refs only, never log keys/passwords.
 */
export const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
export const PROD_REF = "hszjafdelcydnppyolkm";

export function maskRef(supabaseUrl) {
  const match = (supabaseUrl ?? "").match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

export function supabaseJwtRef(jwt) {
  if (!jwt?.startsWith("eyJ")) return null;
  try {
    const payloadPart = jwt.split(".")[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized.length % 4 === 0
        ? normalized
        : normalized + "=".repeat(4 - (normalized.length % 4));
    const json = Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json);
    return payload.ref ?? payload.project_id ?? null;
  } catch {
    return null;
  }
}

export function extractSupabaseRefsFromText(text) {
  const urlRefs = new Set();
  for (const m of text.matchAll(/([a-z0-9]{20})\.supabase\.co/gi)) {
    urlRefs.add(m[1]);
  }

  const anonKeyRefs = new Set();
  for (const m of text.matchAll(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g)) {
    const ref = supabaseJwtRef(m[0]);
    if (ref) anonKeyRefs.add(ref);
  }

  return {
    url_refs: [...urlRefs],
    anon_jwt_refs: [...anonKeyRefs],
  };
}

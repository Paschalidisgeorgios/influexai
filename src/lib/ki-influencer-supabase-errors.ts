/** Shared Supabase/PostgREST error classification (client + server safe). */

export function isSupabaseRelationMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    const msg = String(error ?? "");
    return /relation .* does not exist/i.test(msg);
  }
  const record = error as { code?: string; message?: string };
  const msg = record.message ?? "";
  if (
    record.code === "PGRST204" ||
    record.code === "42501" ||
    record.code === "PGRST301"
  ) {
    return false;
  }
  return (
    record.code === "42P01" ||
    record.code === "PGRST205" ||
    /relation .* does not exist/i.test(msg) ||
    /Could not find the table/i.test(msg)
  );
}

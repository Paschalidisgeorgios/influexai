/**
 * POST /api/dashboard/revoke-contract
 *
 * Vertrags-Widerruf gemäß § 355 BGB.
 *
 * Ablauf:
 *  1. User verifizieren
 *  2. Widerruf-Timestamp in `profiles` speichern (contract_revoked_at)
 *  3. Bestätigungs-E-Mail via Supabase Edge Function auslösen
 */

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export async function POST() {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  // Widerruf-Zeitstempel in profiles schreiben
  // (Spalte contract_revoked_at timestamptz nullable — ggf. Migration ergänzen)
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ contract_revoked_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    console.warn("[revoke-contract] profiles update:", updateError.message);
    // Nicht fataler Fehler — E-Mail trotzdem versuchen
  }

  // Bestätigungs-E-Mail via Supabase Edge Function
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    await fetch(`${supabaseUrl}/functions/v1/contract-revocation-email`, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    }).catch((err) => {
      console.error("[revoke-contract] email function:", err);
    });
  }

  return Response.json({
    ok:      true,
    message: "Widerruf eingegangen. Bestätigungs-E-Mail wird versendet.",
  });
}

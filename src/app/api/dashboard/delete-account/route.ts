/**
 * DELETE /api/dashboard/delete-account
 *
 * Löscht den Account des eingeloggten Users vollständig (Art. 17 DSGVO).
 *
 * Ablauf:
 *  1. Session-Auth via anon-Client  → User-ID ermitteln
 *  2. Service-Role-Client           → auth.admin.deleteUser(id)
 *     (löscht Auth-Eintrag + alle verknüpften Tabellen-Rows via ON DELETE CASCADE)
 *  3. Session-Cookie aus der Response löschen
 *  4. 200 OK zurückgeben → Frontend leitet auf / um
 *
 * Nicht berührt:
 *  - Stripe-Zahlungsdaten (liegen bei Stripe, wir speichern nur customer_id —
 *    diese wird via ON DELETE CASCADE aus unserer DB entfernt, Stripe-Daten
 *    bleiben für steuerrechtliche Aufbewahrungspflichten bei Stripe erhalten)
 */

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  // ── 1. Session-Auth: User verifizieren ────────────────────────────────────
  const anonClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await anonClient.auth.getUser();

  if (authError || !user) {
    return Response.json(
      { error: "Nicht eingeloggt oder Session abgelaufen." },
      { status: 401 }
    );
  }

  const userId = user.id;

  // ── 2. Service-Role-Client: auth.admin.deleteUser() ───────────────────────
  // Löscht den Auth-User + alle Rows in verknüpften Tabellen (CASCADE):
  //   profiles, gallery_assets, generations, credit_transactions, ...
  let adminClient: ReturnType<typeof createServiceSupabaseClient>;
  try {
    adminClient = createServiceSupabaseClient();
  } catch {
    return Response.json(
      { error: "Server-Konfigurationsfehler." },
      { status: 503 }
    );
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error("[delete-account] auth.admin.deleteUser:", deleteError.message);
    return Response.json(
      { error: "Account konnte nicht gelöscht werden. Bitte kontaktiere den Support." },
      { status: 500 }
    );
  }

  // ── 3. Session-Cookies löschen ────────────────────────────────────────────
  // Der anon-Client kennt die Cookie-Namen — wir leeren sie explizit.
  // Supabase SSR setzt typischerweise sb-<project>-auth-token (+ refresh).
  // Wir nutzen sign-out (löscht lokale Session) + Header-Override.
  try {
    await anonClient.auth.signOut();
  } catch {
    // signOut schlägt fehl wenn der User schon gelöscht ist — erwartetes Verhalten
  }

  // ── 4. Response ───────────────────────────────────────────────────────────
  return Response.json(
    { ok: true, message: "Account wurde vollständig gelöscht." },
    {
      status: 200,
      headers: {
        // Supabase-SSR-Cookie löschen (Fallback für alle gängigen Cookie-Namen)
        "Set-Cookie": [
          `sb-access-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
          `sb-refresh-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
        ].join(", "),
      },
    }
  );
}

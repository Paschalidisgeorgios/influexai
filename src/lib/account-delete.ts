import "server-only";

import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";

export const ACCOUNT_DELETE_SUPPORT_EMAIL = "support@influexaicreator.com";

export type DeleteAccountResult =
  | { ok: true }
  | {
      ok: false;
      status: 401 | 403 | 409 | 500;
      code?: "AGENCY_OWNER" | "DELETE_FAILED" | "NOT_AUTHENTICATED";
      error: string;
    };

async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    if (sub.status === "canceled" || sub.status === "incomplete_expired") {
      return;
    }
    await stripe.subscriptions.cancel(subscriptionId);
    console.log("[account delete] Stripe subscription canceled", {
      subscriptionId,
    });
  } catch (e) {
    console.error("[account delete] Stripe cancel failed:", e);
    /* continue with account deletion */
  }
}

/**
 * Deletes the authenticated user's account and related data.
 * Blocks agency / white-label owners (tenant owner_id).
 */
export async function deleteUserAccount(userId: string): Promise<DeleteAccountResult> {
  const service = createServiceSupabaseClient();

  const { data: ownedTenant } = await service
    .from("tenants")
    .select("id, name")
    .eq("owner_id", userId)
    .maybeSingle();

  if (ownedTenant) {
    return {
      ok: false,
      status: 409,
      code: "AGENCY_OWNER",
      error: `Bitte kontaktiere den Support, um dein Agency-/White-Label-Konto zu löschen: ${ACCOUNT_DELETE_SUPPORT_EMAIL}`,
    };
  }

  const { data: profile } = await service
    .from("profiles")
    .select("stripe_subscription_id, stripe_customer_id, tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.stripe_subscription_id) {
    await cancelStripeSubscription(profile.stripe_subscription_id);
  }

  /* Explicit cleanup for tables without auth.users FK cascade (defensive). */
  const tablesWithUserId = [
    "api_keys",
    "agent_jobs",
    "agent_executions",
    "campaign_results",
    "generations",
    "credit_transactions",
    "saved_scripts",
    "niche_saves",
    "outlier_results",
    "remix_results",
    "thumbnail_concepts",
    "lora_models",
    "push_notifications",
    "email_logs",
    "dismissed_nudges",
    "user_activity_visits",
    "churn_prevention",
    "daily_suggestions",
  ] as const;

  for (const table of tablesWithUserId) {
    const { error } = await service.from(table).delete().eq("user_id", userId);
    if (error && error.code !== "42P01") {
      console.warn(`[account delete] ${table}:`, error.message);
    }
  }

  await service.from("referrals").delete().eq("referrer_id", userId);
  await service.from("referrals").delete().eq("referred_id", userId);

  if (profile?.tenant_id) {
    await service
      .from("profiles")
      .update({ tenant_id: null, tenant_role: null })
      .eq("id", userId);
  }

  const { error: deleteAuthError } = await service.auth.admin.deleteUser(userId);

  if (deleteAuthError) {
    console.error("[account delete] auth.admin.deleteUser:", deleteAuthError.message);
    return {
      ok: false,
      status: 500,
      code: "DELETE_FAILED",
      error: `Konto konnte nicht gelöscht werden. Bitte versuche es erneut oder kontaktiere ${ACCOUNT_DELETE_SUPPORT_EMAIL}.`,
    };
  }

  console.log("[account delete] user deleted", { userId });
  return { ok: true };
}

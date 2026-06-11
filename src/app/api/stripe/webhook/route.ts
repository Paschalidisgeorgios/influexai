import type Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { addCredits } from "@/lib/credits";
import { markReferralPurchased } from "@/app/actions/referral";
import { AGENCY_PLANS, type AgencyPlanId } from "@/lib/agency-plans";
import {
  SUBSCRIPTION_PLANS,
  normalizePlan,
} from "@/lib/subscription-plans";
import { creditsForStripePriceId } from "@/lib/stripe-credit-prices";
import { getStripe } from "@/lib/stripe";

type ClaimCheckoutSessionData = {
  checkout_type: string;
  user_id?: string | null;
  tenant_id?: string | null;
  credits_granted?: number | null;
};

type ClaimInvoiceData = {
  stripe_subscription_id?: string | null;
  user_id?: string | null;
  tenant_id?: string | null;
  credits_granted?: number | null;
};

async function claimCheckoutSession(
  supabaseAdmin: SupabaseClient,
  sessionId: string,
  data: ClaimCheckoutSessionData
): Promise<{ claimed: boolean }> {
  const { error } = await supabaseAdmin.from("processed_checkout_sessions").insert({
    stripe_session_id: sessionId,
    checkout_type: data.checkout_type,
    user_id: data.user_id ?? null,
    tenant_id: data.tenant_id ?? null,
    credits_granted: data.credits_granted ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      console.log("[webhook] checkout session bereits verarbeitet:", sessionId);
      return { claimed: false };
    }
    throw new Error(`claimCheckoutSession failed: ${error.message}`);
  }

  return { claimed: true };
}

async function claimInvoice(
  supabaseAdmin: SupabaseClient,
  invoiceId: string,
  data: ClaimInvoiceData
): Promise<{ claimed: boolean }> {
  const { error } = await supabaseAdmin.from("processed_stripe_invoices").insert({
    stripe_invoice_id: invoiceId,
    stripe_subscription_id: data.stripe_subscription_id ?? null,
    user_id: data.user_id ?? null,
    tenant_id: data.tenant_id ?? null,
    credits_granted: data.credits_granted ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      console.log("[webhook] invoice bereits verarbeitet:", invoiceId);
      return { claimed: false };
    }
    throw new Error(`claimInvoice failed: ${error.message}`);
  }

  return { claimed: true };
}

async function handleAgencySubscription(
  supabaseAdmin: SupabaseClient,
  session: Stripe.Checkout.Session
) {
  const meta = session.metadata ?? {};
  if (meta.checkout_type !== "agency_subscription") return;

  const ownerId = meta.owner_id;
  const slug = meta.agency_slug;
  const name = meta.agency_name;
  const plan = (meta.plan ?? "starter") as AgencyPlanId;
  const planConfig = AGENCY_PLANS[plan] ?? AGENCY_PLANS.starter;

  if (!ownerId) return;

  const { claimed } = await claimCheckoutSession(supabaseAdmin, session.id, {
    checkout_type: "agency_subscription",
    user_id: ownerId,
    credits_granted: planConfig.creditsPool,
  });
  if (!claimed) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription?.id ?? null);

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);

  await supabaseAdmin
    .from("profiles")
    .update({
      agency_plan: plan,
      agency_credits: planConfig.creditsPool,
    })
    .eq("id", ownerId);

  if (!slug || !name) return;

  const { data: existing } = await supabaseAdmin
    .from("tenants")
    .select("id")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("tenants")
      .update({
        plan,
        max_seats: planConfig.maxSeats,
        credits_pool: planConfig.creditsPool,
        is_active: true,
        deactivated_at: null,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
      })
      .eq("id", existing.id);
    return;
  }

  const { data: tenant, error } = await supabaseAdmin
    .from("tenants")
    .insert({
      name,
      slug,
      plan,
      max_seats: planConfig.maxSeats,
      owner_id: ownerId,
      is_active: true,
      deactivated_at: null,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      credits_pool: planConfig.creditsPool,
    })
    .select("id")
    .single();

  if (error || !tenant) {
    console.error("agency tenant create:", error?.message);
    return;
  }

  await supabaseAdmin
    .from("profiles")
    .update({
      tenant_id: tenant.id,
      tenant_role: "owner",
    })
    .eq("id", ownerId);
}

async function handlePlatformSubscription(
  supabaseAdmin: SupabaseClient,
  session: Stripe.Checkout.Session
) {
  const meta = session.metadata ?? {};
  if (meta.checkout_type !== "platform_subscription") return;

  const userId = meta.user_id;
  const rawPlan = meta.plan;
  if (
    !userId ||
    rawPlan !== "starter" &&
      rawPlan !== "creator" &&
      rawPlan !== "pro" &&
      rawPlan !== "business"
  ) {
    return;
  }
  const plan = rawPlan;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription?.id ?? null);

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);

  const monthlyCredits = SUBSCRIPTION_PLANS[plan].monthlyCredits;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const { claimed } = await claimCheckoutSession(supabaseAdmin, session.id, {
    checkout_type: "platform_subscription",
    user_id: userId,
    credits_granted: monthlyCredits,
  });
  if (!claimed) return;

  const { error: planError } = await supabaseAdmin
    .from("profiles")
    .update({
      plan,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
    })
    .eq("id", userId);

  if (planError) {
    throw new Error(
      `Platform subscription plan update failed: ${planError.message}`
    );
  }

  const result = await addCredits(
    supabaseAdmin,
    userId,
    monthlyCredits,
    `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — +${monthlyCredits} Credits`
  );

  if (!result.success) {
    throw new Error(result.error ?? "Platform subscription addCredits failed");
  }

  await markReferralPurchased(userId);
}

async function handleSubscriptionRenewal(
  supabaseAdmin: SupabaseClient,
  invoice: Stripe.Invoice
) {
  if (invoice.billing_reason !== "subscription_cycle") return;

  const subscriptionId =
    typeof (invoice as Stripe.Invoice & { subscription?: string | null })
      .subscription === "string"
      ? ((invoice as Stripe.Invoice & { subscription?: string | null })
          .subscription as string)
      : null;
  if (!subscriptionId) return;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, plan")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!profile) return;

  const plan = normalizePlan(profile.plan);
  if (plan === "free" || !SUBSCRIPTION_PLANS[plan]) return;

  const monthlyCredits = SUBSCRIPTION_PLANS[plan].monthlyCredits;

  const { claimed } = await claimInvoice(supabaseAdmin, invoice.id, {
    stripe_subscription_id: subscriptionId,
    user_id: profile.id,
    credits_granted: monthlyCredits,
  });
  if (!claimed) return;

  const result = await addCredits(
    supabaseAdmin,
    profile.id,
    monthlyCredits,
    `Plan-Verlängerung — +${monthlyCredits} Credits`
  );

  if (!result.success) {
    throw new Error(result.error ?? "Subscription renewal addCredits failed");
  }
}

async function handlePlatformSubscriptionChange(
  supabaseAdmin: SupabaseClient,
  sub: Stripe.Subscription
) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, plan")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();

  if (!profile) return;

  const active = sub.status === "active" || sub.status === "trialing";
  if (!active) {
    await supabaseAdmin
      .from("profiles")
      .update({ plan: "free" })
      .eq("id", profile.id);
    return;
  }

  const planFromMeta = normalizePlan(sub.metadata?.plan);
  if (planFromMeta !== "free" && SUBSCRIPTION_PLANS[planFromMeta]) {
    await supabaseAdmin
      .from("profiles")
      .update({ plan: planFromMeta })
      .eq("id", profile.id);
  }
}

async function handleAgencyCredits(
  supabaseAdmin: SupabaseClient,
  session: Stripe.Checkout.Session
) {
  const meta = session.metadata ?? {};
  if (meta.checkout_type !== "agency_credits") return;

  const tenantId = meta.tenant_id;
  const credits = parseInt(meta.credits_amount ?? "0", 10);
  if (!tenantId || credits <= 0) return;

  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("credits_pool")
    .eq("id", tenantId)
    .single();

  if (!tenant) return;

  const { claimed } = await claimCheckoutSession(supabaseAdmin, session.id, {
    checkout_type: "agency_credits",
    tenant_id: tenantId,
    credits_granted: credits,
  });
  if (!claimed) return;

  await supabaseAdmin
    .from("tenants")
    .update({ credits_pool: (tenant.credits_pool ?? 0) + credits })
    .eq("id", tenantId);
}

async function resolveCreditPurchaseAmount(
  session: Stripe.Checkout.Session
): Promise<number> {
  const fromMeta = parseInt(
    session.metadata?.credits_amount ?? session.metadata?.credits ?? "0",
    10
  );
  if (fromMeta > 0) return fromMeta;

  const metaPriceId = session.metadata?.stripe_price_id?.trim();
  if (metaPriceId) {
    const mapped = creditsForStripePriceId(metaPriceId);
    if (mapped > 0) return mapped;
  }

  if (session.mode !== "payment") return 0;

  try {
    const full = await getStripe().checkout.sessions.retrieve(session.id, {
      expand: ["line_items.data.price"],
    });
    const priceId = full.line_items?.data[0]?.price?.id ?? "";
    return creditsForStripePriceId(priceId);
  } catch (e) {
    console.error("webhook credit session retrieve:", e);
    return 0;
  }
}

async function handleCreditPackPurchase(
  supabaseAdmin: SupabaseClient,
  session: Stripe.Checkout.Session
) {
  const checkoutType = session.metadata?.checkout_type;
  if (
    checkoutType === "agency_subscription" ||
    checkoutType === "agency_credits" ||
    checkoutType === "platform_subscription"
  ) {
    return;
  }

  const userId =
    session.metadata?.user_id ?? session.metadata?.userId ?? null;
  if (!userId) return;

  const isCreditCheckout =
    session.metadata?.type === "credits" || session.mode === "payment";
  if (!isCreditCheckout) return;

  const credits = await resolveCreditPurchaseAmount(session);
  if (credits <= 0) return;

  const { claimed } = await claimCheckoutSession(supabaseAdmin, session.id, {
    checkout_type: "credit_pack",
    user_id: userId,
    credits_granted: credits,
  });
  if (!claimed) return;

  const result = await addCredits(
    supabaseAdmin,
    userId,
    credits,
    `${credits} Credits gekauft`
  );

  if (!result.success) {
    throw new Error(result.error ?? "Credit pack purchase addCredits failed");
  }

  await markReferralPurchased(userId);

  const amountCents = session.amount_total ?? 0;
  await supabaseAdmin.from("stripe_payments").upsert(
    {
      user_id: userId,
      amount_cents: amountCents,
      currency: session.currency ?? "eur",
      plan: session.metadata?.plan ?? "credits",
      credits_amount: credits,
      stripe_session_id: session.id,
    },
    { onConflict: "stripe_session_id" }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Keine Signatur" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Ungültige Signatur" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existing } = await supabaseAdmin
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existing) {
    console.log("[webhook] Event bereits verarbeitet:", event.id);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[stripe webhook]", {
        eventType: event.type,
        customerId:
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id,
        subscriptionId:
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id,
        plan: session.metadata?.plan ?? session.metadata?.checkout_type,
      });

      await handleAgencySubscription(supabaseAdmin, session);
      await handleAgencyCredits(supabaseAdmin, session);
      await handlePlatformSubscription(supabaseAdmin, session);
      await handleCreditPackPurchase(supabaseAdmin, session);
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      await handleSubscriptionRenewal(supabaseAdmin, invoice);
    }

    if (
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.updated"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const active = sub.status === "active" || sub.status === "trialing";

      await handlePlatformSubscriptionChange(supabaseAdmin, sub);

      const { data: tenant } = await supabaseAdmin
        .from("tenants")
        .select("id, owner_id")
        .eq("stripe_subscription_id", sub.id)
        .maybeSingle();

      if (tenant) {
        await supabaseAdmin
          .from("tenants")
          .update({
            is_active: active,
            deactivated_at: active ? null : new Date().toISOString(),
          })
          .eq("id", tenant.id);
      }
    }

    const { error: markError } = await supabaseAdmin
      .from("stripe_events")
      .insert({ id: event.id, type: event.type });

    if (markError) {
      if (markError.code === "23505") {
        console.log("[webhook] Event race duplicate:", event.id);
        return NextResponse.json({ received: true, duplicate: true });
      }
      throw new Error(`stripe_events insert failed: ${markError.message}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] processing failed:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

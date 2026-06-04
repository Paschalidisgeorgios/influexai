import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { logCreditTransaction } from "@/lib/activity-log";
import { markReferralPurchased } from "@/app/actions/referral";
import { AGENCY_PLANS, type AgencyPlanId } from "@/lib/agency-plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handleAgencySubscription(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  if (meta.checkout_type !== "agency_subscription") return;

  const ownerId = meta.owner_id;
  const slug = meta.agency_slug;
  const name = meta.agency_name;
  const plan = (meta.plan ?? "starter") as AgencyPlanId;
  const planConfig = AGENCY_PLANS[plan] ?? AGENCY_PLANS.starter;

  if (!ownerId || !slug || !name) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription?.id ?? null);

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
        is_active: true,
        deactivated_at: null,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id:
          typeof session.customer === "string"
            ? session.customer
            : (session.customer?.id ?? null),
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
      stripe_customer_id:
        typeof session.customer === "string"
          ? session.customer
          : (session.customer?.id ?? null),
      credits_pool: 50,
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

async function handleAgencyCredits(session: Stripe.Checkout.Session) {
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

  await supabaseAdmin
    .from("tenants")
    .update({ credits_pool: (tenant.credits_pool ?? 0) + credits })
    .eq("id", tenantId);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Keine Signatur" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Ungültige Signatur" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    await handleAgencySubscription(session);
    await handleAgencyCredits(session);

    const checkoutType = session.metadata?.checkout_type;
    if (
      checkoutType === "agency_subscription" ||
      checkoutType === "agency_credits"
    ) {
      return NextResponse.json({ received: true });
    }

    const userId =
      session.metadata?.user_id ?? session.metadata?.userId ?? null;
    const credits = parseInt(
      session.metadata?.credits_amount ?? session.metadata?.credits ?? "0",
      10
    );

    if (userId && credits > 0) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      if (profile) {
        await supabaseAdmin
          .from("profiles")
          .update({ credits: profile.credits + credits })
          .eq("id", userId);

        await logCreditTransaction(supabaseAdmin, userId, {
          amount: credits,
          description: `Credits gekauft (+${credits})`,
        });

        await markReferralPurchased(userId);

        const amountCents = session.amount_total ?? 0;
        await supabaseAdmin.from("stripe_payments").upsert(
          {
            user_id: userId,
            amount_cents: amountCents,
            currency: session.currency ?? "eur",
            plan: session.metadata?.plan ?? null,
            credits_amount: credits,
            stripe_session_id: session.id,
          },
          { onConflict: "stripe_session_id" }
        );
      }
    }
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    const active = sub.status === "active" || sub.status === "trialing";

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

  return NextResponse.json({ received: true });
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getStripePriceId,
  SUBSCRIPTION_PLANS,
  type BillingInterval,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://influexaicreator.com";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const priceIdFromBody = body.priceId as string | undefined;
  const plan = body.plan as Exclude<SubscriptionPlanId, "free"> | undefined;
  const interval = (body.interval ?? "monthly") as BillingInterval;

  const priceId =
    priceIdFromBody ??
    (plan ? getStripePriceId(plan, interval) : undefined);

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe Price ID fehlt. Bitte NEXT_PUBLIC_STRIPE_* in .env setzen." },
      { status: 503 }
    );
  }

  if (plan && !SUBSCRIPTION_PLANS[plan]) {
    return NextResponse.json({ error: "Ungültiger Plan" }, { status: 400 });
  }

  const resolvedPlan =
    plan ??
    (Object.keys(SUBSCRIPTION_PLANS) as Exclude<SubscriptionPlanId, "free">[]).find(
      (p) =>
        getStripePriceId(p, "monthly") === priceId ||
        getStripePriceId(p, "yearly") === priceId
    ) ??
    "starter";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${SITE_URL}/dashboard/credits?subscribed=${resolvedPlan}`,
    cancel_url: `${SITE_URL}/pricing?canceled=true`,
    customer_email: user.email ?? undefined,
    metadata: {
      user_id: user.id,
      plan: resolvedPlan,
      interval,
      checkout_type: "platform_subscription",
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan: resolvedPlan,
        interval,
        checkout_type: "platform_subscription",
      },
    },
  });

  return NextResponse.json({ url: session.url });
}

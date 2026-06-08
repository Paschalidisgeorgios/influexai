import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getStripePriceId,
  SUBSCRIPTION_PLANS,
  type BillingInterval,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://influexaicreator.com";

function trimPriceId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const plan = body.plan as Exclude<SubscriptionPlanId, "free"> | undefined;
  const interval = (body.interval ?? "monthly") as BillingInterval;

  if (plan && !SUBSCRIPTION_PLANS[plan]) {
    return NextResponse.json({ error: "Ungültiger Plan" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const priceIdFromBody = trimPriceId(body.priceId);
  const priceIdFromPlan = plan ? getStripePriceId(plan, interval) : undefined;
  const priceId = priceIdFromPlan ?? priceIdFromBody;

  const resolvedPlan =
    plan ??
    (Object.keys(SUBSCRIPTION_PLANS) as Exclude<SubscriptionPlanId, "free">[]).find(
      (p) =>
        getStripePriceId(p, "monthly") === priceId ||
        getStripePriceId(p, "yearly") === priceId
    ) ??
    "starter";

  console.log("[checkout] priceId:", priceId ?? "(missing)");
  console.log("[checkout] env vars:", {
    influexaiStarterMonthly:
      process.env.NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY,
    influexaiCreatorMonthly:
      process.env.NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_MONTHLY,
    influexaiProMonthly: process.env.NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_MONTHLY,
    influexaiBusinessMonthly:
      process.env.NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_MONTHLY,
    credits50: process.env.STRIPE_CREDITS_50,
    credits150: process.env.STRIPE_CREDITS_150,
  });

  if (!priceId) {
    console.error("[checkout]", {
      userId: user.id,
      plan: resolvedPlan,
      interval,
      priceIdExists: false,
    });
    return NextResponse.json(
      {
        error:
          "Dieser Plan ist aktuell nicht verfügbar. Bitte kontaktiere den Support.",
      },
      { status: 503 }
    );
  }

  console.log("[checkout]", {
    userId: user.id,
    plan: resolvedPlan,
    interval,
    priceIdExists: true,
  });

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${SITE_URL}/checkout/success?type=subscription&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/pricing?checkout=cancelled`,
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

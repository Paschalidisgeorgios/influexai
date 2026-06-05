import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AGENCY_PLANS, getAgencyStripePriceId, type AgencyPlanId } from "@/lib/agency-plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://influexaicreator.com";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const planId = body.plan as AgencyPlanId;
  const agencyName = String(body.agencyName ?? "").trim();
  const slug = String(body.slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  const plan = AGENCY_PLANS[planId];
  if (!plan) {
    return NextResponse.json({ error: "Ungültiger Plan" }, { status: 400 });
  }
  if (!agencyName || slug.length < 2) {
    return NextResponse.json(
      { error: "Agenturname und Subdomain (mind. 2 Zeichen) erforderlich." },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Bitte zuerst anmelden." },
      { status: 401 }
    );
  }

  const interval = (body.interval ?? "monthly") as "monthly" | "yearly";
  const priceId = getAgencyStripePriceId(planId, interval);
  const lineItems = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `InfluexAI White-Label — ${plan.name}`,
              description: `Bis zu ${plan.maxSeats} Client Seats · ${plan.creditsPool} Credits Pool`,
            },
            unit_amount: Math.round(plan.monthlyPriceEur * 100),
            recurring: { interval: "month" as const },
          },
          quantity: 1,
        },
      ];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${SITE_URL}/dashboard/agency?success=true`,
    cancel_url: `${SITE_URL}/agency?canceled=1`,
    metadata: {
      checkout_type: "agency_subscription",
      plan: planId,
      agency_name: agencyName,
      agency_slug: slug,
      owner_id: user.id,
    },
    subscription_data: {
      metadata: {
        checkout_type: "agency_subscription",
        plan: planId,
        agency_slug: slug,
        owner_id: user.id,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  AGENCY_PLANS,
  getAgencyStripePriceId,
  planFromStripePriceId,
  type AgencyPlanId,
  type BillingInterval,
} from "@/lib/agency-plans";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";


const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://influexaicreator.com";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const priceIdFromBody = body.priceId as string | undefined;
  const planId = body.plan as AgencyPlanId | undefined;
  const interval = (body.billingInterval ?? body.interval ?? "monthly") as BillingInterval;
  const agencyName = String(body.agencyName ?? "").trim();
  const slug = String(body.slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  let priceId = priceIdFromBody;
  let resolvedPlan = planId;

  if (!priceId && planId) {
    priceId = getAgencyStripePriceId(planId, interval);
  }
  if (!resolvedPlan && priceId) {
    resolvedPlan = planFromStripePriceId(priceId) ?? undefined;
  }

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe Price ID fehlt." },
      { status: 503 }
    );
  }

  if (!resolvedPlan || !AGENCY_PLANS[resolvedPlan]) {
    return NextResponse.json({ error: "Ungültiger Agency-Plan." }, { status: 400 });
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

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    allow_promotion_codes: true,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}/dashboard/agency?success=true`,
    cancel_url: `${SITE_URL}/agency?canceled=true`,
    customer_email: user.email ?? undefined,
    metadata: {
      checkout_type: "agency_subscription",
      plan: resolvedPlan,
      billing_interval: interval,
      agency_name: agencyName || "",
      agency_slug: slug || "",
      owner_id: user.id,
    },
    subscription_data: {
      metadata: {
        checkout_type: "agency_subscription",
        plan: resolvedPlan,
        billing_interval: interval,
        agency_slug: slug || "",
        owner_id: user.id,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}

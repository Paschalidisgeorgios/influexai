import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DEFAULT_CHECKOUT_PACKAGE,
  getPackageById,
} from "@/lib/credit-packages";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://influexaicreator.com";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const packageId = body.packageId ?? body.package ?? DEFAULT_CHECKOUT_PACKAGE;

  const pkg = getPackageById(packageId);
  if (!pkg) {
    return NextResponse.json({ error: "Ungültiges Paket" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_beta")
    .eq("id", user.id)
    .single();

  let discounts: { coupon: string }[] | undefined;
  if (profile?.is_beta) {
    const { getOrCreateBetaLifetimeCouponId } =
      await import("@/lib/beta-stripe");
    const couponId = await getOrCreateBetaLifetimeCouponId();
    if (couponId) discounts = [{ coupon: couponId }];
  } else {
    const { getOrCreateFirst20PromotionCodeId } =
      await import("@/lib/first-purchase-stripe");
    await getOrCreateFirst20PromotionCodeId();
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    allow_promotion_codes: true,
    ...(discounts ? { discounts } : {}),
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `${pkg.credits} InfluexAI Credits — ${pkg.label}`,
            description: pkg.equivalence,
          },
          unit_amount: pkg.priceCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    custom_text: {
      submit: {
        message: "Sicher bezahlen — Credits sofort verfügbar",
      },
    },
    success_url: `${SITE_URL}/dashboard/credits/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/dashboard/credits?canceled=true`,
    metadata: {
      user_id: user.id,
      userId: user.id,
      plan: pkg.plan,
      credits_amount: pkg.credits.toString(),
      credits: pkg.credits.toString(),
    },
  });

  return NextResponse.json({ url: session.url });
}

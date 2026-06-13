import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DEFAULT_CHECKOUT_PACKAGE,
  getPackageById,
  getStripePriceIdForPackage,
} from "@/lib/credit-packages";
import { createCreditsPaymentIntent } from "@/lib/create-credits-payment-intent";
import { assertPlatformPlanForCreditCheckout } from "@/lib/credit-checkout-guard.server";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const packageId =
    (body.packageId as string) ??
    (body.package as string) ??
    DEFAULT_CHECKOUT_PACKAGE;

  const pkg = getPackageById(packageId);
  if (!pkg) {
    return NextResponse.json({ error: "Ungültiges Paket" }, { status: 400 });
  }

  if (!getStripePriceIdForPackage(pkg)) {
    return NextResponse.json(
      { error: "Stripe Price ID nicht konfiguriert" },
      { status: 400 }
    );
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
    .select("plan, role, is_admin")
    .eq("id", user.id)
    .single();

  const planDenied = assertPlatformPlanForCreditCheckout(user, profile);
  if (planDenied) return planDenied;

  try {
    const paymentIntent = await createCreditsPaymentIntent(
      getStripe(),
      supabase,
      user.id,
      pkg
    );

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: "Payment Intent konnte nicht erstellt werden" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      packageId: pkg.id,
      credits: pkg.credits,
      amount: pkg.priceCents,
      currency: "eur",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment Intent fehlgeschlagen";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

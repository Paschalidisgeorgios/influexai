import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DEFAULT_CHECKOUT_PACKAGE,
  getPackageById,
} from "@/lib/credit-packages";
import { createCreditsCheckoutSession } from "@/lib/create-credits-checkout";
import { assertPlatformPlanForCreditCheckout } from "@/lib/credit-checkout-guard.server";
import {
  isWhitelistedCreditPriceId,
  packageForStripePriceId,
} from "@/lib/stripe-credit-prices";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Credit checkout — packageId (legacy) or priceId + mode payment. */
export async function POST(request: NextRequest) {
  const body = await request.json();
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

  const priceId = body.priceId?.trim();
  const mode = body.mode?.trim();

  if (priceId && mode === "payment") {
    if (!isWhitelistedCreditPriceId(priceId)) {
      return NextResponse.json({ error: "Ungültige Price ID" }, { status: 400 });
    }

    const pkg = packageForStripePriceId(priceId);
    if (!pkg) {
      return NextResponse.json({ error: "Paket nicht gefunden" }, { status: 400 });
    }

    try {
      const session = await createCreditsCheckoutSession(
        getStripe(),
        supabase,
        user.id,
        pkg
      );
      return NextResponse.json({ url: session.url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Checkout fehlgeschlagen";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  const packageId = body.packageId ?? body.package ?? DEFAULT_CHECKOUT_PACKAGE;
  const pkg = getPackageById(packageId);
  if (!pkg) {
    return NextResponse.json({ error: "Ungültiges Paket" }, { status: 400 });
  }

  try {
    const session = await createCreditsCheckoutSession(
      getStripe(),
      supabase,
      user.id,
      pkg
    );
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout fehlgeschlagen";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

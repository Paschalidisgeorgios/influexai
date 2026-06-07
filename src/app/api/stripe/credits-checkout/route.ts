import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createCreditsCheckoutSession } from "@/lib/create-credits-checkout";
import {
  isWhitelistedCreditPriceId,
  packageForStripePriceId,
} from "@/lib/stripe-credit-prices";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  let body: { priceId?: string };
  try {
    body = (await request.json()) as { priceId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const priceId = body.priceId?.trim();
  if (!priceId || !isWhitelistedCreditPriceId(priceId)) {
    return NextResponse.json({ error: "Ungültige Price ID" }, { status: 400 });
  }

  const pkg = packageForStripePriceId(priceId);
  if (!pkg) {
    return NextResponse.json({ error: "Paket nicht gefunden" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
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

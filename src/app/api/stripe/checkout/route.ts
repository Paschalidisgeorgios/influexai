import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DEFAULT_CHECKOUT_PACKAGE,
  getPackageById,
} from "@/lib/credit-packages";
import { createCreditsCheckoutSession } from "@/lib/create-credits-checkout";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Legacy path — delegates to pay-as-you-go credit checkout. */
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

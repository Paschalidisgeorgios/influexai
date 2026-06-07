import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CREDIT_PACKAGES,
  DEFAULT_CHECKOUT_PACKAGE,
  getPackageById,
  getStripePriceIdForPackage,
  type CreditPackage,
} from "@/lib/credit-packages";
import { createCreditsCheckoutSession } from "@/lib/create-credits-checkout";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function resolvePackage(
  body: Record<string, unknown>
): { pkg: CreditPackage } | { error: string } {
  if (typeof body.priceId === "string" && typeof body.credits === "number") {
    const pkg = CREDIT_PACKAGES.find(
      (p) =>
        getStripePriceIdForPackage(p) === body.priceId &&
        p.credits === body.credits
    );
    if (pkg) return { pkg };
    return { error: "Ungültiges Paket" };
  }

  const packageId =
    (body.packageId as string) ??
    (body.package as string) ??
    DEFAULT_CHECKOUT_PACKAGE;
  const pkg = getPackageById(packageId);
  if (!pkg) return { error: "Ungültiges Paket" };

  if (!getStripePriceIdForPackage(pkg)) {
    return { error: "Stripe Price ID nicht konfiguriert" };
  }

  return { pkg };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const resolved = resolvePackage(body);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
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
      resolved.pkg
    );
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout fehlgeschlagen";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

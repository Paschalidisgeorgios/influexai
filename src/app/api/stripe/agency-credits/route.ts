import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { AGENCY_CREDITS_PACKAGES } from "@/lib/agency-plans";
import { getStripe } from "@/lib/stripe";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://influexaicreator.com";

export async function POST(request: NextRequest) {
  const { packageId } = await request.json();
  const pkg = AGENCY_CREDITS_PACKAGES.find((p) => p.id === packageId);
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

  const service = createServiceSupabaseClient();
  const { data: tenant } = await service
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "Keine Agentur" }, { status: 403 });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: pkg.label,
            description: "Credits Pool für deine Kunden",
          },
          unit_amount: pkg.priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${SITE_URL}/dashboard/agency?credits=1`,
    cancel_url: `${SITE_URL}/dashboard/agency`,
    metadata: {
      checkout_type: "agency_credits",
      tenant_id: tenant.id,
      credits_amount: String(pkg.credits),
    },
  });

  return NextResponse.json({ url: session.url });
}

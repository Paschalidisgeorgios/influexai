import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

const PACKAGES: Record<string, { credits: number; price: number; name: string }> = {
  credits_100:  { credits: 100,  price: 900,  name: "100 InfluexAI Credits" },
  credits_500:  { credits: 500,  price: 3900, name: "500 InfluexAI Credits" },
  credits_2500: { credits: 2500, price: 9900, name: "2.500 InfluexAI Credits" },
};

export async function POST(request: NextRequest) {
  const { packageId } = await request.json();

  const pkg = PACKAGES[packageId];
  if (!pkg) {
    return NextResponse.json({ error: "Ungültiges Paket" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: pkg.name },
          unit_amount: pkg.price,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?success=true&credits=${pkg.credits}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/credits?canceled=true`,
    metadata: {
      userId: user.id,
      credits: pkg.credits.toString(),
    },
  });

  return NextResponse.json({ url: session.url });
}

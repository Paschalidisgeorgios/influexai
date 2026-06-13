import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const paymentIntentId = request.nextUrl.searchParams.get("payment_intent_id");
  if (!paymentIntentId) {
    return NextResponse.json(
      { error: "payment_intent_id fehlt" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paymentIntent =
    await getStripe().paymentIntents.retrieve(paymentIntentId);

  const metaUser =
    paymentIntent.metadata?.user_id ?? paymentIntent.metadata?.userId ?? null;

  if (metaUser !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const creditsAdded = parseInt(
    paymentIntent.metadata?.credits_amount ??
      paymentIntent.metadata?.credits ??
      "0",
    10
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    status: paymentIntent.status,
    creditsAdded,
    balance: profile?.credits ?? 0,
    paid: paymentIntent.status === "succeeded",
  });
}

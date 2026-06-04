import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id fehlt" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const metaUser =
    session.metadata?.user_id ?? session.metadata?.userId ?? null;

  if (metaUser !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const creditsAdded = parseInt(
    session.metadata?.credits_amount ?? session.metadata?.credits ?? "0",
    10
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    creditsAdded,
    balance: profile?.credits ?? 0,
    paymentStatus: session.payment_status,
  });
}

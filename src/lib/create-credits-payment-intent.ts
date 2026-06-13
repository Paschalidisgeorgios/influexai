import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getStripePriceIdForPackage,
  type CreditPackage,
} from "@/lib/credit-packages";

export async function createCreditsPaymentIntent(
  stripe: Stripe,
  supabase: SupabaseClient,
  userId: string,
  pkg: CreditPackage
): Promise<Stripe.PaymentIntent> {
  const priceId = getStripePriceIdForPackage(pkg);
  if (!priceId) {
    throw new Error("Stripe Price ID nicht konfiguriert");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_beta")
    .eq("id", userId)
    .single();

  return stripe.paymentIntents.create({
    amount: pkg.priceCents,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId,
      user_id: userId,
      type: "credits",
      credits: pkg.credits.toString(),
      credits_amount: pkg.credits.toString(),
      packId: pkg.id,
      plan: pkg.id,
      stripe_price_id: priceId,
      is_beta: profile?.is_beta ? "true" : "false",
    },
  });
}

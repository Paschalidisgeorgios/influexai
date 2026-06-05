import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getStripePriceIdForPackage,
  type CreditPackage,
} from "@/lib/credit-packages";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://influexaicreator.com";

export async function createCreditsCheckoutSession(
  stripe: Stripe,
  supabase: SupabaseClient,
  userId: string,
  pkg: CreditPackage
): Promise<Stripe.Checkout.Session> {
  const priceId = getStripePriceIdForPackage(pkg);
  if (!priceId) {
    throw new Error("Stripe Price ID nicht konfiguriert");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_beta")
    .eq("id", userId)
    .single();

  const { data: purchaseRow } = await supabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .like("description", "%Credits gekauft%")
    .limit(1)
    .maybeSingle();

  const hasPurchased = !!purchaseRow;

  let discounts: { coupon: string }[] | undefined;
  if (profile?.is_beta) {
    const {
      getOrCreateBetaFirstPurchaseCouponId,
      getOrCreateBetaLifetimeCouponId,
    } = await import("@/lib/beta-stripe");
    const couponId = hasPurchased
      ? await getOrCreateBetaLifetimeCouponId()
      : await getOrCreateBetaFirstPurchaseCouponId();
    if (couponId) discounts = [{ coupon: couponId }];
  } else {
    const { getOrCreateFirst20PromotionCodeId } =
      await import("@/lib/first-purchase-stripe");
    await getOrCreateFirst20PromotionCodeId();
  }

  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    allow_promotion_codes: true,
    ...(discounts ? { discounts } : {}),
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "payment",
    custom_text: {
      submit: {
        message: "Sicher bezahlen — Credits sofort verfügbar",
      },
    },
    success_url: `${SITE_URL}/dashboard?credits=success&session_id={CHECKOUT_SESSION_ID}&amount=${pkg.credits}`,
    cancel_url: `${SITE_URL}/dashboard?credits=canceled`,
    metadata: {
      userId,
      user_id: userId,
      credits: pkg.credits.toString(),
      credits_amount: pkg.credits.toString(),
      plan: pkg.id,
    },
  });
}

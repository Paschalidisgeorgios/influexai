let cachedFirst20PromoId: string | null = null;

/** 20% off first purchase — promo code FIRST20, once per Stripe customer. */
export async function getOrCreateFirst20PromotionCodeId(): Promise<
  string | null
> {
  if (process.env.STRIPE_FIRST20_PROMO_ID) {
    return process.env.STRIPE_FIRST20_PROMO_ID;
  }
  if (cachedFirst20PromoId) return cachedFirst20PromoId;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  const listRes = await fetch(
    "https://api.stripe.com/v1/promotion_codes?code=FIRST20&active=true&limit=1",
    { headers: { Authorization: `Bearer ${key}` } }
  );
  const listData = (await listRes.json()) as {
    data?: { id: string }[];
  };
  if (listData.data?.[0]?.id) {
    cachedFirst20PromoId = listData.data[0].id;
    return cachedFirst20PromoId;
  }

  const couponBody = new URLSearchParams({
    percent_off: "20",
    duration: "once",
    name: "InfluexAI FIRST20 — 20% Erstkauf",
  });

  const couponRes = await fetch("https://api.stripe.com/v1/coupons", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: couponBody.toString(),
  });
  const coupon = (await couponRes.json()) as { id?: string };
  if (!coupon.id) return null;

  const promoBody = new URLSearchParams({
    coupon: coupon.id,
    code: "FIRST20",
    "restrictions[first_time_transaction]": "true",
  });

  const promoRes = await fetch("https://api.stripe.com/v1/promotion_codes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: promoBody.toString(),
  });
  const promo = (await promoRes.json()) as { id?: string };
  if (promo.id) {
    cachedFirst20PromoId = promo.id;
    return promo.id;
  }
  return null;
}

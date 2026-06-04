let cachedBetaCouponId: string | null = null;

/** 30% off forever — shared coupon for all beta users at checkout. */
export async function getOrCreateBetaLifetimeCouponId(): Promise<
  string | null
> {
  if (process.env.STRIPE_BETA_COUPON_ID) {
    return process.env.STRIPE_BETA_COUPON_ID;
  }
  if (cachedBetaCouponId) return cachedBetaCouponId;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  const listRes = await fetch("https://api.stripe.com/v1/coupons?limit=100", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const listData = (await listRes.json()) as {
    data?: { id: string; name?: string }[];
  };
  const existing = listData.data?.find(
    (c) => c.name === "InfluexAI Beta 30% Lifetime"
  );
  if (existing) {
    cachedBetaCouponId = existing.id;
    return existing.id;
  }

  const body = new URLSearchParams({
    percent_off: "30",
    duration: "forever",
    name: "InfluexAI Beta 30% Lifetime",
  });

  const res = await fetch("https://api.stripe.com/v1/coupons", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await res.json()) as { id?: string };
  if (data.id) {
    cachedBetaCouponId = data.id;
    return data.id;
  }
  return null;
}

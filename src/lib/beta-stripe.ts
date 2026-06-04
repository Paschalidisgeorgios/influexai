let cachedBetaFirstCouponId: string | null = null;
let cachedBetaLifetimeCouponId: string | null = null;

/** 50% off first credit purchase for beta users. */
export async function getOrCreateBetaFirstPurchaseCouponId(): Promise<
  string | null
> {
  if (process.env.STRIPE_BETA_FIRST_COUPON_ID) {
    return process.env.STRIPE_BETA_FIRST_COUPON_ID;
  }
  if (cachedBetaFirstCouponId) return cachedBetaFirstCouponId;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  const listRes = await fetch("https://api.stripe.com/v1/coupons?limit=100", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const listData = (await listRes.json()) as {
    data?: { id: string; name?: string }[];
  };
  const existing = listData.data?.find(
    (c) => c.name === "InfluexAI Beta 50% First Purchase"
  );
  if (existing) {
    cachedBetaFirstCouponId = existing.id;
    return existing.id;
  }

  const body = new URLSearchParams({
    percent_off: "50",
    duration: "once",
    name: "InfluexAI Beta 50% First Purchase",
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
    cachedBetaFirstCouponId = data.id;
    return data.id;
  }
  return null;
}

/** 20% off forever on all further purchases for beta users. */
export async function getOrCreateBetaLifetimeCouponId(): Promise<
  string | null
> {
  if (process.env.STRIPE_BETA_COUPON_ID) {
    return process.env.STRIPE_BETA_COUPON_ID;
  }
  if (cachedBetaLifetimeCouponId) return cachedBetaLifetimeCouponId;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  const listRes = await fetch("https://api.stripe.com/v1/coupons?limit=100", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const listData = (await listRes.json()) as {
    data?: { id: string; name?: string }[];
  };
  const existing = listData.data?.find(
    (c) =>
      c.name === "InfluexAI Beta 20% Lifetime" ||
      c.name === "InfluexAI Beta 30% Lifetime"
  );
  if (existing) {
    cachedBetaLifetimeCouponId = existing.id;
    return existing.id;
  }

  const body = new URLSearchParams({
    percent_off: "20",
    duration: "forever",
    name: "InfluexAI Beta 20% Lifetime",
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
    cachedBetaLifetimeCouponId = data.id;
    return data.id;
  }
  return null;
}

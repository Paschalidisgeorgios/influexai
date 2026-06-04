import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

const CODE = "PRODUCTHUNT";

async function stripePost(
  path: string,
  params: Record<string, string>
): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { ok: false, error: "STRIPE_SECRET_KEY fehlt." };

  const body = new URLSearchParams(params);
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = data.error as { message?: string } | undefined;
    return { ok: false, error: err?.message ?? "Stripe API Fehler" };
  }
  return { ok: true, data };
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.error },
      { status: admin.error === "Nicht eingeloggt." ? 401 : 403 }
    );
  }

  const redeemBy = String(
    Math.floor((Date.now() + 48 * 60 * 60 * 1000) / 1000)
  );

  const couponRes = await stripePost("coupons", {
    percent_off: "20",
    duration: "once",
    max_redemptions: "500",
    redeem_by: redeemBy,
    name: "ProductHunt Launch 20%",
  });

  if (!couponRes.ok || !couponRes.data?.id) {
    return NextResponse.json(
      { error: couponRes.error ?? "Coupon konnte nicht erstellt werden." },
      { status: 500 }
    );
  }

  const couponId = String(couponRes.data.id);

  let promoRes = await stripePost("promotion_codes", {
    coupon: couponId,
    code: CODE,
    max_redemptions: "500",
  });

  if (!promoRes.ok) {
    const listRes = await fetch(
      `https://api.stripe.com/v1/promotion_codes?code=${CODE}&limit=1`,
      {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      }
    );
    const listData = (await listRes.json()) as {
      data?: { id: string }[];
    };
    if (listData.data?.[0]) {
      promoRes = {
        ok: true,
        data: listData.data[0] as Record<string, unknown>,
      };
    } else {
      return NextResponse.json(
        { error: promoRes.error ?? "Promotion Code Fehler." },
        { status: 500 }
      );
    }
  }

  const expiresAt = new Date(parseInt(redeemBy, 10) * 1000).toISOString();

  return NextResponse.json({
    ok: true,
    code: CODE,
    couponId,
    promotionCodeId: String(promoRes.data?.id ?? ""),
    percentOff: 20,
    expiresAt,
    dashboardUrl: "https://dashboard.stripe.com/coupons",
    message: `Code aktiv: ${CODE} — 20% auf ersten Kauf — läuft ab in 48h`,
  });
}

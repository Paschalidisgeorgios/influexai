/**
 * Stripe webhook test fixtures for G.10-K smoke (test mode only).
 */
import Stripe from "stripe";

export function buildCheckoutSessionCompletedEvent(options) {
  const {
    eventId,
    sessionId,
    userId,
    credits = 25,
    priceId = "price_test_g10k",
    checkoutType = "credit_pack",
    plan = "starter",
    livemode = false,
  } = options;

  const metadata =
    checkoutType === "platform_subscription"
      ? {
          user_id: userId,
          plan,
          interval: "monthly",
          checkout_type: "platform_subscription",
        }
      : {
          user_id: userId,
          userId,
          type: "credits",
          credits: String(credits),
          credits_amount: String(credits),
          stripe_price_id: priceId,
        };

  const session = {
    id: sessionId,
    object: "checkout.session",
    mode: checkoutType === "platform_subscription" ? "subscription" : "payment",
    metadata,
    amount_total: 500,
    currency: "eur",
    customer: "cus_test_g10k",
    subscription:
      checkoutType === "platform_subscription" ? "sub_test_g10k" : null,
  };

  return {
    id: eventId,
    object: "event",
    api_version: "2024-06-20",
    created: Math.floor(Date.now() / 1000),
    livemode,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: "checkout.session.completed",
    data: { object: session },
  };
}

export function signStripeWebhookPayload(payload, secret) {
  return Stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
  });
}

export async function postSignedWebhook(baseUrl, route, payload, secret) {
  const body = JSON.stringify(payload);
  const signature = signStripeWebhookPayload(body, secret);
  const res = await fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": signature,
    },
    body,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, json, bodyPreview: text.slice(0, 500) };
}

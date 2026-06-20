import { describe, expect, it } from "vitest";
import {
  buildCheckoutSessionCompletedEvent,
  signStripeWebhookPayload,
} from "../../../scripts/lib/stripe-webhook-fixture.mjs";

describe("stripe webhook fixtures", () => {
  it("builds credit pack checkout.session.completed with user metadata", () => {
    const event = buildCheckoutSessionCompletedEvent({
      eventId: "evt_test_1",
      sessionId: "cs_test_1",
      userId: "user-uuid",
      credits: 25,
      priceId: "price_test_abc",
    });
    expect(event.type).toBe("checkout.session.completed");
    expect(event.livemode).toBe(false);
    expect(event.data.object.metadata.user_id).toBe("user-uuid");
    expect(event.data.object.metadata.credits_amount).toBe("25");
  });

  it("builds platform subscription metadata", () => {
    const event = buildCheckoutSessionCompletedEvent({
      eventId: "evt_test_2",
      sessionId: "cs_test_2",
      userId: "user-uuid",
      checkoutType: "platform_subscription",
      plan: "starter",
    });
    expect(event.data.object.mode).toBe("subscription");
    expect(event.data.object.metadata.checkout_type).toBe(
      "platform_subscription"
    );
    expect(event.data.object.metadata.plan).toBe("starter");
  });

  it("signs payload for webhook verification", () => {
    const payload = JSON.stringify({ id: "evt_test" });
    const sig = signStripeWebhookPayload(payload, "whsec_test_secret");
    expect(sig).toMatch(/t=\d+,v1=/);
  });
});

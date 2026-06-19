import Stripe from "stripe";
import {
  assertStripeCheckoutRuntimeAllowed,
  StripeRuntimeConfigError,
} from "@/lib/stripe-runtime-mode.server";

export function getStripe(): Stripe {
  assertStripeCheckoutRuntimeAllowed("stripe_client");
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new StripeRuntimeConfigError(
      "Stripe ist nicht konfiguriert (STRIPE_SECRET_KEY fehlt)."
    );
  }
  return new Stripe(key);
}

"use client";

import { useState } from "react";
import {
  SUBSCRIPTION_PLAN_ORDER,
  SUBSCRIPTION_PLANS,
  YEARLY_DISCOUNT_PERCENT,
  formatPlanPrice,
  type BillingInterval,
} from "@/lib/subscription-plans";
import {
  SUBSCRIPTION_PLAN_FEATURES,
  getPlanCreditsLabel,
  getPlanDeltaLabel,
} from "@/lib/subscription-plan-features";
import { LANDING_V2_PRICING_COPY } from "@/lib/landing-v2-pricing-copy";
import { useSubscriptionCheckout } from "@/hooks/useSubscriptionCheckout";

const copy = LANDING_V2_PRICING_COPY;
const FEATURE_PREVIEW_COUNT = 3;

function formatEuro(amount: number) {
  return formatPlanPrice(amount, "de");
}

type LandingV2PricingPlansProps = {
  checkoutRedirect?: string;
};

export function LandingV2PricingPlans({
  checkoutRedirect = "/design/pricing-preview",
}: LandingV2PricingPlansProps) {
  const [yearly, setYearly] = useState(false);
  const interval: BillingInterval = yearly ? "yearly" : "monthly";
  const { loading, handleSubscribe } = useSubscriptionCheckout(checkoutRedirect);

  return (
    <div className="landing-v2-pricing-plans">
      <div className="flex justify-center">
        <div className="landing-v2-pricing-toggle" role="group" aria-label="Abrechnungsintervall">
        <button
          type="button"
          className={`landing-v2-pricing-toggle__btn ${
            !yearly ? "landing-v2-pricing-toggle__btn--active" : ""
          }`}
          onClick={() => setYearly(false)}
        >
          {copy.billing.monthly}
        </button>
        <button
          type="button"
          className={`landing-v2-pricing-toggle__btn ${
            yearly ? "landing-v2-pricing-toggle__btn--active" : ""
          }`}
          onClick={() => setYearly(true)}
        >
          {copy.billing.yearly}
          <span className="landing-v2-pricing-toggle__badge">
            {copy.billing.yearlyDiscountLabel}
          </span>
        </button>
        </div>
      </div>

      <div className="landing-v2-pricing-grid">
        {SUBSCRIPTION_PLAN_ORDER.map((planKey) => {
          const config = SUBSCRIPTION_PLANS[planKey];
          const price =
            interval === "yearly"
              ? config.yearlyPricePerMonthEur
              : config.monthlyPriceEur;
          const isFeatured = config.popular === true;
          const features = SUBSCRIPTION_PLAN_FEATURES[planKey]
            .filter((f) => f.included)
            .slice(0, FEATURE_PREVIEW_COUNT);
          const loadingKey = `${planKey}-${interval}`;
          const isLoading = loading === loadingKey;
          const yearlyTotal = formatEuro(price * 12);

          return (
            <article
              key={planKey}
              className={`landing-v2-pricing-plan landing-v2-ivory-stage ${
                isFeatured ? "landing-v2-pricing-plan--featured" : ""
              }`}
            >
              {isFeatured ? (
                <span className="landing-v2-pricing-plan__badge">{copy.plans.recommended}</span>
              ) : null}

              <h3 className="landing-v2-pricing-plan__name">{copy.plans.names[planKey]}</h3>

              <div className="landing-v2-pricing-plan__price-row">
                <span className="landing-v2-pricing-plan__price">
                  <span className="landing-v2-pricing-plan__currency" aria-hidden>
                    €
                  </span>
                  {formatEuro(price)}
                </span>
                <span className="landing-v2-pricing-plan__period">{copy.billing.perMonth}</span>
              </div>

              <p className="landing-v2-pricing-plan__billing-note">
                {!yearly
                  ? copy.billing.cancelAnytime
                  : `${copy.billing.billedYearly} (€${yearlyTotal}/Jahr)`}
              </p>

              <p className="landing-v2-pricing-plan__credits">{getPlanCreditsLabel(planKey)}</p>
              <p className="landing-v2-pricing-plan__desc">{copy.plans.descriptions[planKey]}</p>
              <p className="landing-v2-pricing-plan__delta">{getPlanDeltaLabel(planKey)}</p>

              <button
                type="button"
                className={
                  isFeatured
                    ? "landing-v2-btn-primary landing-v2-pricing-plan__cta w-full"
                    : "landing-v2-btn-secondary landing-v2-pricing-plan__cta landing-v2-pricing-plan__cta--dark w-full"
                }
                disabled={loading !== null}
                onClick={() => void handleSubscribe(planKey, interval)}
              >
                {isLoading ? "…" : copy.plans.cta}
              </button>

              <ul className="landing-v2-pricing-plan__features">
                {features.map((feature) => (
                  <li key={feature.text}>{feature.text}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <p className="landing-v2-pricing-plans__footnote">
        {copy.credits.footnote}
        {yearly ? ` · Jährlich −${YEARLY_DISCOUNT_PERCENT}% auf Creator, Pro und Business.` : null}
      </p>
    </div>
  );
}

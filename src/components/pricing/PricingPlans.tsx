"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
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

const PLAN_MOBILE_ORDER: Record<
  (typeof SUBSCRIPTION_PLAN_ORDER)[number],
  string
> = {
  creator: "order-1",
  starter: "order-2",
  pro: "order-3",
  business: "order-4",
};

function EuroPrice({ amount }: { amount: number }) {
  return (
    <span className="whitespace-nowrap">
      <span
        aria-hidden
        className="pricing-glass-price-euro"
        style={{
          fontSize: "40%",
          verticalAlign: "super",
          marginRight: "2px",
        }}
      >
        {"\u20AC"}
      </span>
      <span>{formatPlanPrice(amount)}</span>
    </span>
  );
}

type PricingPlansProps = {
  checkoutMode?: boolean;
  onSubscribe?: (plan: string, interval: BillingInterval) => void;
  subscribeLoading?: string | null;
  className?: string;
  primaryCtaLabel?: ReactNode;
};

export function PricingPlans({
  checkoutMode = false,
  onSubscribe,
  subscribeLoading = null,
  className,
  primaryCtaLabel,
}: PricingPlansProps) {
  const t = useTranslations("landingPage.pricing");
  const locale = useLocale();
  const [yearly, setYearly] = useState(false);
  const interval: BillingInterval = yearly ? "yearly" : "monthly";

  const planContent = (key: (typeof SUBSCRIPTION_PLAN_ORDER)[number]) => {
    const config = SUBSCRIPTION_PLANS[key];
    const price =
      interval === "yearly"
        ? config.yearlyPricePerMonthEur
        : config.monthlyPriceEur;

    return {
      key,
      hot: config.popular ?? false,
      price,
      name: t(`${key}_name`),
      credits: getPlanCreditsLabel(key),
      desc: t(`${key}_desc`),
      delta: getPlanDeltaLabel(key),
      cta: t(`${key}_cta`),
      features: SUBSCRIPTION_PLAN_FEATURES[key],
    };
  };

  const plans = SUBSCRIPTION_PLAN_ORDER.map(planContent);

  const handleCta = (planKey: (typeof SUBSCRIPTION_PLAN_ORDER)[number]) => {
    if (checkoutMode && onSubscribe) {
      onSubscribe(planKey, interval);
    }
  };

  return (
    <div className={className}>
      <div className="pricing-glass-toggle mx-auto mt-5 mb-9">
        {(
          [
            { label: t("monthly"), isY: false },
            { label: t("yearly"), isY: true },
          ] as const
        ).map(({ label, isY }) => {
          const active = yearly === isY;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setYearly(isY)}
              className={`pricing-glass-toggle__btn ${
                active ? "pricing-glass-toggle__btn--active" : "pricing-glass-toggle__btn--idle"
              }`}
            >
              {label}
              {isY && (
                <span className="pricing-glass-toggle__badge">
                  {t("yearly_discount", { percent: YEARLY_DISCOUNT_PERCENT })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="pricing-plans-scroll">
        <div className="pricing-plans-grid text-left">
          {plans.map((plan, planIndex) => {
            const loading = subscribeLoading === `${plan.key}-${interval}`;
            const staggerDelays = [0, 0.15, 0.3, 0.45];
            const ctaContent = (
              <>
                {loading
                  ? "…"
                  : plan.hot && primaryCtaLabel
                    ? primaryCtaLabel
                    : plan.cta}
              </>
            );
            const yearlyTotal = formatPlanPrice(plan.price * 12, locale);
            const btnClass = plan.hot
              ? "pricing-glass-btn-primary mb-5"
              : "pricing-glass-btn-secondary mb-5";

            return (
              <SpringReveal
                key={plan.key}
                delay={staggerDelays[planIndex] ?? planIndex * 0.15}
                className={`${PLAN_MOBILE_ORDER[plan.key]} h-full md:order-none`}
              >
                <div
                  className={`pricing-glass-card border border-zinc-700/60 ${
                    plan.hot ? "pricing-glass-card--featured" : ""
                  }`}
                >
                  {plan.hot && (
                    <div className="pricing-glass-badge absolute -top-3 left-1/2 -translate-x-1/2">
                      {t("most_popular")}
                    </div>
                  )}
                  <div className="pricing-glass-plan-name">{plan.name}</div>
                  <div className="pricing-glass-price">
                    <EuroPrice amount={plan.price} />
                    <span className="pricing-glass-price-unit">{t("per_month")}</span>
                  </div>
                  {!yearly ? (
                    <div className="mt-1.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#ccff00]">
                      {t("cancel_anytime")}
                    </div>
                  ) : (
                    <div
                      className="mt-1.5 text-[0.72rem] text-white/55"
                      style={{ fontFamily: "var(--font-dm), sans-serif" }}
                    >
                      {t("billed_yearly", { amount: yearlyTotal })}
                    </div>
                  )}
                  <div
                    className="mt-1.5 mb-1 text-[0.75rem] text-white/80"
                    style={{ fontFamily: "var(--font-dm), sans-serif" }}
                  >
                    {plan.credits}
                  </div>
                  <div
                    className="mb-2 text-[0.82rem] leading-[1.55] text-white/75"
                    style={{ fontFamily: "var(--font-dm), sans-serif" }}
                  >
                    {plan.desc}
                  </div>
                  <p
                    className="mb-4 text-[0.75rem] leading-[1.5] text-white/60"
                    style={{ fontFamily: "var(--font-dm), sans-serif" }}
                  >
                    {plan.delta}
                  </p>

                  {checkoutMode && onSubscribe ? (
                    <button
                      type="button"
                      disabled={subscribeLoading !== null}
                      onClick={() => handleCta(plan.key)}
                      className={btnClass}
                    >
                      {ctaContent}
                    </button>
                  ) : plan.hot ? (
                    <Link href="/auth/sign-up" className={`${btnClass} no-underline`}>
                      {plan.cta}
                    </Link>
                  ) : (
                    <Link href="/auth/sign-up" className={`${btnClass} no-underline`}>
                      {plan.cta}
                    </Link>
                  )}

                  <ul className="flex list-none flex-col gap-2.5">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={`${plan.key}-${featureIndex}`}
                        className={`flex items-start gap-2.5 text-[0.84rem] ${
                          feature.included
                            ? "text-white/80"
                            : "text-white/45"
                        }`}
                        style={{ fontFamily: "var(--font-dm), sans-serif" }}
                      >
                        <span
                          className={
                            feature.included
                              ? "pricing-glass-check"
                              : "pricing-glass-check pricing-glass-check--excluded"
                          }
                          aria-hidden
                        >
                          {feature.included ? "✓" : "✗"}
                        </span>
                        {feature.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </SpringReveal>
            );
          })}
        </div>
      </div>

      <p className="pricing-glass-footnote">
        {t("footnote")}{" "}
        <Link href="/dashboard/credits">{t("extra_credits")}</Link> {t("extra_credits_suffix")}
      </p>
    </div>
  );
}

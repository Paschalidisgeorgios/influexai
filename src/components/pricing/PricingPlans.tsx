"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { InfluexBadge, InfluexButton, InfluexSurface } from "@/components/shared/influex";
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

function EuroPrice({
  amount,
  variant,
}: {
  amount: number;
  variant: "glass" | "influex";
}) {
  if (variant === "influex") {
    return (
      <span className="influex-pricing-plan__price">
        <span className="influex-pricing-plan__currency" aria-hidden>
          €
        </span>
        {formatPlanPrice(amount)}
      </span>
    );
  }

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
  variant?: "glass" | "influex";
  checkoutMode?: boolean;
  onSubscribe?: (plan: string, interval: BillingInterval) => void;
  subscribeLoading?: string | null;
  className?: string;
  primaryCtaLabel?: ReactNode;
};

export function PricingPlans({
  variant = "glass",
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
  const isInfluex = variant === "influex";

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

  const toggleClass = isInfluex ? "influex-pricing-toggle" : "pricing-glass-toggle";
  const toggleBtnActive = isInfluex
    ? "influex-pricing-toggle__btn influex-pricing-toggle__btn--active"
    : "pricing-glass-toggle__btn pricing-glass-toggle__btn--active";
  const toggleBtnIdle = isInfluex
    ? "influex-pricing-toggle__btn"
    : "pricing-glass-toggle__btn pricing-glass-toggle__btn--idle";
  const toggleBadge = isInfluex
    ? "influex-pricing-toggle__badge"
    : "pricing-glass-toggle__badge";
  const gridWrapClass = isInfluex ? "influex-pricing-plans" : "pricing-plans-scroll";
  const gridClass = isInfluex ? "influex-pricing-plans__grid" : "pricing-plans-grid text-left";
  const footnoteClass = isInfluex ? "influex-pricing-footnote" : "pricing-glass-footnote";

  return (
    <div className={className}>
      <div className={`${toggleClass} mx-auto mt-5 mb-9`}>
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
              className={active ? toggleBtnActive : toggleBtnIdle}
            >
              {label}
              {isY && (
                <span className={toggleBadge}>
                  {t("yearly_discount", { percent: YEARLY_DISCOUNT_PERCENT })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={gridWrapClass}>
        <div className={gridClass}>
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

            const cardInner = (
              <>
                {plan.hot &&
                  (isInfluex ? (
                    <InfluexBadge tone="lime" className="influex-pricing-plan__badge">
                      {t("most_popular")}
                    </InfluexBadge>
                  ) : (
                    <div className="pricing-glass-badge absolute -top-3 left-1/2 -translate-x-1/2">
                      {t("most_popular")}
                    </div>
                  ))}

                <div className={isInfluex ? "influex-pricing-plan__name" : "pricing-glass-plan-name"}>
                  {plan.name}
                </div>

                <div className={isInfluex ? "influex-pricing-plan__price-row" : "pricing-glass-price"}>
                  <EuroPrice amount={plan.price} variant={variant} />
                  <span
                    className={
                      isInfluex ? "influex-pricing-plan__period" : "pricing-glass-price-unit"
                    }
                  >
                    {t("per_month")}
                  </span>
                </div>

                {!yearly ? (
                  <p className={isInfluex ? "influex-pricing-plan__billing-note" : undefined}>
                    {isInfluex ? (
                      t("cancel_anytime")
                    ) : (
                      <span className="mt-1.5 block font-mono text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#ccff00]">
                        {t("cancel_anytime")}
                      </span>
                    )}
                  </p>
                ) : (
                  <p
                    className={
                      isInfluex
                        ? "influex-pricing-plan__billing-note influex-pricing-plan__billing-note--muted"
                        : "mt-1.5 text-[0.72rem] text-white/55"
                    }
                    style={isInfluex ? undefined : { fontFamily: "var(--font-dm), sans-serif" }}
                  >
                    {t("billed_yearly", { amount: yearlyTotal })}
                  </p>
                )}

                <p className={isInfluex ? "influex-pricing-plan__credits" : undefined}>
                  {isInfluex ? (
                    plan.credits
                  ) : (
                    <span
                      className="mt-1.5 mb-1 block text-[0.75rem] text-white/80"
                      style={{ fontFamily: "var(--font-dm), sans-serif" }}
                    >
                      {plan.credits}
                    </span>
                  )}
                </p>

                <p className={isInfluex ? "influex-pricing-plan__desc" : undefined}>
                  {isInfluex ? (
                    plan.desc
                  ) : (
                    <span
                      className="mb-2 block text-[0.82rem] leading-[1.55] text-white/75"
                      style={{ fontFamily: "var(--font-dm), sans-serif" }}
                    >
                      {plan.desc}
                    </span>
                  )}
                </p>

                <p className={isInfluex ? "influex-pricing-plan__delta" : undefined}>
                  {isInfluex ? (
                    plan.delta
                  ) : (
                    <span
                      className="mb-4 block text-[0.75rem] leading-[1.5] text-white/60"
                      style={{ fontFamily: "var(--font-dm), sans-serif" }}
                    >
                      {plan.delta}
                    </span>
                  )}
                </p>

                {checkoutMode && onSubscribe ? (
                  isInfluex ? (
                    <InfluexButton
                      type="button"
                      variant={plan.hot ? "lime" : "secondary"}
                      className="influex-pricing-plan__cta"
                      disabled={subscribeLoading !== null}
                      loading={loading}
                      onClick={() => handleCta(plan.key)}
                    >
                      {ctaContent}
                    </InfluexButton>
                  ) : (
                    <button
                      type="button"
                      disabled={subscribeLoading !== null}
                      onClick={() => handleCta(plan.key)}
                      className={
                        plan.hot
                          ? "pricing-glass-btn-primary mb-5"
                          : "pricing-glass-btn-secondary mb-5"
                      }
                    >
                      {ctaContent}
                    </button>
                  )
                ) : isInfluex ? (
                  <InfluexButton
                    href="/auth/sign-up"
                    variant={plan.hot ? "lime" : "secondary"}
                    className="influex-pricing-plan__cta"
                  >
                    {plan.cta}
                  </InfluexButton>
                ) : (
                  <Link
                    href="/auth/sign-up"
                    className={`${
                      plan.hot
                        ? "pricing-glass-btn-primary mb-5"
                        : "pricing-glass-btn-secondary mb-5"
                    } no-underline`}
                  >
                    {plan.cta}
                  </Link>
                )}

                <ul
                  className={
                    isInfluex
                      ? "influex-pricing-plan__features"
                      : "flex list-none flex-col gap-2.5"
                  }
                >
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={`${plan.key}-${featureIndex}`}
                      className={
                        isInfluex
                          ? feature.included
                            ? "influex-pricing-plan__feature"
                            : "influex-pricing-plan__feature influex-pricing-plan__feature--excluded"
                          : `flex items-start gap-2.5 text-[0.84rem] ${
                              feature.included ? "text-white/80" : "text-white/45"
                            }`
                      }
                      style={
                        isInfluex ? undefined : { fontFamily: "var(--font-dm), sans-serif" }
                      }
                    >
                      {!isInfluex && (
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
                      )}
                      {isInfluex && feature.included ? (
                        <span className="influex-pricing-plan__check" aria-hidden>
                          ✓
                        </span>
                      ) : null}
                      {feature.text}
                    </li>
                  ))}
                </ul>
              </>
            );

            const card = isInfluex ? (
              <InfluexSurface
                variant={plan.hot ? "elevated" : "default"}
                as="article"
                className={`influex-pricing-plan ${
                  plan.hot ? "influex-pricing-plan--featured" : ""
                }`}
              >
                {cardInner}
              </InfluexSurface>
            ) : (
              <div
                className={`pricing-glass-card border border-zinc-700/60 ${
                  plan.hot ? "pricing-glass-card--featured" : ""
                }`}
              >
                {cardInner}
              </div>
            );

            return (
              <SpringReveal
                key={plan.key}
                delay={staggerDelays[planIndex] ?? planIndex * 0.15}
                className={`${PLAN_MOBILE_ORDER[plan.key]} h-full md:order-none`}
              >
                {card}
              </SpringReveal>
            );
          })}
        </div>
      </div>

      <p className={footnoteClass}>
        {t("footnote")}{" "}
        <Link
          href="/dashboard/credits"
          className={isInfluex ? "influex-pricing-footnote__link" : undefined}
        >
          {t("extra_credits")}
        </Link>{" "}
        {t("extra_credits_suffix")}
      </p>
    </div>
  );
}

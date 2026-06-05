"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { SpringReveal } from "@/components/ui/SpringReveal";
import {
  SUBSCRIPTION_PLAN_ORDER,
  SUBSCRIPTION_PLANS,
  YEARLY_DISCOUNT_PERCENT,
  getClientStripePriceId,
  type BillingInterval,
} from "@/lib/subscription-plans";

function formatPriceAmount(price: number): string {
  return Number.isInteger(price)
    ? String(price)
    : price.toFixed(2).replace(".", ",");
}

/** € inline before amount — superscript style, same line as number (locale-agnostic). */
function EuroPrice({ amount }: { amount: number }) {
  return (
    <span className="whitespace-nowrap">
      <span
        aria-hidden
        style={{
          fontSize: "40%",
          verticalAlign: "super",
          marginRight: "2px",
        }}
      >
        {"\u20AC"}
      </span>
      <span>{formatPriceAmount(amount)}</span>
    </span>
  );
}

type PricingPlansProps = {
  /** When true, CTAs trigger subscription checkout (user must be logged in) */
  checkoutMode?: boolean;
  onSubscribe?: (
    plan: string,
    interval: BillingInterval,
    priceId?: string
  ) => void;
  subscribeLoading?: string | null;
  className?: string;
};

export function PricingPlans({
  checkoutMode = false,
  onSubscribe,
  subscribeLoading = null,
  className,
}: PricingPlansProps) {
  const t = useTranslations("landingPage.pricing");
  const [yearly, setYearly] = useState(false);
  const interval: BillingInterval = yearly ? "yearly" : "monthly";

  const planContent = (key: (typeof SUBSCRIPTION_PLAN_ORDER)[number]) => {
    const config = SUBSCRIPTION_PLANS[key];
    const starterMissing =
      key === "starter" ? [t("starter_m1"), t("starter_m2"), t("starter_m3")] : [];
    const starterFeatures = [
      t("starter_f1"),
      t("starter_f2"),
      t("starter_f3"),
    ];
    const creatorFeatures = [
      t("creator_f1"),
      t("creator_f2"),
      t("creator_f3"),
      t("creator_f4"),
      t("creator_f5"),
    ];
    const proFeatures = [
      t("pro_f1"),
      t("pro_f2"),
      t("pro_f3"),
      t("pro_f4"),
      t("pro_f5"),
      t("pro_f6"),
    ];
    const businessFeatures = [
      t("business_f1"),
      t("business_f2"),
      t("business_f3"),
      t("business_f4"),
      t("business_f5"),
    ];

    const features =
      key === "starter"
        ? starterFeatures
        : key === "creator"
          ? creatorFeatures
          : key === "pro"
            ? proFeatures
            : businessFeatures;

    const price =
      interval === "yearly"
        ? config.yearlyPricePerMonthEur
        : config.monthlyPriceEur;

    return {
      key,
      hot: config.popular ?? false,
      price,
      name: t(`${key}_name`),
      credits: t(`${key}_credits`),
      desc: t(`${key}_desc`),
      cta: t(`${key}_cta`),
      features,
      missing: starterMissing,
    };
  };

  const plans = SUBSCRIPTION_PLAN_ORDER.map(planContent);

  const handleCta = (planKey: (typeof SUBSCRIPTION_PLAN_ORDER)[number]) => {
    if (checkoutMode && onSubscribe) {
      const priceId = getClientStripePriceId(planKey, interval);
      onSubscribe(planKey, interval, priceId);
    }
  };

  return (
    <div className={className}>
      <div
        className="inline-flex p-1 rounded-[10px] mt-5 mb-9 mx-auto"
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
        }}
      >
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
              className="px-5 py-2 rounded-[7px] text-sm font-semibold cursor-pointer border-none transition-all duration-200"
              style={{
                background: active ? "var(--white)" : "transparent",
                color: active ? "var(--bg)" : "var(--grey)",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              {label}
              {isY && (
                <span
                  className="ml-1.5 text-[0.65rem] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: "var(--acid-d)",
                    color: "var(--acid)",
                  }}
                >
                  {t("yearly_discount", { percent: YEARLY_DISCOUNT_PERCENT })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-left">
        {plans.map((plan, planIndex) => {
          const loading = subscribeLoading === `${plan.key}-${interval}`;
          const staggerDelays = [0, 0.15, 0.3, 0.45];
          const ctaContent = (
            <>
              {loading ? "…" : plan.cta}
            </>
          );

          return (
            <SpringReveal
              key={plan.key}
              delay={staggerDelays[planIndex] ?? planIndex * 0.15}
            >
            <div
              className={`glass-card flex flex-col p-[clamp(20px,3vw,28px)] transition-all duration-200 hover:-translate-y-0.5 relative h-full ${plan.hot ? "pc-hot" : ""}`}
              style={{
                marginTop: plan.hot ? 14 : 0,
              }}
            >
              {plan.hot && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[#060608] font-bold text-[0.7rem] px-4 py-1 rounded-full whitespace-nowrap"
                  style={{
                    background: "var(--acid)",
                    fontFamily: "var(--font-dm), sans-serif",
                  }}
                >
                  {t("popular")}
                </div>
              )}
              <div className="text-[0.72rem] font-bold uppercase tracking-[0.1em] mb-2.5 text-white">
                {plan.name}
              </div>
              <div
                className="text-white font-black"
                style={{
                  fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                  fontSize: "3rem",
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                }}
              >
                <EuroPrice amount={plan.price} />
                <span
                  className="text-[0.85rem] ml-0.5 text-white/70 font-normal"
                  style={{ fontFamily: "var(--font-dm), sans-serif" }}
                >
                  {t("per_month")}
                </span>
              </div>
              <div className="text-[0.75rem] mt-1.5 mb-1 text-white/85">
                {plan.credits}
              </div>
              <div className="text-[0.82rem] mb-4 leading-[1.55] text-white/80">
                {plan.desc}
              </div>

              {checkoutMode && onSubscribe ? (
                <button
                  type="button"
                  disabled={subscribeLoading !== null}
                  onClick={() => handleCta(plan.key)}
                  className="block w-full text-center py-2.5 rounded-[9px] font-bold text-[0.88rem] no-underline transition-all duration-200 mb-5 cursor-pointer border-none"
                  style={
                    plan.hot
                      ? {
                          background: "var(--acid)",
                          color: "#060608",
                          fontFamily: "var(--font-dm), sans-serif",
                          opacity: loading ? 0.7 : 1,
                        }
                      : {
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "rgba(255,255,255,0.85)",
                          fontFamily: "var(--font-dm), sans-serif",
                          opacity: loading ? 0.7 : 1,
                        }
                  }
                >
                  {ctaContent}
                </button>
              ) : (
                <AcidMotionButton
                  href="/auth/sign-up"
                  className={`block w-full text-center py-2.5 rounded-[9px] font-bold text-[0.88rem] no-underline transition-all duration-200 mb-5 ${
                    plan.hot ? "btn-acid" : "btn-ghost"
                  }`}
                >
                  {plan.cta}
                </AcidMotionButton>
              )}

              <ul className="list-none flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[0.84rem] text-white/85"
                  >
                    <span
                      className="font-bold flex-shrink-0"
                      style={{ color: "var(--acid)" }}
                    >
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[0.84rem] text-white/35 line-through"
                  >
                    <span className="flex-shrink-0 text-white/35">
                      —
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            </SpringReveal>
          );
        })}
      </div>

      <p className="mt-5 text-[0.83rem] text-center" style={{ color: "var(--grey)" }}>
        {t("footnote")}{" "}
        <Link href="/dashboard/credits" style={{ color: "var(--acid)", textDecoration: "none" }}>
          {t("extra_credits")}
        </Link>{" "}
        {t("extra_credits_suffix")}
      </p>
    </div>
  );
}

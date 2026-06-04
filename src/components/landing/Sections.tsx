"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { PoweredByFooter } from "@/components/tenant-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

const TICKER_KEYS = [
  "i0",
  "i1",
  "i2",
  "i3",
  "i4",
  "i5",
  "i6",
  "i7",
  "i8",
  "i9",
  "i10",
  "i11",
] as const;

const BRAND_FEAT_KEYS = ["feat1", "feat2", "feat3"] as const;
const BRAND_EX_KEYS = ["ex1", "ex2", "ex3"] as const;
const FEATURE_KEYS = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;
const FEATURE_ICONS = ["✍️", "🤖", "🎭", "▶️", "📡", "📊"] as const;
/** Prefer .jpg when present; .png / hero fallbacks until assets are replaced */
const FEATURE_IMAGES: Record<(typeof FEATURE_KEYS)[number], string> = {
  f1: "/images/landing/feature-1.png",
  f2: "/images/landing/feature-2.png",
  f3: "/images/landing/feature-3.png",
  f4: "/images/landing/hero-2.jpg",
  f5: "/images/landing/hero.jpg",
  f6: "/images/landing/hero-3.jpg",
};
const STEP_KEYS = ["s1", "s2", "s3"] as const;
const TESTIMONIAL_KEYS = ["t1", "t2", "t3"] as const;
const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;
const PLAN_KEYS = ["starter", "creator", "business"] as const;

const BRAND_IMAGES = [
  "https://images.unsplash.com/photo-1503602642458-232111445657?w=500&q=80&fit=crop",
  "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=500&q=80&fit=crop",
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&q=80&fit=crop",
];

const PLAN_PRICES = {
  starter: { monthly: 4.99, yearly: 4.99, hot: false },
  creator: { monthly: 39, yearly: 29, hot: true },
  business: { monthly: 99, yearly: 74, hot: false },
} as const;

export function TickerStrip() {
  const t = useTranslations("landingPage.ticker");
  const items = TICKER_KEYS.map((k) => t(k));
  const doubled = [...items, ...items];

  return (
    <div className="ticker-wrap py-4">
      <div className="ticker-inner">
        {doubled.map((item, i) => (
          <div key={i} className="ticker-item">
            <span className="ticker-dot" aria-hidden />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ForBrandsSection() {
  const t = useTranslations("landingPage.brands");

  return (
    <section
      id="brands"
      className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "var(--bg-1)" }}
    >
      <div className="max-w-[1160px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-14">
          <div>
            <span className="kicker mb-2.5">{t("kicker")}</span>
            <span
              className="block"
              style={{
                width: 32,
                height: 2,
                background: "var(--acid)",
                borderRadius: 2,
                margin: "14px 0 20px",
              }}
            />
            <h2
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "clamp(2.5rem,5vw,5rem)",
                letterSpacing: "0.02em",
                lineHeight: 0.95,
              }}
            >
              {t("headline1")}
              <br />
              {t("headline2")}
              <br />
              <span style={{ color: "var(--acid)" }}>{t("headline3")}</span>
            </h2>
          </div>
          <div>
            <p
              className="mb-6"
              style={{
                fontSize: "clamp(0.9rem,1.6vw,1rem)",
                color: "var(--wd)",
                lineHeight: 1.75,
                maxWidth: 420,
              }}
            >
              {t("intro")}
            </p>
            <div className="flex flex-col gap-3">
              {BRAND_FEAT_KEYS.map((key, i) => (
                <div
                  key={key}
                  className="flex items-start gap-3.5 rounded-[10px]"
                  style={{
                    padding: "14px 16px",
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="flex-shrink-0"
                    style={{
                      fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                      fontSize: "1.4rem",
                      color: "var(--acid)",
                      lineHeight: 1,
                      width: 28,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div
                      className="font-bold text-sm mb-1"
                      style={{ color: "var(--white)" }}
                    >
                      {t(`${key}_title`)}
                    </div>
                    <div
                      className="text-[0.8rem] leading-[1.6]"
                      style={{ color: "var(--wd)" }}
                    >
                      {t(`${key}_desc`)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BRAND_EX_KEYS.map((key, i) => (
            <div
              key={key}
              className="img-card"
              style={{ aspectRatio: "3/4", borderRadius: 14 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND_IMAGES[i]}
                alt={t(`${key}_title`)}
                style={{
                  filter: "brightness(0.75) saturate(1.2)",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                loading="lazy"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(6,6,8,0.92) 0%, transparent 55%)",
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <div
                  className="text-[0.65rem] font-bold uppercase tracking-[0.06em] mb-1"
                  style={{ color: "var(--acid)" }}
                >
                  {t(`${key}_cat`)}
                </div>
                <div
                  className="font-bold text-[0.82rem] leading-[1.3]"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {t(`${key}_title`)}
                </div>
                <div className="text-[0.68rem] text-white/45 mt-0.5">
                  {t(`${key}_sub`)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const t = useTranslations("landingPage.features");

  return (
    <section
      id="features"
      className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-[1160px] mx-auto">
        <div className="flex items-end justify-between gap-8 mb-12 flex-wrap">
          <div>
            <span className="kicker mb-2.5">{t("kicker")}</span>
            <h2
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "clamp(2.5rem,5vw,5rem)",
                letterSpacing: "0.02em",
                lineHeight: 0.95,
              }}
            >
              {t("headline1")}
              <br />
              {t("headline2")}
            </h2>
          </div>
          <p
            className="max-w-[280px] text-right text-sm leading-[1.7]"
            style={{ color: "var(--wd)" }}
          >
            {t("sidebar")}
          </p>
        </div>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{
            background: "var(--border)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {FEATURE_KEYS.map((key, i) => (
            <div
              key={key}
              className="feat-card flex flex-col"
              style={{ padding: 0 }}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0c0c0f]">
                <Image
                  src={FEATURE_IMAGES[key]}
                  alt={t(`${key}_title`)}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  style={{ filter: "brightness(0.85) saturate(1.12)" }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(6,6,8,0.85) 0%, transparent 55%)",
                  }}
                  aria-hidden
                />
              </div>
              <div
                style={{
                  padding: "clamp(20px,3vw,28px) clamp(16px,2.5vw,26px)",
                }}
              >
              <div
                className="mb-4"
                style={{
                  fontFamily: "var(--font-dm), monospace",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.12)",
                  letterSpacing: "0.12em",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <span className="text-[1.4rem] block mb-2">{FEATURE_ICONS[i]}</span>
              <div
                className="font-bold mb-2"
                style={{ fontSize: "1.05rem", letterSpacing: "-0.02em" }}
              >
                {t(`${key}_title`)}
              </div>
              <p
                className="text-sm leading-[1.7]"
                style={{ color: "var(--wd)" }}
              >
                {t(`${key}_desc`)}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {[0, 1, 2].map((apiIdx) => (
                  <span key={apiIdx} className="tag-api">
                    {t(`${key}_api${apiIdx}`)}
                  </span>
                ))}
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const t = useTranslations("landingPage.how");

  return (
    <section
      id="how"
      className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-[1160px] mx-auto">
        <span className="kicker mb-2.5">{t("kicker")}</span>
        <h2
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(2.5rem,5vw,4rem)",
            letterSpacing: "0.02em",
            lineHeight: 0.95,
            marginBottom: 40,
          }}
        >
          {t("headline1")}
          <br />
          <span style={{ color: "var(--acid)" }}>{t("headline2")}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEP_KEYS.map((key, i) => (
            <div
              key={key}
              className="rounded-[14px] p-7"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                  fontSize: "2.5rem",
                  color: "var(--acid)",
                  lineHeight: 1,
                  marginBottom: 16,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                className="font-bold text-lg mb-2"
                style={{ letterSpacing: "-0.02em" }}
              >
                {t(`${key}_title`)}
              </div>
              <p
                className="text-sm leading-[1.7]"
                style={{ color: "var(--wd)" }}
              >
                {t(`${key}_desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const t = useTranslations("landingPage.testimonials");

  return (
    <section
      className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "var(--bg-1)" }}
    >
      <div className="max-w-[1160px] mx-auto">
        <span className="kicker mb-2.5">{t("kicker")}</span>
        <h2
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(2.5rem,5vw,4rem)",
            letterSpacing: "0.02em",
            lineHeight: 0.95,
            marginBottom: 40,
          }}
        >
          {t("headline1")}
          <br />
          <span style={{ color: "var(--acid)" }}>{t("headline2")}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIAL_KEYS.map((key) => (
            <div
              key={key}
              className="rounded-[14px] p-6 flex flex-col"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="mb-3 text-sm" style={{ color: "var(--acid)" }}>
                ★★★★★
              </div>
              <p
                className="text-[0.9rem] leading-[1.75] flex-1 mb-5"
                style={{ color: "var(--wd)" }}
              >
                &ldquo;{t(`${key}_quote`)}&rdquo;
              </p>
              <div>
                <div className="font-bold text-sm">{t(`${key}_name`)}</div>
                <div
                  className="text-[0.78rem] mt-0.5"
                  style={{ color: "var(--grey)" }}
                >
                  {t(`${key}_role`)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const t = useTranslations("landingPage.faq");
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-[720px] mx-auto">
        <span className="kicker mb-2.5 block text-center">{t("kicker")}</span>
        <h2
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(2.5rem,5vw,4rem)",
            letterSpacing: "0.02em",
            lineHeight: 0.95,
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          {t("headline")}
        </h2>
        <div className="flex flex-col gap-2">
          {FAQ_KEYS.map((key, i) => (
            <div
              key={key}
              className="rounded-[12px] overflow-hidden"
              style={{
                border: "1px solid var(--border)",
                background: "var(--bg-2)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer border-none"
                style={{
                  background: "transparent",
                  color: "var(--white)",
                  fontFamily: "var(--font-dm), sans-serif",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                {t(key)}
                <span
                  style={{
                    color: "var(--acid)",
                    fontSize: "1.2rem",
                    flexShrink: 0,
                  }}
                >
                  {open === i ? "−" : "+"}
                </span>
              </button>
              {open === i && (
                <div
                  className="px-5 pb-5 text-[0.875rem] leading-[1.75]"
                  style={{ color: "var(--wd)" }}
                >
                  {t(`a${key.slice(1)}`)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingSection() {
  const t = useTranslations("landingPage.pricing");
  const [yearly, setYearly] = useState(false);

  const starterMissing = [t("starter_m1"), t("starter_m2")];
  const starterFeatures = [t("starter_f1"), t("starter_f2"), t("starter_f3")];
  const creatorFeatures = [
    t("creator_f1"),
    t("creator_f2"),
    t("creator_f3"),
    t("creator_f4"),
    t("creator_f5"),
  ];
  const businessFeatures = [
    t("business_f1"),
    t("business_f2"),
    t("business_f3"),
    t("business_f4"),
    t("business_f5"),
  ];

  const plans = PLAN_KEYS.map((key) => ({
    key,
    hot: PLAN_PRICES[key].hot,
    monthly: PLAN_PRICES[key].monthly,
    yearly: PLAN_PRICES[key].yearly,
    name: t(`${key}_name`),
    credits: t(`${key}_credits`),
    desc: t(`${key}_desc`),
    cta: t(`${key}_cta`),
    features:
      key === "starter"
        ? starterFeatures
        : key === "creator"
          ? creatorFeatures
          : businessFeatures,
    missing: key === "starter" ? starterMissing : [],
  }));

  return (
    <section
      id="pricing"
      className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "var(--bg-1)" }}
    >
      <div className="max-w-[960px] mx-auto text-center">
        <span className="kicker mb-2.5">{t("kicker")}</span>
        <h2
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(2.5rem,5vw,4.5rem)",
            letterSpacing: "0.02em",
            lineHeight: 0.95,
          }}
        >
          {t("headline")}
        </h2>
        <div
          className="inline-flex p-1 rounded-[10px] mt-5 mb-9 mx-auto"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
          }}
        >
          {(
            [
              { id: "monthly", label: t("monthly"), isY: false },
              { id: "yearly", label: t("yearly"), isY: true },
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
                    {t("yearly_discount")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`flex flex-col rounded-[18px] p-[clamp(20px,3vw,28px)] transition-all duration-200 hover:-translate-y-0.5 relative ${plan.hot ? "pc-hot" : ""}`}
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                marginTop: plan.hot ? "14px" : 0,
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
              <div
                className="text-[0.72rem] font-bold uppercase tracking-[0.1em] mb-2.5"
                style={{ color: "var(--grey)" }}
              >
                {plan.name}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                  fontSize: "3rem",
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                }}
              >
                <sup className="text-[1.2rem] align-top mt-[0.3rem]">€</sup>
                {yearly ? plan.yearly : plan.monthly}
                {plan.monthly > 0 && (
                  <span
                    className="text-[0.85rem] ml-0.5"
                    style={{
                      color: "var(--grey)",
                      fontFamily: "var(--font-dm), sans-serif",
                      fontWeight: 400,
                    }}
                  >
                    {t("per_month")}
                  </span>
                )}
              </div>
              <div
                className="text-[0.75rem] mt-1.5 mb-1"
                style={{ color: "var(--wd)" }}
              >
                {plan.credits}
              </div>
              <div
                className="text-[0.82rem] mb-4 leading-[1.55]"
                style={{ color: "var(--grey)" }}
              >
                {plan.desc}
              </div>
              <a
                href="/auth/sign-up"
                className="block text-center py-2.5 rounded-[9px] font-bold text-[0.88rem] no-underline transition-all duration-200 mb-5 cursor-pointer"
                style={
                  plan.hot
                    ? {
                        background: "var(--acid)",
                        color: "#060608",
                        fontFamily: "var(--font-dm), sans-serif",
                      }
                    : {
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "rgba(240,239,232,0.6)",
                        fontFamily: "var(--font-dm), sans-serif",
                      }
                }
              >
                {plan.cta}
              </a>
              <ul className="list-none flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[0.84rem]"
                    style={{ color: "var(--wd)" }}
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
                    className="flex items-start gap-2.5 text-[0.84rem]"
                    style={{ color: "var(--grey)" }}
                  >
                    <span
                      className="flex-shrink-0"
                      style={{ color: "var(--grey)" }}
                    >
                      —
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[0.83rem]" style={{ color: "var(--grey)" }}>
          {t("footnote")}{" "}
          <a href="#" style={{ color: "var(--acid)", textDecoration: "none" }}>
            {t("extra_credits")}
          </a>{" "}
          {t("extra_credits_suffix")}
        </p>
      </div>
    </section>
  );
}

export function CtaSection() {
  const t = useTranslations("landingPage.cta");

  return (
    <section
      id="cta"
      className="py-[clamp(60px,8vw,120px)] px-[clamp(20px,6vw,64px)] relative overflow-hidden text-center"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          top: -150,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, rgba(180,255,0,0.06), transparent 70%)",
        }}
      />
      <div className="max-w-[700px] mx-auto relative z-10">
        <span className="kicker mb-4">{t("kicker")}</span>
        <h2
          className="mb-4"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(3rem,7vw,6rem)",
            letterSpacing: "0.02em",
            lineHeight: 0.92,
          }}
        >
          {t("headline1")}
          <br />
          {t("headline2")}
          <br />
          <span style={{ color: "var(--acid)" }}>{t("headline3")}</span>
        </h2>
        <p
          className="mb-8 leading-[1.75]"
          style={{ fontSize: "clamp(0.9rem,2vw,1.05rem)", color: "var(--wd)" }}
        >
          {t("sub1")}
          <br />
          {t("sub2")}
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 justify-center">
          <a href="/auth/sign-up" className="btn-acid justify-center">
            {t("primary")}
          </a>
          <a href="#brands" className="btn-ghost justify-center">
            {t("secondary")}
          </a>
        </div>
        <p className="mt-4 text-[0.78rem]" style={{ color: "var(--grey)" }}>
          {t("note")}
        </p>
      </div>
    </section>
  );
}

const FOOTER_COLS = [
  {
    col: "product",
    links: [
      "product_features",
      "product_pricing",
      "product_changelog",
      "product_api",
    ],
  },
  {
    col: "company",
    links: [
      "company_about",
      "company_blog",
      "company_careers",
      "company_press",
    ],
  },
  {
    col: "legal",
    links: [
      "legal_imprint",
      "legal_privacy",
      "legal_terms",
      "legal_cookies",
    ],
  },
] as const;

export function LandingFooter() {
  const t = useTranslations("footer");
  const tc = useTranslations("landingPage.footer_cols");

  return (
    <footer
      className="px-[clamp(20px,6vw,64px)] pt-[clamp(40px,6vw,56px)] pb-7"
      style={{
        background: "var(--bg-1)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-[1160px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-9 mb-10">
        <div>
          <a href="/" className="flex items-center gap-2 no-underline mb-2.5">
            <div className="w-7 h-7 rounded-[7px] bg-[#B4FF00] flex items-center justify-center text-[#060608] font-[family-name:var(--font-bebas)] text-sm leading-none">
              I
            </div>
            <span
              className="text-[0.9rem]"
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                letterSpacing: "0.04em",
                color: "var(--white)",
              }}
            >
              Influex<span style={{ color: "var(--acid)" }}>AI</span>
            </span>
          </a>
          <p
            className="text-[0.83rem] leading-[1.7] max-w-[210px]"
            style={{ color: "var(--grey)" }}
          >
            {t("tagline")}
          </p>
        </div>
        {FOOTER_COLS.map(({ col, links }) => (
          <div key={col}>
            <h5
              className="text-[0.72rem] font-bold uppercase tracking-[0.1em] mb-3.5"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {tc(col)}
            </h5>
            <div className="flex flex-col gap-2.5">
              {links.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-[0.84rem] no-underline transition-colors duration-150 hover:text-[var(--white)]"
                  style={{ color: "var(--grey)" }}
                >
                  {tc(link)}
                </a>
              ))}
            </div>
          </div>
        ))}
        <div>
          <h5
            className="text-[0.72rem] font-bold uppercase tracking-[0.1em] mb-3.5"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            {t("partner")}
          </h5>
          <a
            href="/dashboard/white-label"
            className="text-[0.84rem] no-underline transition-colors duration-150 hover:text-[var(--accent)]"
            style={{ color: "var(--grey)" }}
          >
            {t("for_agencies")}
          </a>
          <div className="mt-4">
            <LanguageSwitcher compact />
          </div>
        </div>
      </div>
      <PoweredByFooter />
      <div
        className="max-w-[1160px] mx-auto pt-5 flex flex-col sm:flex-row items-center justify-between gap-2.5"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p className="text-[0.78rem]" style={{ color: "var(--grey)" }}>
          © 2025 InfluexAI
        </p>
        <div className="flex gap-2">
          {["𝕏", "in", "▶"].map((icon) => (
            <a
              key={icon}
              href="#"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[0.8rem] no-underline transition-all duration-150 hover:text-[var(--acid)]"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                color: "var(--grey)",
              }}
            >
              {icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

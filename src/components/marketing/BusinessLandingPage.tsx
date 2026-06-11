"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bot,
  Building2,
  CalendarDays,
  Factory,
  Globe2,
  ImageIcon,
  Layers,
  Megaphone,
  Store,
  X,
  Check,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LandingNav } from "@/components/landing/LandingNav";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

const GOLD = "#E0A951";
const ACID = "#B4FF00";
const BG = "#060608";

const LOGO_PLACEHOLDERS = [Building2, Store, Factory, Globe2, Layers] as const;

const PROBLEM_KEYS = ["expensive", "slow", "inconsistent"] as const;
const SOLUTION_KEYS = ["affordable", "instant", "onbrand"] as const;

const FEATURE_KEYS = [
  { key: "product_ad", icon: Megaphone },
  { key: "ki_agent", icon: Bot },
  { key: "image_gen", icon: ImageIcon },
  { key: "calendar", icon: CalendarDays },
] as const;

function GoldKicker({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-2 text-center uppercase"
      style={{
        fontSize: 10,
        color: GOLD,
        letterSpacing: "0.14em",
        fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
        fontWeight: 700,
      }}
    >
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      className="text-center"
      style={{
        fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
        fontSize: "clamp(2rem, 5vw, 48px)",
        color: "#ffffff",
        letterSpacing: "0.02em",
        lineHeight: 1,
      }}
    >
      {children}
    </h2>
  );
}

function AcidCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[48px] items-center justify-center rounded-lg px-6 py-3 text-sm font-bold no-underline transition-all duration-200 hover:brightness-110 ${className}`}
      style={{
        background: ACID,
        color: BG,
        fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
      }}
    >
      {children}
    </Link>
  );
}

export function BusinessLandingPage() {
  const t = useTranslations("businessPage");
  const tPricing = useTranslations("landingPage.pricing");
  const business = SUBSCRIPTION_PLANS.business;

  return (
    <div
      className="landing-root min-h-screen overflow-x-clip text-[#F0EFE8]"
      style={{ background: BG }}
    >
      <LandingNav />

      {/* Hero */}
      <section className="relative px-[clamp(20px,6vw,64px)] pb-16 pt-28 md:pb-24 md:pt-32">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(224,169,81,0.14), transparent 60%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-[900px] text-center">
          <SpringReveal>
            <GoldKicker>{t("hero.kicker")}</GoldKicker>
            <h1
              className="mb-5"
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "clamp(2.5rem, 7vw, 5rem)",
                lineHeight: 0.95,
                letterSpacing: "0.02em",
                color: "#ffffff",
              }}
            >
              {t("hero.headline")}
            </h1>
            <p
              className="mx-auto mb-8 max-w-[52ch] text-base leading-relaxed md:text-lg"
              style={{
                color: "#aaaaaa",
                fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
              }}
            >
              {t("hero.subline")}
            </p>
            <AcidCta href="/dashboard">{t("hero.cta")}</AcidCta>
          </SpringReveal>
        </div>
      </section>

      {/* Social proof */}
      <section
        className="border-y border-white/[0.06] px-[clamp(20px,6vw,64px)] py-10"
        aria-label={t("proof.label")}
      >
        <div className="mx-auto max-w-[960px] text-center">
          <p
            className="mb-6 text-sm"
            style={{
              color: "#888888",
              fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
            }}
          >
            {t("proof.text")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {LOGO_PLACEHOLDERS.map((Icon, i) => (
              <div
                key={i}
                className="flex h-12 w-12 items-center justify-center rounded-xl border md:h-14 md:w-14"
                style={{
                  borderColor: "rgba(224,169,81,0.25)",
                  background: "rgba(224,169,81,0.06)",
                  color: GOLD,
                }}
                aria-hidden
              >
                <Icon size={22} strokeWidth={1.75} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="px-[clamp(20px,6vw,64px)] py-16 md:py-20">
        <div className="mx-auto max-w-[1160px]">
          <SpringReveal>
            <SectionHeading>{t("compare.headline")}</SectionHeading>
          </SpringReveal>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <p
                className="mb-4 text-xs font-bold uppercase tracking-[0.12em]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {t("compare.problem_label")}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PROBLEM_KEYS.map((key, i) => (
                  <SpringReveal key={key} delay={i * 0.06}>
                    <div
                      className="flex h-full flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-center"
                    >
                      <X
                        size={20}
                        className="text-red-400/80"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span
                        className="text-lg"
                        style={{
                          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                          color: "#ffffff",
                        }}
                      >
                        {t(`compare.problem_${key}`)}
                      </span>
                    </div>
                  </SpringReveal>
                ))}
              </div>
            </div>

            <div>
              <p
                className="mb-4 text-xs font-bold uppercase tracking-[0.12em]"
                style={{ color: GOLD }}
              >
                {t("compare.solution_label")}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {SOLUTION_KEYS.map((key, i) => (
                  <SpringReveal key={key} delay={i * 0.06}>
                    <div
                      className="flex h-full flex-col items-center gap-2 rounded-xl border p-5 text-center transition-colors duration-300 hover:border-[#E0A951]/60"
                      style={{
                        borderColor: "rgba(224,169,81,0.35)",
                        background: "rgba(224,169,81,0.06)",
                      }}
                    >
                      <Check size={20} style={{ color: GOLD }} strokeWidth={2.5} aria-hidden />
                      <span
                        className="text-lg"
                        style={{
                          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                          color: "#ffffff",
                        }}
                      >
                        {t(`compare.solution_${key}`)}
                      </span>
                    </div>
                  </SpringReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t border-white/[0.06] px-[clamp(20px,6vw,64px)] py-16 md:py-20"
      >
        <div className="mx-auto max-w-[1160px]">
          <SpringReveal>
            <GoldKicker>{t("features.kicker")}</GoldKicker>
            <div className="mb-10 md:mb-12">
              <SectionHeading>{t("features.headline")}</SectionHeading>
            </div>
          </SpringReveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURE_KEYS.map(({ key, icon: Icon }, i) => (
              <SpringReveal key={key} delay={i * 0.07}>
                <article
                  className="group flex h-full flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-300 hover:border-[#E0A951]/50 hover:bg-[rgba(224,169,81,0.04)]"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg border transition-colors group-hover:border-[#E0A951]/50"
                    style={{
                      borderColor: "rgba(224,169,81,0.3)",
                      background: "rgba(224,169,81,0.1)",
                      color: GOLD,
                    }}
                  >
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                      fontSize: "1.35rem",
                      color: "#ffffff",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {t(`features.${key}_title`)}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: "#888888",
                      fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
                    }}
                  >
                    {t(`features.${key}_desc`)}
                  </p>
                </article>
              </SpringReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="border-t border-white/[0.06] px-[clamp(20px,6vw,64px)] py-16 md:py-20"
      >
        <div className="mx-auto max-w-[520px] text-center">
          <SpringReveal>
            <GoldKicker>{t("pricing.kicker")}</GoldKicker>
            <div className="mb-8">
              <SectionHeading>{t("pricing.headline")}</SectionHeading>
            </div>

            <div
              className="relative rounded-2xl border p-8 text-left"
              style={{
                borderColor: "rgba(224,169,81,0.45)",
                background:
                  "linear-gradient(160deg, rgba(224,169,81,0.1) 0%, rgba(255,255,255,0.02) 55%)",
                boxShadow: "0 0 48px rgba(224,169,81,0.08)",
              }}
            >
              <div
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-[0.7rem] font-bold uppercase tracking-[0.08em]"
                style={{
                  background: GOLD,
                  color: BG,
                  fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
                }}
              >
                {t("pricing.badge")}
              </div>

              <p
                className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-white"
                style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
              >
                {tPricing("business_name")}
              </p>
              <div className="mb-1 flex items-baseline gap-1">
                <span
                  style={{
                    fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                    fontSize: "3.5rem",
                    lineHeight: 1,
                    color: "#ffffff",
                  }}
                >
                  €{business.monthlyPriceEur}
                </span>
                <span
                  className="text-sm text-white/70"
                  style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
                >
                  {tPricing("per_month")}
                </span>
              </div>
              <p
                className="mb-5 text-sm"
                style={{ color: "#888888", fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
              >
                {tPricing("business_credits")} · {tPricing("business_desc")}
              </p>

              <ul className="mb-6 flex flex-col gap-2.5">
                {(["business_f1", "business_f2", "business_f3", "business_f4", "business_f5"] as const).map(
                  (fKey) => (
                    <li
                      key={fKey}
                      className="flex items-start gap-2 text-sm text-white/85"
                      style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
                    >
                      <span style={{ color: GOLD }} aria-hidden>
                        ✓
                      </span>
                      {tPricing(fKey)}
                    </li>
                  )
                )}
              </ul>

              <AcidCta href="/dashboard" className="w-full">
                {tPricing("business_cta")}
              </AcidCta>
            </div>

            <p
              className="mt-5 text-sm"
              style={{ color: "#888888", fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
            >
              {t("pricing.compare_note")}{" "}
              <Link
                href="/preise"
                className="font-semibold no-underline transition-colors hover:underline"
                style={{ color: GOLD }}
              >
                {t("pricing.compare_link")}
              </Link>
            </p>
          </SpringReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="px-[clamp(20px,6vw,64px)] py-16 md:py-20"
        aria-labelledby="business-cta-heading"
      >
        <div
          className="mx-auto max-w-[1160px] rounded-2xl px-6 py-14 text-center md:px-12 md:py-16"
          style={{
            background:
              "linear-gradient(135deg, rgba(224,169,81,0.22) 0%, rgba(224,169,81,0.08) 40%, rgba(6,6,8,0.9) 100%)",
            border: "1px solid rgba(224,169,81,0.35)",
          }}
        >
          <h2
            id="business-cta-heading"
            className="mb-6"
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              color: "#ffffff",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {t("cta.headline")}
          </h2>
          <AcidCta href="/dashboard">{t("cta.button")}</AcidCta>
        </div>
      </section>

      <footer
        className="border-t border-white/[0.06] px-[clamp(20px,6vw,64px)] py-8 text-center"
        style={{ background: BG }}
      >
        <p
          className="text-sm text-[#888888]"
          style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
        >
          © {new Date().getFullYear()} InfluexAI ·{" "}
          <Link href="/" className="text-[#888888] no-underline hover:text-[#E0A951]">
            influexaicreator.com
          </Link>
        </p>
      </footer>
    </div>
  );
}

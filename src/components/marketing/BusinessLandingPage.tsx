"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Calendar,
  Image as ImageIcon,
  Megaphone,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/Sections";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { StudioGlassShell } from "@/components/ui/StudioGlassShell";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

const GOLD = "#E0A951";
const ACID = "#ccff00";
const BG = "#050505";

const COMPARE_KEYS = ["wait", "budget", "assets"] as const;

const FEATURE_KEYS = [
  { key: "product_ad", icon: Megaphone },
  { key: "autopilot", icon: Bot },
  { key: "visuals", icon: ImageIcon },
  { key: "calendar", icon: Calendar },
] as const;

const PRICING_FEATURES = [
  "2.500 Credits / Monat",
  "Unbegrenzte Workspaces",
  "Server-Priorität",
  "Alle 20+ KI-Tools",
  "Team-Zugang & Analytics",
] as const;

const HERO_CARDS = ["card1", "card2", "card3"] as const;

function GoldKicker({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-3 inline-block rounded-full border px-3 py-1 uppercase"
      style={{
        fontSize: 10,
        color: GOLD,
        letterSpacing: "0.14em",
        fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
        fontWeight: 700,
        borderColor: "rgba(224,169,81,0.35)",
        background: "rgba(224,169,81,0.08)",
      }}
    >
      {children}
    </p>
  );
}

function SectionHeading({
  children,
  size = "default",
}: {
  children: ReactNode;
  size?: "default" | "large";
}) {
  return (
    <h2
      className="text-center"
      style={{
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
        fontSize:
          size === "large"
            ? "clamp(2.25rem, 5vw, 56px)"
            : "clamp(2rem, 5vw, 48px)",
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
  large = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-lg font-bold no-underline transition-all duration-200 hover:brightness-110 ${large ? "min-h-[52px] px-8 py-3.5 text-base" : "min-h-[48px] px-6 py-3 text-sm"} ${className}`}
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

function GhostCta({
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
      className={`inline-flex min-h-[48px] items-center justify-center rounded-lg border px-6 py-3 text-sm font-semibold no-underline transition-all duration-200 hover:border-white/30 hover:bg-white/[0.04] ${className}`}
      style={{
        borderColor: "rgba(255,255,255,0.15)",
        color: "rgba(255,255,255,0.85)",
        fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
      }}
    >
      {children}
    </Link>
  );
}

function HeroFloatingCards() {
  const t = useTranslations("businessPage.hero");

  const offsets = [
    "md:absolute md:left-0 md:top-8 md:max-w-[240px]",
    "md:absolute md:right-0 md:top-24 md:max-w-[260px]",
    "md:absolute md:left-1/2 md:top-[55%] md:max-w-[250px] md:-translate-x-1/2",
  ] as const;

  const floatDelays = ["0s", "0.8s", "1.6s"] as const;

  return (
    <div className="relative mx-auto mt-12 min-h-[280px] w-full max-w-[520px] md:mt-0 md:max-w-none md:min-h-[340px]">
      {HERO_CARDS.map((key, i) => (
        <SpringReveal
          key={key}
          delay={i * 0.12}
          className={`${offsets[i]} mb-3 md:mb-0`}
        >
          <div
            className="animate-float-slow rounded-xl border p-4 shadow-lg"
            style={{
              borderColor: "rgba(224,169,81,0.45)",
              background: "rgba(13,13,15,0.92)",
              backdropFilter: "blur(8px)",
              animationDelay: floatDelays[i],
            }}
          >
          {key === "card1" ? (
            <div
              className="mb-3 h-16 w-full rounded-lg border border-white/[0.08]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(224,169,81,0.15) 0%, rgba(255,255,255,0.04) 100%)",
              }}
              aria-hidden
            />
          ) : null}
          <p
            className="text-sm font-semibold text-white"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            {t(key)}
          </p>
          </div>
        </SpringReveal>
      ))}
    </div>
  );
}

export function BusinessLandingPage() {
  const t = useTranslations("businessPage");
  const business = SUBSCRIPTION_PLANS.business;

  return (
    <StudioGlassShell className="landing-root overflow-x-clip">
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
        <div className="relative z-10 mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <SpringReveal>
              <div className="mb-5 flex justify-center lg:justify-start">
                <GoldKicker>{t("hero.kicker")}</GoldKicker>
              </div>
              <h1
                className="mb-5"
                style={{
                  fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                  fontSize: "clamp(2.75rem, 6vw, 72px)",
                  lineHeight: 0.95,
                  letterSpacing: "0.02em",
                  color: "#ffffff",
                }}
              >
                {t("hero.headline_line1")}
                <br />
                {t("hero.headline_line2")}
                <br />
                <span style={{ color: GOLD }}>{t("hero.headline_accent")}</span>
                {t("hero.headline_line3") ? (
                  <>
                    {" "}
                    {t("hero.headline_line3")}
                  </>
                ) : null}
              </h1>
              <p
                className="mx-auto mb-8 max-w-[52ch] text-base leading-relaxed lg:mx-0"
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
                }}
              >
                {t("hero.subline")}
              </p>
              <div className="flex flex-col flex-wrap justify-center gap-3 sm:flex-row lg:justify-start">
                <AcidCta href="/dashboard">{t("hero.cta_primary")}</AcidCta>
                <GhostCta href="/pricing">{t("hero.cta_secondary")}</GhostCta>
              </div>
            </SpringReveal>
          </div>
          <HeroFloatingCards />
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-t border-white/[0.06] px-[clamp(20px,6vw,64px)] py-16 md:py-20">
        <div className="mx-auto max-w-[1160px]">
          <SpringReveal>
            <SectionHeading>{t("compare.headline")}</SectionHeading>
          </SpringReveal>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5">
            {COMPARE_KEYS.map((key, i) => (
              <SpringReveal key={key} delay={i * 0.08}>
                <div className="flex h-full flex-col items-center studio-glass-card p-6 text-center">
                  <div className="mb-3 flex w-full flex-col items-center gap-3">
                    <span className="text-2xl" aria-hidden>
                      {t(`compare.${key}_pain_icon`)}
                    </span>
                    <p
                      className="text-base text-white/75"
                      style={{
                        fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
                      }}
                    >
                      {t(`compare.${key}_pain`)}
                    </p>
                  </div>

                  <div
                    className="my-4 flex h-8 w-8 items-center justify-center rounded-full border"
                    style={{
                      borderColor: "rgba(224,169,81,0.35)",
                      color: GOLD,
                    }}
                    aria-hidden
                  >
                    <ArrowRight size={16} />
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <span className="text-2xl" aria-hidden>
                      {t(`compare.${key}_solution_icon`)}
                    </span>
                    <p
                      className="text-lg font-semibold"
                      style={{
                        color: GOLD,
                        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {t(`compare.${key}_solution`)}
                    </p>
                  </div>
                </div>
              </SpringReveal>
            ))}
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
            <div className="mb-10 md:mb-12">
              <SectionHeading>{t("features.headline")}</SectionHeading>
            </div>
          </SpringReveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURE_KEYS.map(({ key, icon: Icon }, i) => (
              <SpringReveal key={key} delay={i * 0.07}>
                <article className="group flex h-full flex-col gap-3 studio-glass-card studio-glass-card--hover p-6 transition-all duration-300">
                  <div className="studio-glass-icon-wrap">
                    <Icon size={22} strokeWidth={2} color={ACID} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                      fontSize: "1.35rem",
                      color: "#ffffff",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {t(`features.${key}_title`)}
                  </h3>
                  <p
                    className="flex-1 text-sm leading-relaxed text-[#888888]"
                    style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
                  >
                    {t(`features.${key}_desc`)}
                  </p>
                  <span
                    className="inline-flex w-fit rounded-full border px-3 py-1 text-sm font-semibold tracking-wide"
                    style={{
                      borderColor: "rgba(224,169,81,0.25)",
                      background: "rgba(224,169,81,0.08)",
                      color: GOLD,
                      fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
                    }}
                  >
                    {t(`features.${key}_tag`)}
                  </span>
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
        <div className="mx-auto max-w-[560px] text-center">
          <SpringReveal>
            <div className="mb-8">
              <SectionHeading>{t("pricing.headline")}</SectionHeading>
            </div>

            <div className="relative studio-glass-card border-[#ccff00]/30 p-8 text-left md:p-10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#ccff00] px-4 py-1 text-xs font-semibold tracking-wide text-black">
                {t("pricing.badge")}
              </div>

              <p
                className="mb-1 text-xs font-semibold tracking-wide text-white"
                style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
              >
                {t("pricing.plan_name")}
              </p>
              <div className="mb-2 flex items-baseline gap-1">
                <span
                  style={{
                    fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
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
                  {t("pricing.per_month")}
                </span>
              </div>
              <p
                className="mb-6 text-sm text-[#888888]"
                style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
              >
                {t("pricing.subline")}
              </p>

              <ul className="mb-8 flex flex-col gap-2.5">
                {PRICING_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-white/90"
                    style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
                  >
                    <span className="text-[#ccff00]" aria-hidden>
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <AcidCta href="/dashboard" className="w-full">
                {t("pricing.cta")}
              </AcidCta>
            </div>

            <p
              className="mt-6 text-sm text-[#888888]"
              style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
            >
              {t("pricing.smaller_plans")}{" "}
              <Link
                href="/pricing"
                className="font-semibold no-underline transition-colors hover:text-white"
                style={{ color: GOLD }}
              >
                {t("pricing.pricing_link")}
              </Link>
            </p>
          </SpringReveal>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        className="border-y px-[clamp(20px,6vw,64px)] py-16 md:py-20"
        style={{
          background:
            "linear-gradient(135deg, #0a0a06 0%, #111108 50%, #0a0a06 100%)",
          borderColor: "rgba(224,169,81,0.2)",
        }}
        aria-labelledby="business-cta-heading"
      >
        <div className="mx-auto max-w-[720px] text-center">
          <SpringReveal>
            <h2
              id="business-cta-heading"
              className="mb-4"
              style={{
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                fontSize: "clamp(2.25rem, 5vw, 56px)",
                color: "#ffffff",
                letterSpacing: "0.02em",
                lineHeight: 1,
              }}
            >
              {t("cta.headline")}
            </h2>
            <p
              className="mx-auto mb-8 max-w-[42ch] text-base leading-relaxed"
              style={{
                color: "rgba(255,255,255,0.55)",
                fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
              }}
            >
              {t("cta.subline")}
            </p>
            <AcidCta href="/dashboard" large>
              {t("cta.button")}
            </AcidCta>
          </SpringReveal>
        </div>
      </section>

      <LandingFooter />
    </StudioGlassShell>
  );
}

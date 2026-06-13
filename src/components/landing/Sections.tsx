"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { PoweredByFooter } from "@/components/tenant-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { useSubscriptionCheckout } from "@/hooks/useSubscriptionCheckout";
import { getStarterPriceParams } from "@/lib/pricing";
import {
  LANDING_SECTION_CLASS,
  LANDING_SECTION_COMPACT_CLASS,
} from "./section-styles";
import { LANDING_FAQ_ITEMS } from "@/lib/landing-faq-items";

const STEP_KEYS = ["s1", "s2", "s3"] as const;

const FAQ_ITEMS = LANDING_FAQ_ITEMS;

const TRUST_SIGNAL_KEYS = ["trust_1", "trust_2", "trust_3", "trust_4"] as const;

/** Trust-Bar: ehrliche Signale statt abstrakter Feature-Ticker */
export function TrustBarSection() {
  const t = useTranslations("landingPage");
  const tProof = useTranslations("landingPage.proof");

  return (
    <div
      className="trust-bar overflow-x-hidden max-w-full border-y border-[var(--border)]"
      style={{ background: "var(--bg-1)" }}
      aria-label={tProof("trust_bar_label")}
    >
      <div className="mx-auto max-w-[1160px] px-[clamp(16px,5vw,64px)] py-3 md:py-3.5">
        <p className="mb-2 text-center text-[0.68rem] leading-snug text-white/45">
          {t("launchBanner")}
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[0.72rem] leading-snug text-white/68 sm:gap-x-4">
          {TRUST_SIGNAL_KEYS.map((key, i) => (
            <li key={key} className="flex items-center gap-3">
              {i > 0 && (
                <span
                  className="hidden h-1 w-1 shrink-0 rounded-full bg-white/25 sm:inline-block"
                  aria-hidden
                />
              )}
              <span>{tProof(key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** @deprecated Use TrustBarSection */
export function TickerStrip() {
  return <TrustBarSection />;
}

export function HowItWorksSection() {
  const t = useTranslations("landingPage.how");
  const locale = useLocale();
  const priceParams = getStarterPriceParams(locale);

  return (
    <section
      id="how"
      className={LANDING_SECTION_CLASS}
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto max-w-[1160px]">
        <SpringReveal>
          <span className="kicker mb-2 block">{t("kicker")}</span>
          <h2 className="landing-heading mb-8 text-[clamp(2rem,4.5vw,3.5rem)]">
            {t("headline1")}
            <br />
            <span className="acid-highlight">{t("headline2")}</span>
          </h2>
        </SpringReveal>
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
          {STEP_KEYS.map((key, i) => (
            <Fragment key={key}>
              <SpringReveal delay={i * 0.08} className="min-w-0 flex-1">
                <div className="glass-card h-full p-5 md:p-6">
                  <div
                    style={{
                      fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                      fontSize: "2rem",
                      color: "var(--acid)",
                      lineHeight: 1,
                      marginBottom: 12,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div
                    className="mb-1.5 text-base font-bold md:text-lg"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {t(`${key}_title`)}
                  </div>
                  <p
                    className="text-sm leading-[1.65]"
                    style={{ color: "var(--wd)" }}
                  >
                    {t(`${key}_desc`, key === "s1" ? priceParams : undefined)}
                  </p>
                </div>
              </SpringReveal>
              {i < STEP_KEYS.length - 1 && (
                <>
                  <div className="hidden w-8 shrink-0 items-center self-center px-0.5 md:flex">
                    <div className="laser-line" aria-hidden />
                  </div>
                  <div className="flex items-center justify-center py-0.5 md:hidden">
                    <div className="laser-line--vertical" aria-hidden />
                  </div>
                </>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const t = useTranslations("landingPage.faq");
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="px-[clamp(16px,5vw,64px)] py-12 md:py-16 lg:py-20"
      style={{ background: "#060608" }}
    >
      <div className="mx-auto max-w-[1160px]">
        <p
          className="mb-2 text-center uppercase"
          style={{
            fontSize: 10,
            color: "#B4FF00",
            letterSpacing: "0.14em",
            fontFamily: "var(--font-dm), sans-serif",
            fontWeight: 700,
          }}
        >
          FAQ
        </p>
        <h2
          className="mb-10 text-center md:mb-12"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(2rem, 5vw, 48px)",
            color: "#ffffff",
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          {t("headline")}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                style={{
                  background: isOpen
                    ? "rgba(180,255,0,0.04)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${
                    isOpen
                      ? "rgba(180,255,0,0.45)"
                      : "rgba(180,255,0,0.2)"
                  }`,
                  borderRadius: 4,
                  padding: 0,
                  transition: "border-color 0.2s ease, background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (isOpen) return;
                  e.currentTarget.style.borderColor = "rgba(180,255,0,0.35)";
                }}
                onMouseLeave={(e) => {
                  if (isOpen) return;
                  e.currentTarget.style.borderColor = "rgba(180,255,0,0.2)";
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{
                    padding: "18px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#ffffff",
                      fontFamily: "var(--font-dm), sans-serif",
                      lineHeight: 1.4,
                    }}
                  >
                    {t(item.q)}
                  </span>
                  <span
                    aria-hidden
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: "1px solid rgba(180,255,0,0.4)",
                      color: "#B4FF00",
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      lineHeight: 1,
                    }}
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? 500 : 0,
                    overflow: "hidden",
                    transition: "max-height 0.3s ease",
                  }}
                >
                  <p
                    style={{
                      padding: "0 20px 18px 20px",
                      margin: 0,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.7)",
                      lineHeight: 1.7,
                      fontFamily: "var(--font-dm), sans-serif",
                    }}
                  >
                    {item.a === "a3" ? (
                      <>
                        {t("a3")
                          .replace(/\s*Details:\s*\/?datenschutz\s*$/i, "")
                          .trim()}{" "}
                        <Link
                          href="/datenschutz"
                          className="text-[#B4FF00] no-underline hover:underline"
                        >
                          Datenschutz
                        </Link>
                      </>
                    ) : (
                      t(item.a)
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function PricingSection() {
  const t = useTranslations("landingPage.pricing");
  const tAgency = useTranslations("landingPage.agencyTeaser");
  const { loading, handleSubscribe } = useSubscriptionCheckout("/pricing");

  return (
    <section id="pricing" className="relative bg-transparent py-4 text-white">
      <div className="mx-auto max-w-[1200px] text-center">
        <SpringReveal>
          <span className="pricing-glass-kicker mb-2 block">{t("kicker")}</span>
          <h2 className="pricing-glass-title text-[clamp(2rem,4.5vw,3.75rem)]">
            {t("headline")}
          </h2>
        </SpringReveal>
        <PricingPlans
          checkoutMode
          onSubscribe={handleSubscribe}
          subscribeLoading={loading}
          className="mx-auto max-w-[1200px]"
        />
        <SpringReveal delay={0.08}>
          <div className="pricing-credits-info mx-auto mt-8 max-w-[720px] md:mt-10">
            <span className="pricing-credits-info__label">{t("credits_usage_kicker")}</span>
            <p className="pricing-credits-info__body mb-4">{t("credits_usage_desc")}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {(["credits_ex1", "credits_ex2", "credits_ex3", "credits_ex4", "credits_ex5"] as const).map(
                (key) => (
                  <span
                    key={key}
                    className="rounded-full border border-[#ccff00]/20 bg-[#ccff00]/8 px-3 py-1 font-mono text-[0.68rem] tracking-wide text-white/70"
                  >
                    {t(key)}
                  </span>
                )
              )}
            </div>
            <p
              className="mt-4 font-mono text-[0.72rem] tracking-wide text-white/40"
              style={{ fontFamily: "var(--font-dm), sans-serif" }}
            >
              {t("credits_demo_note")}
            </p>
          </div>
        </SpringReveal>
        <SpringReveal delay={0.1}>
          <div className="pricing-glass-card mx-auto mt-10 flex max-w-[960px] flex-col items-center justify-between gap-4 p-5 text-left md:mt-12 md:flex-row md:p-6">
            <div>
              <p className="pricing-glass-kicker mb-1">White Label</p>
              <h3 className="pricing-glass-title mb-1 text-xl md:text-2xl">
                {tAgency("headline")}
              </h3>
              <p
                className="text-sm text-white/65 md:text-[0.9rem]"
                style={{ fontFamily: "var(--font-dm), sans-serif" }}
              >
                {tAgency("subline")}
              </p>
            </div>
            <AcidMotionButton href="/agency" className="pricing-glass-btn-primary shrink-0 px-8">
              {tAgency("cta")}
            </AcidMotionButton>
          </div>
        </SpringReveal>
      </div>
    </section>
  );
}

function LandingPreFooterCta() {
  const t = useTranslations("landingPage.cta");
  const locale = useLocale();
  const priceParams = getStarterPriceParams(locale);

  return (
    <div
      className={`${LANDING_SECTION_COMPACT_CLASS} relative overflow-x-hidden max-w-full text-center`}
      style={{
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div
        className="pointer-events-none absolute"
        style={{
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 480,
          height: 480,
          background:
            "radial-gradient(circle, rgba(var(--ai-green-rgb), 0.06), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-[640px]">
        <span className="kicker mb-3 block">{t("kicker")}</span>
        <h2 className="landing-heading mb-3 text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.92]">
          {t("headline1")}
          <br />
          {t("headline2")}
          <br />
          <span className="acid-highlight">{t("headline3")}</span>
        </h2>
        <p
          className="mb-6 text-[0.9rem] leading-[1.65]"
          style={{ color: "var(--wd)" }}
        >
          {t("sub1")}
          <br />
          {t("sub2")}
        </p>
        <div className="flex flex-col flex-wrap justify-center gap-2.5 sm:flex-row">
          <AcidMotionButton href="/auth/sign-up" className="btn-acid justify-center">
            {t("primary", priceParams)}
          </AcidMotionButton>
          <a href="#brands" className="btn-ghost justify-center">
            {t("secondary")}
          </a>
        </div>
        <p className="mt-3 text-[0.75rem]" style={{ color: "var(--grey)" }}>
          {t("note", priceParams)}
        </p>
      </div>
    </div>
  );
}

const FOOTER_COLS = [
  {
    col: "product",
    links: ["product_pricing"],
  },
  {
    col: "company",
    links: ["company_blog", "company_guides", "company_business", "company_faq"],
  },
  {
    col: "legal",
    links: [
      "legal_imprint",
      "legal_privacy",
      "legal_terms",
      "legal_withdrawal",
      "legal_cookies",
    ],
  },
] as const;

const FOOTER_LINK_HREF: Partial<
  Record<(typeof FOOTER_COLS)[number]["links"][number], string>
> = {
  product_pricing: "/pricing",
  company_blog: "/blog",
  company_guides: "/guides",
  company_business: "/business",
  company_faq: "/faq",
  legal_imprint: "/impressum",
  legal_privacy: "/datenschutz",
  legal_terms: "/agb",
  legal_withdrawal: "/widerruf",
  legal_cookies: "/cookies",
};

const SUPPORT_EMAIL = "info@influexaicreator.com";

export function LandingFooter() {
  const t = useTranslations("footer");
  const tc = useTranslations("landingPage.footer_cols");

  return (
    <>
      <LandingPreFooterCta />
      <footer
        className="px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-8 md:px-6 md:pb-6 md:pt-12 lg:px-10"
        style={{
          background: "var(--bg-1)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto mb-8 grid max-w-[1160px] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-2 flex items-center gap-2 no-underline">
              <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[var(--accent,var(--ai-green))] text-sm leading-none text-[var(--bg-primary)] font-[family-name:var(--font-bebas)]">
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
            </Link>
            <p
              className="max-w-[210px] text-[0.83rem] leading-[1.65] text-[#888888]"
            >
              {t("tagline")}
            </p>
          </div>
          {FOOTER_COLS.map(({ col, links }) => (
            <div key={col}>
              <h5 className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#888888]">
                {tc(col)}
              </h5>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {links.map((link) => (
                  <a
                    key={link}
                    href={FOOTER_LINK_HREF[link] ?? "#"}
                    className="text-[0.84rem] text-[#888888] no-underline transition-colors duration-150 hover:text-white"
                  >
                    {tc(link)}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <div>
            <h5 className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#888888]">
              {t("partner")}
            </h5>
            <a
              href="/agency"
              className="text-[0.84rem] text-[#888888] no-underline transition-colors duration-150 hover:text-white"
            >
              {t("for_agencies")}
            </a>
            <div className="mt-3">
              <LanguageSwitcher compact />
            </div>
          </div>
        </div>
        <div
          className="mx-auto mb-6 max-w-[1160px] rounded-xl border px-4 py-3 sm:px-5"
          style={{
            borderColor: "var(--border)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <ul className="flex flex-col gap-1.5 text-[0.78rem] leading-relaxed text-[#888888] sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-1.5">
            <li>{t("trust.operated_from_germany")}</li>
            <li>{t("trust.secure_payments")}</li>
            <li>
              {t("trust.support")}{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-[#888888] no-underline transition-colors hover:text-white"
              >
                {SUPPORT_EMAIL}
              </a>
            </li>
            <li>{t("trust.cancel_anytime")}</li>
          </ul>
        </div>
        <PoweredByFooter />
        <div
          className="mx-auto flex max-w-[1160px] flex-col items-center gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="order-3 text-center text-[0.78rem] text-[#666666] sm:order-1 sm:text-left">
            © 2026 InfluexAI · Hechingen, DE
          </p>
          <div className="order-1 grid w-full max-w-xs grid-cols-2 gap-x-4 gap-y-2 sm:order-2 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center sm:gap-x-4 sm:gap-y-1">
            {[
              { href: "/datenschutz", label: "Datenschutz" },
              { href: "/impressum", label: "Impressum" },
              { href: "/agb", label: "AGB" },
              { href: "/widerruf", label: "Widerruf" },
              { href: "/faq", label: "FAQ" },
              { href: "/cookies", label: "Cookies" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[12px] text-[#888888] no-underline transition-colors duration-150 hover:text-white hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="order-2 flex gap-2 sm:order-3">
            {["𝕏", "in", "▶"].map((icon) => (
              <a
                key={icon}
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[0.8rem] text-[#888888] no-underline transition-all duration-150 hover:border-[color:rgba(var(--ai-blue-rgb),0.35)] hover:text-white"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}

/** @deprecated Merged into CreatorBrandTabsSection */
export function ForBrandsSection() {
  return null;
}

/** @deprecated Merged into CreatorBrandTabsSection */
export function FeaturesSection() {
  return null;
}

/** @deprecated Merged into PricingSection */
export function AgencyTeaserSection() {
  return null;
}

/** @deprecated Merged into LandingFooter */
export function CtaSection() {
  return null;
}

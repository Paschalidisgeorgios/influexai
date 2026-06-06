"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { LANDING_TOOL_EXAMPLES } from "@/lib/landing-tool-examples";
import { PoweredByFooter } from "@/components/tenant-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { LightFrame } from "@/components/LightFrame";
import { getStarterPriceParams } from "@/lib/pricing";

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
const STEP_KEYS = ["s1", "s2", "s3"] as const;
const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;

const BRAND_IMAGES = [
  "https://images.unsplash.com/photo-1503602642458-232111445657?w=500&q=80&fit=crop",
  "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=500&q=80&fit=crop",
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&q=80&fit=crop",
];

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
  const locale = useLocale();

  return (
    <section
      id="brands"
      className="world-brand py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "var(--bg-1)" }}
    >
      <div className="mx-auto w-full min-w-0 max-w-[1160px]">
        <div
          lang={locale}
          className="mb-14 grid w-full min-w-0 grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12"
        >
          <div className="min-w-0 max-w-full">
            <span className="kicker mb-2.5">{t("kicker")}</span>
            <span
              className="block"
              style={{
                width: 32,
                height: 2,
                background: "var(--accent, var(--acid))",
                borderRadius: 2,
                margin: "14px 0 20px",
              }}
            />
            <h2
              lang={locale}
              className="brand-section-headline landing-heading w-full min-w-0 max-w-full text-[clamp(2.25rem,5vw,4.5rem)] leading-[1.08] break-words hyphens-auto"
            >
              {t("headline1")}
              <br />
              {t("headline2")}
              <br />
              <span className="acid-highlight">{t("headline3")}</span>
            </h2>
          </div>
          <div className="min-w-0 max-w-full">
            <p
              className="mb-6 max-w-full"
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
                  <div className="min-w-0">
                    <div
                      className="mb-1 text-sm font-bold"
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
            <LightFrame
              key={key}
              className="img-card aspect-[3/4] rounded-[14px]"
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
                  style={{ color: "var(--accent, var(--acid))" }}
                >
                  {t(`${key}_cat`)}
                </div>
                <div
                  className="feat-card-title text-[0.82rem] leading-[1.3]"
                  style={{ letterSpacing: "0.08em" }}
                >
                  {t(`${key}_title`)}
                </div>
                <div className="feat-card-desc text-[0.68rem] mt-0.5">
                  {t(`${key}_sub`)}
                </div>
              </div>
            </LightFrame>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const t = useTranslations("landingPage.toolExamples");

  return (
    <section
      id="features"
      className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "#060608" }}
    >
      <div className="max-w-[1160px] mx-auto">
        <SpringReveal>
          <div className="flex items-end justify-between gap-8 mb-10 flex-wrap">
          <div>
            <span className="kicker mb-2.5">{t("kicker")}</span>
            <h2 className="landing-heading text-[clamp(2.5rem,5vw,5rem)]">
              {t("headline1")}
              <br />
              <span className="acid-highlight">{t("headline2")}</span>
            </h2>
          </div>
          <p
            className="max-w-[300px] text-right text-sm leading-[1.7] hidden sm:block"
            style={{ color: "var(--wd)" }}
          >
            {t("sidebar")}
          </p>
        </div>
        </SpringReveal>

        {/* Mobile / tablet: horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-[clamp(20px,6vw,64px)] px-[clamp(20px,6vw,64px)] lg:hidden [scrollbar-width:thin] [scrollbar-color:color-mix(in_srgb,var(--accent,#B4FF00)_20%,transparent)_transparent]">
          {LANDING_TOOL_EXAMPLES.map((tool, i) => (
            <SpringReveal key={tool.id} delay={(i % 4) * 0.1}>
            <Link
              href={tool.href}
              className="glass-card group flex-shrink-0 w-[min(78vw,280px)] snap-start flex flex-col overflow-hidden transition-all duration-300 hover:brightness-110"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={tool.image}
                  alt={t(`${tool.id}_title`)}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="280px"
                  loading="lazy"
                />
                <div className="absolute inset-0 tool-card-overlay" aria-hidden />
                <span
                  className="absolute top-3 left-3 text-[0.65rem] font-bold tracking-[0.12em] text-white/65"
                  style={{ fontFamily: "var(--font-dm), monospace" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="p-4 flex flex-col gap-1.5 flex-1">
                <h3 className="tool-card-name group-hover:text-[#caffb0] transition-colors">
                  {t(`${tool.id}_title`)}
                </h3>
                <p className="tool-card-desc">
                  {t(`${tool.id}_desc`)}
                </p>
              </div>
            </Link>
            </SpringReveal>
          ))}
        </div>

        {/* Desktop: masonry columns */}
        <div
          className="hidden lg:block columns-3 gap-4"
          style={{ columnFill: "balance" }}
        >
          {LANDING_TOOL_EXAMPLES.map((tool, i) => (
            <SpringReveal key={tool.id} delay={(i % 4) * 0.1}>
            <Link
              href={tool.href}
              className="glass-card group mb-4 break-inside-avoid flex flex-col overflow-hidden transition-all duration-300 hover:brightness-110"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={tool.image}
                  alt={t(`${tool.id}_title`)}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(min-width: 1024px) 33vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 tool-card-overlay" aria-hidden />
                <span
                  className="absolute top-3 left-3 text-[0.65rem] font-bold tracking-[0.12em] text-white/65"
                  style={{ fontFamily: "var(--font-dm), monospace" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="p-5 flex flex-col gap-2">
                <h3 className="tool-card-name group-hover:text-[#caffb0] transition-colors">
                  {t(`${tool.id}_title`)}
                </h3>
                <p className="tool-card-desc">
                  {t(`${tool.id}_desc`)}
                </p>
              </div>
            </Link>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const t = useTranslations("landingPage.how");
  const locale = useLocale();
  const priceParams = getStarterPriceParams(locale);

  return (
    <section
      id="how"
      className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-[1160px] mx-auto">
        <SpringReveal>
          <span className="kicker mb-2.5">{t("kicker")}</span>
          <h2 className="landing-heading text-[clamp(2.5rem,5vw,4rem)] mb-10">
            {t("headline1")}
            <br />
            <span className="acid-highlight">{t("headline2")}</span>
          </h2>
        </SpringReveal>
        <div className="flex flex-col md:flex-row md:items-stretch gap-4">
          {STEP_KEYS.map((key, i) => (
            <Fragment key={key}>
              <SpringReveal delay={i * 0.1} className="flex-1 min-w-0">
              <div className="glass-card p-7 h-full">
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
                {t(`${key}_desc`, key === "s1" ? priceParams : undefined)}
              </p>
              </div>
              </SpringReveal>
              {i < STEP_KEYS.length - 1 && (
                <>
                  <div className="hidden md:flex items-center self-center px-1 w-10 shrink-0">
                    <div className="laser-line" aria-hidden />
                  </div>
                  <div className="flex md:hidden items-center justify-center py-1">
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
  const locale = useLocale();
  const priceParams = getStarterPriceParams(locale);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-[720px] mx-auto">
        <span className="kicker mb-2.5 block text-center">{t("kicker")}</span>
        <h2 className="landing-heading text-[clamp(2.5rem,5vw,4rem)] leading-[0.95] text-center mb-10">
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
                  {t(`a${key.slice(1)}`, key === "q2" ? priceParams : undefined)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AgencyTeaserSection() {
  const t = useTranslations("landingPage.agencyTeaser");

  return (
    <section
      id="agency-teaser"
      className="py-14 px-[clamp(20px,6vw,64px)]"
      style={{ background: "var(--bg-1)" }}
    >
      <SpringReveal>
        <div className="glass-card max-w-[960px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-10 border-[color-mix(in_srgb,var(--accent,#B4FF00)_20%,transparent)]">
          <div>
            <p className="text-[var(--accent,#B4FF00)] text-xs font-bold uppercase tracking-[0.14em] mb-2">
              White Label
            </p>
            <h2 className="landing-heading text-2xl md:text-3xl mb-2">
              {t("headline")}
            </h2>
            <p className="text-white/80 text-sm md:text-base">{t("subline")}</p>
          </div>
          <AcidMotionButton href="/agency" className="btn-acid shrink-0 justify-center">
            {t("cta")}
          </AcidMotionButton>
        </div>
      </SpringReveal>
    </section>
  );
}

export function PricingSection() {
  const t = useTranslations("landingPage.pricing");

  return (
    <section
      id="pricing"
      className="py-[clamp(60px,8vw,100px)] px-[clamp(20px,6vw,64px)]"
      style={{ background: "var(--bg-1)" }}
    >
      <div className="max-w-[1200px] mx-auto text-center">
        <SpringReveal>
          <span className="kicker mb-2.5">{t("kicker")}</span>
          <h2 className="landing-heading text-[clamp(2.5rem,5vw,4.5rem)]">
            {t("headline")}
          </h2>
        </SpringReveal>
        <PricingPlans className="max-w-[1200px] mx-auto" />
      </div>
    </section>
  );
}

export function CtaSection() {
  const t = useTranslations("landingPage.cta");
  const locale = useLocale();
  const priceParams = getStarterPriceParams(locale);

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
        <h2 className="landing-heading text-[clamp(3rem,7vw,6rem)] leading-[0.92] mb-4">
          {t("headline1")}
          <br />
          {t("headline2")}
          <br />
          <span className="acid-highlight">{t("headline3")}</span>
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
          <AcidMotionButton href="/auth/sign-up" className="btn-acid justify-center">
            {t("primary", priceParams)}
          </AcidMotionButton>
          <a href="#brands" className="btn-ghost justify-center">
            {t("secondary")}
          </a>
        </div>
        <p className="mt-4 text-[0.78rem]" style={{ color: "var(--grey)" }}>
          {t("note", priceParams)}
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
      "company_guides",
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

const FOOTER_LINK_HREF: Partial<Record<(typeof FOOTER_COLS)[number]["links"][number], string>> = {
  company_blog: "/blog",
  company_guides: "/guides",
  legal_imprint: "/impressum",
  legal_privacy: "/datenschutz",
  legal_terms: "/agb",
};

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
            <div className="w-7 h-7 rounded-[7px] bg-[var(--accent,#B4FF00)] flex items-center justify-center text-[#060608] font-[family-name:var(--font-bebas)] text-sm leading-none">
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
                  href={FOOTER_LINK_HREF[link] ?? "#"}
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
            href="/agency"
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

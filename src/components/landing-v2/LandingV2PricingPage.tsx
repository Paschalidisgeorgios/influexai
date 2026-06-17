"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import "@/styles/landing-v2.css";

import type { LandingV2Mode } from "@/lib/landing-v2-config";
import { LANDING_V2_PRICING_COPY } from "@/lib/landing-v2-pricing-copy";
import { LandingV2ModeProvider, useLandingV2Links } from "./LandingV2ModeContext";
import { LandingV2PricingPlans } from "./sections/LandingV2PricingPlans";

const copy = LANDING_V2_PRICING_COPY;

function LandingV2PricingShell() {
  const links = useLandingV2Links();
  const modeClass =
    links.mode === "live" ? "landing-v2-root--live" : "landing-v2-root--preview";

  return (
    <div className={`landing-v2-root landing-v2-pricing-page min-h-screen overflow-x-clip ${modeClass}`}>
      {links.pricingPreviewBanner ? (
        <div className="landing-v2-preview-banner landing-v2-preview-banner--subtle" role="status">
          {links.pricingPreviewBanner}
        </div>
      ) : null}

      <header className="landing-v2-nav">
        <div className="landing-v2-nav__inner">
          <Link
            href={links.home}
            className="text-sm font-semibold tracking-tight text-[var(--lv2-text-light)]"
          >
            InfluexAI
          </Link>
          {links.pricingNavBack ? (
            <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
              <Link href={links.pricingNavBack.href} className="transition-colors hover:text-white">
                {links.pricingNavBack.label}
              </Link>
            </nav>
          ) : (
            <div className="hidden md:block" aria-hidden />
          )}
          <Link href={links.signup} className="landing-v2-btn-primary !px-4 !py-2 text-sm">
            {copy.nav.cta}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-v2-section landing-v2-pricing-hero" aria-labelledby="lv2-pricing-hero">
          <div className="mx-auto max-w-3xl text-center">
            <p className="landing-v2-kicker mb-4 justify-center">
              <span className="landing-v2-kicker__dot" aria-hidden />
              {copy.hero.eyebrow}
            </p>
            <h1
              id="lv2-pricing-hero"
              className="landing-v2-headline text-[clamp(2rem,5vw,3.5rem)] text-[var(--lv2-text-light)]"
            >
              {copy.hero.headline}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[clamp(1rem,2vw,1.125rem)] leading-relaxed text-white/58">
              {copy.hero.subline}
            </p>
          </div>
        </section>

        <section className="landing-v2-section landing-v2-pricing-plans-section" aria-label="Pläne">
          <div className="mx-auto max-w-[72rem]">
            <LandingV2PricingPlans checkoutRedirect={links.checkoutRedirect} />
          </div>
        </section>

        <section
          className="landing-v2-section landing-v2-pricing-credits"
          aria-labelledby="lv2-pricing-credits"
        >
          <div className="landing-v2-pricing-credits__panel landing-v2-ivory-stage mx-auto max-w-3xl px-6 py-8 text-center md:px-10 md:py-10">
            <h2
              id="lv2-pricing-credits"
              className="landing-v2-headline text-[clamp(1.35rem,3vw,1.85rem)] text-[var(--lv2-text-dark)]"
            >
              {copy.credits.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-[var(--lv2-text-muted)]">
              {copy.credits.body}
            </p>
          </div>
        </section>

        <section
          className="landing-v2-section landing-v2-pricing-faq"
          aria-labelledby="lv2-pricing-faq"
        >
          <div className="mx-auto max-w-3xl">
            <p className="landing-v2-kicker mb-4 justify-center">
              <span className="landing-v2-kicker__dot" aria-hidden />
              {copy.faq.eyebrow}
            </p>
            <h2 id="lv2-pricing-faq" className="sr-only">
              Hinweise zu Plänen und Credits
            </h2>
            <dl className="landing-v2-pricing-faq__list">
              {copy.faq.items.map((item) => (
                <div key={item.question} className="landing-v2-pricing-faq__item">
                  <dt className="landing-v2-pricing-faq__question">{item.question}</dt>
                  <dd className="landing-v2-pricing-faq__answer">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="landing-v2-section landing-v2-section--final-cta pb-24 pt-4">
          <div className="landing-v2-final-cta mx-auto max-w-4xl px-6 py-12 text-center md:px-12 md:py-14">
            <h2 className="landing-v2-headline landing-v2-final-cta__title text-[var(--lv2-text-light)]">
              {copy.finalCta.headline}
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={links.signup} className="landing-v2-btn-primary">
                {copy.finalCta.ctaPrimary}
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href={links.pricingFinalCtaSecondary.href} className="landing-v2-btn-secondary">
                {links.pricingFinalCtaSecondary.label}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] px-6 py-10 text-sm text-white/45">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <p>
            © {new Date().getFullYear()} InfluexAI
            {links.pricingFooterTagline ? ` — ${links.pricingFooterTagline}` : null}
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-4">
            {links.pricingFooterLinks.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white/70">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

type LandingV2PricingPageProps = {
  mode: LandingV2Mode;
};

export function LandingV2PricingPage({ mode }: LandingV2PricingPageProps) {
  return (
    <LandingV2ModeProvider mode={mode}>
      <LandingV2PricingShell />
    </LandingV2ModeProvider>
  );
}

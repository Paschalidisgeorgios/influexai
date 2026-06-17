"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import "@/styles/landing-v2.css";

import { LANDING_V2_PRICING_COPY } from "@/lib/landing-v2-pricing-copy";
import { LandingV2PricingPlans } from "./sections/LandingV2PricingPlans";

const copy = LANDING_V2_PRICING_COPY;

export function PricingPreviewPage() {
  return (
    <div className="landing-v2-root landing-v2-pricing-page min-h-screen overflow-x-clip">
      <div className="landing-v2-preview-banner landing-v2-preview-banner--subtle" role="status">
        {copy.previewBanner}
      </div>

      <header className="landing-v2-nav">
        <div className="landing-v2-nav__inner">
          <Link
            href="/design/landing-preview"
            className="text-sm font-semibold tracking-tight text-[var(--lv2-text-light)]"
          >
            InfluexAI
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
            <Link href="/design/landing-preview" className="transition-colors hover:text-white">
              {copy.nav.back}
            </Link>
          </nav>
          <Link href="/auth/sign-up" className="landing-v2-btn-primary !px-4 !py-2 text-sm">
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
            <LandingV2PricingPlans />
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
              <Link href="/auth/sign-up" className="landing-v2-btn-primary">
                {copy.finalCta.ctaPrimary}
                <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href="/design/landing-preview" className="landing-v2-btn-secondary">
                {copy.finalCta.ctaSecondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] px-6 py-10 text-sm text-white/45">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <p>© {new Date().getFullYear()} InfluexAI — Pricing Preview</p>
          <nav className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/design/landing-preview" className="hover:text-white/70">
              Landing Preview
            </Link>
            <Link href="/pricing" className="hover:text-white/70">
              Live-Preise
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

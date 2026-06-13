"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LandingNav } from "@/components/landing/LandingNav";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { CreditPacksSection } from "@/components/pricing/CreditPacksSection";
import { useSubscriptionCheckout } from "@/hooks/useSubscriptionCheckout";
import "@/styles/landing-glass.css";
import "@/styles/pricing-glass.css";

const INTENT_COPY: Record<
  string,
  {
    headline: string;
    subline: string;
    cta: string;
    accentColor: string;
  }
> = {
  visuals: {
    headline: "Starte dein KI-Visual-Studio",
    subline: "Flux Pro Qualität. Deutsch eingeben, KI optimiert automatisch.",
    cta: "Visual Studio starten",
    accentColor: "#00FF66",
  },
  "video-film": {
    headline: "Starte jetzt dein KI-Video-Studio",
    subline: "Seedance, Kling, Wan — alle Video-Modelle in einem Studio.",
    cta: "Video Studio starten",
    accentColor: "#0066FF",
  },
  "avatar-live": {
    headline: "Dein KI-Avatar ist bereit",
    subline: "Einmal trainiert, unbegrenzt nutzbar — in jedem Format und Style.",
    cta: "Avatar Studio starten",
    accentColor: "#9900FF",
  },
  "agent-autopilot": {
    headline: "Lass den Agenten arbeiten",
    subline: "Ein Briefing. Hooks, Skript, Visuals — vollautomatisch.",
    cta: "Autopilot aktivieren",
    accentColor: "#B4FF00",
  },
  audio: {
    headline: "Dein KI-Stimmen-Studio",
    subline: "Voice Clone, TTS und Voice Changer — alles in einem.",
    cta: "Voice Studio starten",
    accentColor: "#FF6B35",
  },
  werbung: {
    headline: "Professionelle Werbung ohne Agentur",
    subline: "Produktbilder, Ad-Copy und Kampagnen — vollautomatisch.",
    cta: "Ad Studio starten",
    accentColor: "#E0A951",
  },
};

function resolveCopy(intent: string | null, fallback: { headline: string; subline: string; cta: string }) {
  if (intent && INTENT_COPY[intent]) {
    return INTENT_COPY[intent];
  }
  return { ...fallback, accentColor: "#B4FF00" };
}

function PricingHeadlineText({ fallback }: { fallback: string }) {
  const params = useSearchParams();
  const copy = resolveCopy(params.get("intent"), { headline: fallback, subline: "", cta: "" });
  return <>{copy.headline}</>;
}

function PricingSublineText({ fallback }: { fallback: string }) {
  const params = useSearchParams();
  const copy = resolveCopy(params.get("intent"), { headline: "", subline: fallback, cta: "" });
  return <>{copy.subline}</>;
}

function PricingPrimaryCtaText({ fallback }: { fallback: string }) {
  const params = useSearchParams();
  const copy = resolveCopy(params.get("intent"), { headline: "", subline: "", cta: fallback });
  return <>{copy.cta}</>;
}

function PricingGlassBackground() {
  return (
    <div className="pricing-glass-bg" aria-hidden>
      <div className="landing-glass-dot-grid absolute inset-0" />
      <div className="pricing-glass-glow pricing-glass-glow--violet" />
      <div className="pricing-glass-glow pricing-glass-glow--cyan-green" />
      <div className="pricing-glass-vignette" />
    </div>
  );
}

export default function PricingPage() {
  const t = useTranslations("landingPage.pricing");
  const { loading, handleSubscribe } = useSubscriptionCheckout("/pricing");
  const headlineFallback = t("headline");
  const sublineFallback = t("page_subtitle");
  const ctaFallback = t("starter_cta");

  return (
    <div className="pricing-glass-page landing-root min-h-screen">
      <PricingGlassBackground />
      <LandingNav />
      <main className="px-[clamp(20px,6vw,64px)] pt-28 pb-20">
        <div className="mx-auto max-w-[1200px] text-center">
          <span className="pricing-glass-kicker">{t("kicker")}</span>
          <h1 className="pricing-glass-title mb-2 text-[clamp(2.5rem,5vw,4.5rem)]">
            <Suspense fallback={headlineFallback}>
              <PricingHeadlineText fallback={headlineFallback} />
            </Suspense>
          </h1>
          <p className="pricing-glass-subtitle mx-auto mb-8 max-w-xl text-[0.95rem]">
            <Suspense fallback={sublineFallback}>
              <PricingSublineText fallback={sublineFallback} />
            </Suspense>
          </p>

          <div className="pricing-credits-info">
            <span className="pricing-credits-info__label">{t("credit_outcome_title")}</span>
            <p className="pricing-credits-info__body">{t("credit_outcome_body")}</p>
          </div>

          <PricingPlans
            checkoutMode
            onSubscribe={handleSubscribe}
            subscribeLoading={loading}
            className="mx-auto max-w-[1200px]"
            primaryCtaLabel={
              <Suspense fallback={ctaFallback}>
                <PricingPrimaryCtaText fallback={ctaFallback} />
              </Suspense>
            }
          />
          <CreditPacksSection />
        </div>
      </main>
    </div>
  );
}

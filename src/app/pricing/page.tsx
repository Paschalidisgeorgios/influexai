"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LandingNav } from "@/components/landing/LandingNav";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { CreditPacksSection } from "@/components/pricing/CreditPacksSection";
import { MarketingShell } from "@/components/shared/influex";
import { useSubscriptionCheckout } from "@/hooks/useSubscriptionCheckout";

const INTENT_COPY: Record<
  string,
  {
    headline: string;
    subline: string;
    cta: string;
  }
> = {
  visuals: {
    headline: "Starte dein KI-Visual-Studio",
    subline: "Flux Pro Qualität. Deutsch eingeben, KI optimiert automatisch.",
    cta: "Visual Studio starten",
  },
  "video-film": {
    headline: "Starte jetzt dein KI-Video-Studio",
    subline: "Seedance, Kling, Wan — alle Video-Modelle in einem Studio.",
    cta: "Video Studio starten",
  },
  "avatar-live": {
    headline: "Dein KI-Avatar ist bereit",
    subline: "Einmal trainiert, unbegrenzt nutzbar — in jedem Format und Style.",
    cta: "Avatar Studio starten",
  },
  "agent-autopilot": {
    headline: "Lass den Agenten arbeiten",
    subline: "Ein Briefing. Hooks, Skript, Visuals — vollautomatisch.",
    cta: "Autopilot aktivieren",
  },
  audio: {
    headline: "Dein KI-Stimmen-Studio",
    subline: "Voice Clone, TTS und Voice Changer — alles in einem.",
    cta: "Voice Studio starten",
  },
  werbung: {
    headline: "Professionelle Werbung ohne Agentur",
    subline: "Produktbilder, Ad-Copy und Kampagnen — vollautomatisch.",
    cta: "Ad Studio starten",
  },
};

function resolveCopy(
  intent: string | null,
  fallback: { headline: string; subline: string; cta: string }
) {
  if (intent && INTENT_COPY[intent]) {
    return INTENT_COPY[intent];
  }
  return fallback;
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

export default function PricingPage() {
  const t = useTranslations("landingPage.pricing");
  const { loading, handleSubscribe } = useSubscriptionCheckout("/pricing");
  const headlineFallback = t("headline");
  const sublineFallback = t("page_subtitle");
  const ctaFallback = t("starter_cta");

  return (
    <MarketingShell
      toolbar={<LandingNav darkNav />}
      mainClassName="influex-pricing-page__main"
      containerClassName="influex-pricing-page__container"
    >
      <header className="influex-pricing-hero">
        <span className="influex-pricing-hero__kicker">{t("kicker")}</span>
        <h1 className="influex-pricing-hero__title">
          <Suspense fallback={headlineFallback}>
            <PricingHeadlineText fallback={headlineFallback} />
          </Suspense>
        </h1>
        <p className="influex-pricing-hero__subtitle">
          <Suspense fallback={sublineFallback}>
            <PricingSublineText fallback={sublineFallback} />
          </Suspense>
        </p>

        <div className="influex-pricing-credits-info">
          <span className="influex-pricing-credits-info__label">{t("credit_outcome_title")}</span>
          <p className="influex-pricing-credits-info__body">{t("credit_outcome_body")}</p>
        </div>
      </header>

      <PricingPlans
        variant="influex"
        checkoutMode
        onSubscribe={handleSubscribe}
        subscribeLoading={loading}
        primaryCtaLabel={
          <Suspense fallback={ctaFallback}>
            <PricingPrimaryCtaText fallback={ctaFallback} />
          </Suspense>
        }
      />

      <CreditPacksSection variant="influex" />
    </MarketingShell>
  );
}

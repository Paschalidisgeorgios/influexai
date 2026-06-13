"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LandingNav } from "@/components/landing/LandingNav";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { CreditPacksSection } from "@/components/pricing/CreditPacksSection";
import { useSubscriptionCheckout } from "@/hooks/useSubscriptionCheckout";

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

export default function PricingPage() {
  const t = useTranslations("landingPage.pricing");
  const { loading, handleSubscribe } = useSubscriptionCheckout("/pricing");
  const headlineFallback = t("headline");
  const sublineFallback = t("page_subtitle");
  const ctaFallback = t("creator_cta");

  return (
    <div className="min-h-screen bg-[#060608] text-[#F0EFE8] landing-root">
      <LandingNav />
      <main className="pt-28 pb-20 px-[clamp(20px,6vw,64px)]">
        <div className="max-w-[1200px] mx-auto text-center">
          <span className="kicker mb-2">{t("kicker")}</span>
          <h1 className="landing-heading mb-2 text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95]">
            <Suspense fallback={headlineFallback}>
              <PricingHeadlineText fallback={headlineFallback} />
            </Suspense>
          </h1>
          <p className="text-[0.95rem] max-w-xl mx-auto mb-4 text-white/80 subtitle">
            <Suspense fallback={sublineFallback}>
              <PricingSublineText fallback={sublineFallback} />
            </Suspense>
          </p>
          <div
            className="mx-auto mb-8 max-w-2xl rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left"
          >
            <p className="mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#B4FF00]">
              {t("credit_outcome_title")}
            </p>
            <p className="text-[0.88rem] leading-relaxed text-white/75">
              {t("credit_outcome_body")}
            </p>
          </div>
          <PricingPlans
            checkoutMode
            onSubscribe={handleSubscribe}
            subscribeLoading={loading}
            className="max-w-[1200px] mx-auto"
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

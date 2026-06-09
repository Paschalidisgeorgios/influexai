"use client";

import { useTranslations } from "next-intl";
import { LandingNav } from "@/components/landing/LandingNav";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { CreditPacksSection } from "@/components/pricing/CreditPacksSection";
import { useSubscriptionCheckout } from "@/hooks/useSubscriptionCheckout";

export default function PricingPage() {
  const t = useTranslations("landingPage.pricing");
  const { loading, handleSubscribe } = useSubscriptionCheckout("/pricing");

  return (
    <div className="min-h-screen bg-[#060608] text-[#F0EFE8] landing-root">
      <LandingNav />
      <main className="pt-28 pb-20 px-[clamp(20px,6vw,64px)]">
        <div className="max-w-[1200px] mx-auto text-center">
          <span className="kicker mb-2.5">{t("kicker")}</span>
          <h1 className="landing-heading mb-2 text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95]">
            {t("headline")}
          </h1>
          <p className="text-[0.95rem] max-w-xl mx-auto mb-4 text-white/80 subtitle">
            {t("page_subtitle")}
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
          />
          <CreditPacksSection />
        </div>
      </main>
    </div>
  );
}

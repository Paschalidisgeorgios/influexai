"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LandingNav } from "@/components/landing/LandingNav";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { CreditPacksSection } from "@/components/pricing/CreditPacksSection";
import {
  getClientStripePriceId,
  type BillingInterval,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans";

export default function PricingPage() {
  const t = useTranslations("landingPage.pricing");
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (
    plan: string,
    interval: BillingInterval,
    priceId?: string
  ) => {
    const key = `${plan}-${interval}`;
    setLoading(key);
    try {
      const resolvedPriceId =
        priceId ??
        getClientStripePriceId(
          plan as Exclude<SubscriptionPlanId, "free">,
          interval
        );

      const res = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          interval,
          priceId: resolvedPriceId,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (res.status === 401) {
        window.location.href = `/auth/sign-in?redirect=${encodeURIComponent("/pricing")}`;
      } else {
        alert(data.error ?? "Checkout fehlgeschlagen.");
      }
    } catch {
      alert("Fehler beim Checkout.");
    }
    setLoading(null);
  };

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

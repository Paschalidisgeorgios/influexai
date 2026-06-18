"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { InfluexBadge, InfluexButton, InfluexSurface } from "@/components/shared/influex";
import { CREDIT_PACKAGES, type CreditPackageId } from "@/lib/credit-packages";

function formatEur(amount: number): string {
  return amount.toFixed(amount < 1 ? 3 : 2).replace(".", ",");
}

type CreditPacksSectionProps = {
  variant?: "glass" | "influex";
};

export function CreditPacksSection({ variant = "glass" }: CreditPacksSectionProps) {
  const t = useTranslations("buyCredits");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const isInfluex = variant === "influex";

  const handleCheckout = async (packageId: CreditPackageId) => {
    setLoadingId(packageId);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (res.status === 401) {
        window.location.href = `/auth/sign-in?redirect=${encodeURIComponent("/pricing")}`;
      } else {
        alert(data.error ?? t("checkout_error"));
      }
    } catch {
      alert(t("checkout_error"));
    }
    setLoadingId(null);
  };

  if (isInfluex) {
    return (
      <section className="influex-pricing-credit-packs" aria-labelledby="influex-credit-packs-title">
        <div className="influex-pricing-credit-packs__header">
          <h2 id="influex-credit-packs-title" className="influex-pricing-credit-packs__title">
            {t("pricing_title")}
          </h2>
          <p className="influex-pricing-credit-packs__subtitle">{t("pricing_subtitle")}</p>
        </div>

        <div className="influex-pricing-credit-packs__grid">
          {CREDIT_PACKAGES.map((pkg) => {
            const isPopular = pkg.popular ?? false;
            return (
              <InfluexSurface
                key={pkg.id}
                as="article"
                variant={isPopular ? "elevated" : "default"}
                className={`influex-pricing-credit-pack ${
                  isPopular ? "influex-pricing-credit-pack--featured" : ""
                }`}
              >
                {isPopular ? (
                  <InfluexBadge tone="lime" className="influex-pricing-credit-pack__badge">
                    {t("popular_badge")}
                  </InfluexBadge>
                ) : null}

                <span className="influex-pricing-credit-pack__amount">{pkg.credits}</span>
                <span className="influex-pricing-credit-pack__label">Credits</span>
                <span className="influex-pricing-credit-pack__price">€{formatEur(pkg.priceEur)}</span>
                <span className="influex-pricing-credit-pack__rate">
                  {t("per_credit", { price: `€${formatEur(pkg.pricePerCredit)}` })}
                </span>

                <InfluexButton
                  type="button"
                  variant={isPopular ? "lime" : "secondary"}
                  className="influex-pricing-credit-pack__cta"
                  disabled={loadingId !== null}
                  loading={loadingId === pkg.id}
                  onClick={() => void handleCheckout(pkg.id)}
                >
                  {loadingId === pkg.id ? "…" : t("top_up_button", { count: pkg.credits })}
                </InfluexButton>
              </InfluexSurface>
            );
          })}
        </div>

        <p className="influex-pricing-credit-packs__footnote">{t("pricing_footnote")}</p>
      </section>
    );
  }

  return (
    <section className="mt-20 border-t border-zinc-800/50 pt-16">
      <div className="mb-10 text-center">
        <h2 className="pricing-glass-title mb-3 text-[clamp(1.75rem,3vw,2.5rem)] text-white">
          {t("pricing_title")}
        </h2>
        <p
          className="mx-auto max-w-lg text-sm text-white/60"
          style={{ fontFamily: "var(--font-dm), sans-serif" }}
        >
          {t("pricing_subtitle")}
        </p>
      </div>

      <div
        className="mx-auto grid max-w-5xl gap-4 px-0 sm:px-0"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 168px), 1fr))",
        }}
      >
        {CREDIT_PACKAGES.map((pkg) => {
          const isPopular = pkg.popular ?? false;
          return (
            <div
              key={pkg.id}
              data-testid="pricing-card"
              className={`pricing-glass-card relative flex flex-col p-6 ${
                isPopular ? "pricing-glass-card--featured" : ""
              }`}
            >
              {isPopular && (
                <span className="pricing-glass-badge">{t("popular_badge")}</span>
              )}

              <span
                className="text-4xl font-bold text-[#ccff00] leading-none mt-2"
                style={{ fontFamily: "var(--font-bebas), sans-serif" }}
              >
                {pkg.credits}
              </span>
              <span className="text-xs uppercase tracking-wider text-[rgba(255,255,255,0.65)] mb-3 font-bold">
                Credits
              </span>
              <span
                className="text-2xl font-bold text-[#F0EFE8]"
                style={{ fontFamily: "var(--font-bebas), sans-serif" }}
              >
                €{formatEur(pkg.priceEur)}
              </span>
              <span className="text-xs text-[rgba(255,255,255,0.65)] mb-5">
                {t("per_credit", { price: `€${formatEur(pkg.pricePerCredit)}` })}
              </span>

              <button
                type="button"
                disabled={loadingId !== null}
                onClick={() => void handleCheckout(pkg.id)}
                className={`mt-auto w-full min-h-[44px] rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${
                  isPopular
                    ? "pricing-glass-btn-primary"
                    : "pricing-glass-btn-secondary"
                }`}
              >
                {loadingId === pkg.id ? "…" : t("top_up_button", { count: pkg.credits })}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-white/55 max-w-2xl mx-auto leading-relaxed">
        {t("pricing_footnote")}
      </p>
    </section>
  );
}

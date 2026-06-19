"use client";

import { useTranslations } from "next-intl";
import { InfluexBadge, InfluexButton, InfluexSurface } from "@/components/shared/influex";
import { CHECKOUT_USER_MESSAGES } from "@/lib/checkout-messages";
import { CREDIT_PACKAGES, type CreditPackageId } from "@/lib/credit-packages";
import { useCreditPackCheckout } from "@/hooks/useCreditPackCheckout";
import { StripeTestModeNotice } from "@/components/pricing/StripeTestModeNotice";

function formatEur(amount: number): string {
  return amount.toFixed(amount < 1 ? 3 : 2).replace(".", ",");
}

type CreditPacksSectionProps = {
  variant?: "glass" | "influex";
};

export function CreditPacksSection({ variant = "glass" }: CreditPacksSectionProps) {
  const t = useTranslations("buyCredits");
  const { loadingId, error, checkout, clearError } = useCreditPackCheckout({
    redirectPath: "/pricing",
  });
  const isInfluex = variant === "influex";

  const handleCheckout = (packageId: CreditPackageId) => {
    void checkout(packageId);
  };

  const topUpFootnote = (
    <>
      {t("pricing_footnote")}{" "}
      <span className="opacity-90">{CHECKOUT_USER_MESSAGES.planRequired}</span>
    </>
  );

  if (isInfluex) {
    return (
      <section className="influex-pricing-credit-packs" aria-labelledby="influex-credit-packs-title">
        <StripeTestModeNotice variant="pricing" className="mb-6" />

        <div className="influex-pricing-credit-packs__header">
          <h2 id="influex-credit-packs-title" className="influex-pricing-credit-packs__title">
            {t("pricing_title")}
          </h2>
          <p className="influex-pricing-credit-packs__subtitle">{t("pricing_subtitle")}</p>
          <p className="influex-pricing-credit-packs__subtitle mt-2 text-sm opacity-80">
            Zusatz-Credits on top deines monatlichen Plan-Guthabens — kein neues Abo.
          </p>
        </div>

        {error ? (
          <p
            className="mb-4 rounded-[14px] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-950"
            data-testid="credit-checkout-error"
            role="alert"
          >
            {error}{" "}
            <button type="button" className="underline" onClick={clearError}>
              Schließen
            </button>
          </p>
        ) : null}

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
                data-testid="pricing-card"
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
                  onClick={() => handleCheckout(pkg.id)}
                >
                  {loadingId === pkg.id
                    ? CHECKOUT_USER_MESSAGES.loading
                    : CHECKOUT_USER_MESSAGES.buyCreditsCta}
                </InfluexButton>
              </InfluexSurface>
            );
          })}
        </div>

        <p className="influex-pricing-credit-packs__footnote">{topUpFootnote}</p>
      </section>
    );
  }

  return (
    <section className="mt-20 border-t border-zinc-800/50 pt-16">
      <StripeTestModeNotice
        variant="dashboard"
        className="mx-auto mb-8 max-w-2xl text-amber-100/90"
      />

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

      {error ? (
        <p className="mx-auto mb-4 max-w-lg text-center text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

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
                onClick={() => handleCheckout(pkg.id)}
                className={`mt-auto w-full min-h-[44px] rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${
                  isPopular
                    ? "pricing-glass-btn-primary"
                    : "pricing-glass-btn-secondary"
                }`}
              >
                {loadingId === pkg.id ? "…" : CHECKOUT_USER_MESSAGES.buyCreditsCta}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-white/55 max-w-2xl mx-auto leading-relaxed">
        {topUpFootnote}
      </p>
    </section>
  );
}

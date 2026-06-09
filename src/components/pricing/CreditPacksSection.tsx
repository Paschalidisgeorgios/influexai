"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CREDIT_PACKAGES, type CreditPackageId } from "@/lib/credit-packages";

function formatEur(amount: number): string {
  return amount.toFixed(amount < 1 ? 3 : 2).replace(".", ",");
}

export function CreditPacksSection() {
  const t = useTranslations("buyCredits");
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  return (
    <section className="mt-20 pt-16 border-t border-white/10">
      <div className="text-center mb-10">
        <h2
          className="text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-[#F0EFE8] mb-3"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          {t("pricing_title")}
        </h2>
        <p className="text-sm text-white/80 max-w-lg mx-auto">
          {t("pricing_subtitle")}
        </p>
      </div>

      <div
        className="grid gap-4 max-w-5xl mx-auto px-0 sm:px-0"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 168px), 1fr))",
        }}
      >
        {CREDIT_PACKAGES.map((pkg) => {
          const isPopular = pkg.popular ?? false;
          return (
            <motion.div
              key={pkg.id}
              data-testid="pricing-card"
              className="relative flex flex-col p-6 rounded-xl"
              style={{
                border: isPopular
                  ? "2px solid #B4FF00"
                  : "1px solid rgba(255,255,255,0.1)",
                background: isPopular
                  ? "rgba(180,255,0,0.04)"
                  : "#0f0f12",
              }}
              whileHover={{ scale: 1.02 }}
            >
              {isPopular && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[0.62rem] font-extrabold"
                  style={{ background: "#B4FF00", color: "#060608" }}
                >
                  {t("popular_badge")}
                </span>
              )}

              <span
                className="text-4xl font-bold text-[#B4FF00] leading-none mt-2"
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
                className="mt-auto w-full min-h-[44px] py-2.5 rounded-lg text-sm font-bold disabled:opacity-60"
                style={{
                  background: isPopular ? "#B4FF00" : "rgba(180,255,0,0.12)",
                  color: isPopular ? "#060608" : "#B4FF00",
                  border: "none",
                  cursor: loadingId ? "default" : "pointer",
                }}
              >
                {loadingId === pkg.id ? "…" : t("top_up_button", { count: pkg.credits })}
              </button>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-white/55 max-w-2xl mx-auto leading-relaxed">
        {t("pricing_footnote")}
      </p>
    </section>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MotionModal } from "@/components/ui/MotionModal";
import { AnimatedCredits } from "@/components/ui/AnimatedCredits";
import { CREDIT_PACKAGES, type CreditPackageId } from "@/lib/credit-packages";

type BuyCreditsModalProps = {
  open: boolean;
  onClose?: () => void;
  credits: number | null;
  /** When true, modal cannot be dismissed (0 credits). */
  forceOpen?: boolean;
};

function formatEur(amount: number): string {
  return amount.toFixed(amount < 1 ? 3 : 2).replace(".", ",");
}

export function BuyCreditsModal({
  open,
  onClose,
  credits,
  forceOpen = false,
}: BuyCreditsModalProps) {
  const t = useTranslations("buyCredits");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (packageId: CreditPackageId) => {
    setLoadingId(packageId);
    setError(null);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? t("checkout_error"));
    } catch {
      setError(t("checkout_error"));
    }
    setLoadingId(null);
  };

  const canClose = !forceOpen && onClose;

  return (
    <MotionModal
      open={open}
      onClose={canClose ? onClose : undefined}
      overlayClassName="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 bg-[#060608]/92"
      className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl bg-[#0f0f12] border border-[#B4FF00]/25 shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
    >
      <div className="text-center mb-6">
        <h2
          className="text-2xl sm:text-3xl font-bold text-[#F0EFE8] mb-2"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          {t("title")}
        </h2>
        {credits !== null && (
          <p className="text-sm text-[rgba(255,255,255,0.65)]">
            {t.rich("balance", {
              credits: () => (
                <AnimatedCredits
                  key={String(credits)}
                  value={credits}
                  style={{ color: "#B4FF00", fontWeight: 800 }}
                />
              ),
            })}
          </p>
        )}
        {forceOpen && (
          <p className="mt-2 text-sm font-semibold text-[#ff6b7a]">
            {t("force_open_hint")}
          </p>
        )}
      </div>

      <div
        className="grid gap-3 sm:gap-4"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        }}
      >
        {CREDIT_PACKAGES.map((pkg) => {
          const isPopular = pkg.popular ?? false;
          const isLoading = loadingId === pkg.id;

          return (
            <motion.button
              key={pkg.id}
              type="button"
              data-testid="pricing-card"
              disabled={loadingId !== null}
              onClick={() => void handleCheckout(pkg.id)}
              whileHover={loadingId ? {} : { scale: 1.02 }}
              whileTap={loadingId ? {} : { scale: 0.98 }}
              className="relative flex flex-col items-stretch text-left p-5 rounded-xl transition-colors disabled:opacity-70"
              style={{
                border: isPopular
                  ? "2px solid #B4FF00"
                  : "1px solid rgba(255,255,255,0.1)",
                background: isPopular
                  ? "rgba(180,255,0,0.05)"
                  : "#0a0a0d",
                cursor: loadingId !== null ? "default" : "pointer",
              }}
            >
              {isPopular && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[0.62rem] font-extrabold whitespace-nowrap"
                  style={{ background: "#B4FF00", color: "#060608" }}
                >
                  {t("popular_badge")}
                </span>
              )}

              <span
                className="text-3xl sm:text-4xl font-bold leading-none mt-2 mb-1"
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  color: "#B4FF00",
                }}
              >
                {pkg.credits}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[rgba(255,255,255,0.65)] mb-3">
                Credits
              </span>

              <span
                className="text-2xl font-bold text-[#F0EFE8] mb-1"
                style={{ fontFamily: "var(--font-bebas), sans-serif" }}
              >
                €{formatEur(pkg.priceEur)}
              </span>
              <span className="text-xs text-[rgba(255,255,255,0.65)] mb-4">
                {t("per_credit", { price: `€${formatEur(pkg.pricePerCredit)}` })}
              </span>

              <span
                className="mt-auto w-full text-center py-2.5 rounded-lg text-sm font-bold"
                style={{
                  background: isPopular ? "#B4FF00" : "rgba(180,255,0,0.12)",
                  color: isPopular ? "#060608" : "#B4FF00",
                }}
              >
                {isLoading ? "…" : t("top_up_button", { count: pkg.credits })}
              </span>
            </motion.button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-[#ff6b7a]">{error}</p>
      )}

      <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-[rgba(255,255,255,0.65)]">
        {[t("trust_instant"), t("trust_plan_required"), t("trust_no_expire")].map(
          (line) => (
            <span key={line} className="text-[#B4FF00]">
              ✓ {line}
            </span>
          )
        )}
      </div>

      {canClose && (
        <button
          type="button"
          onClick={onClose}
          className="block w-full mt-5 text-sm text-[rgba(255,255,255,0.65)] underline min-h-[44px]"
        >
          {t("close")}
        </button>
      )}
    </MotionModal>
  );
}

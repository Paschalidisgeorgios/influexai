"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { MotionModal } from "@/components/ui/MotionModal";
import { CREDIT_PACKAGES, getStripePriceIdForPackage } from "@/lib/credit-packages";

type Props = {
  open: boolean;
  onClose?: () => void;
  /** When true, modal cannot be dismissed (0 credits with active plan). */
  forceOpen?: boolean;
};

function formatEur(amount: number): string {
  return Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(".", ",");
}

function formatCentPerCredit(pricePerCredit: number): string {
  const cents = Math.round(pricePerCredit * 100);
  return String(cents);
}

export function NoCreditsModal({ open, onClose, forceOpen = false }: Props) {
  const t = useTranslations("noCredits");
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canClose = !forceOpen && onClose;

  const handleCheckout = async (priceId: string | undefined) => {
    if (!priceId) {
      setError(t("checkout_error"));
      return;
    }
    setLoadingPriceId(priceId);
    setError(null);
    try {
      const res = await fetch("/api/stripe/credits-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? t("checkout_error"));
    } catch {
      setError(t("checkout_error"));
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <MotionModal
      open={open}
      onClose={canClose ? onClose : undefined}
      overlayClassName="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 bg-[#060608]/92 backdrop-blur-sm"
      className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl bg-[#0f0f12] border border-[#B4FF00]/25 shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center gap-2 mb-3">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent,#B4FF00)]/15"
            aria-hidden
          >
            <Zap
              size={18}
              className="text-[var(--accent,#B4FF00)]"
              strokeWidth={2.5}
            />
          </span>
          <h2
            className="text-xl sm:text-2xl font-bold text-[#F0EFE8]"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            {t("title")}
          </h2>
        </div>
        <p className="text-sm text-white/70 leading-relaxed max-w-md mx-auto">
          {t("subtext")}
        </p>
        {forceOpen && (
          <p className="mt-2 text-sm font-semibold text-[#ff6b7a]">
            {t("force_hint")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {CREDIT_PACKAGES.map((pkg) => {
          const priceId = getStripePriceIdForPackage(pkg);
          const isLoading = loadingPriceId === priceId;
          const isPopular = pkg.popular ?? false;
          const isBest = pkg.bestValue ?? false;

          return (
            <div
              key={pkg.id}
              className="relative flex flex-col rounded-xl border p-4 sm:p-5 text-center"
              style={{
                borderColor: isPopular
                  ? "var(--accent, #B4FF00)"
                  : "rgba(255,255,255,0.1)",
                background: isPopular
                  ? "rgba(180,255,0,0.05)"
                  : "rgba(255,255,255,0.03)",
              }}
            >
              {isPopular && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[0.62rem] font-extrabold whitespace-nowrap"
                  style={{
                    background: "var(--accent, #B4FF00)",
                    color: "#060608",
                  }}
                >
                  {t("popular_badge")}
                </span>
              )}
              {isBest && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[0.62rem] font-extrabold whitespace-nowrap border border-white/15 bg-[#0f0f12] text-[#F0EFE8]"
                >
                  {t("best_deal_badge")}
                </span>
              )}

              <p
                className="mt-2 text-2xl sm:text-3xl font-bold text-[#F0EFE8]"
                style={{ fontFamily: "var(--font-bebas), sans-serif" }}
              >
                {pkg.credits}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2">
                Credits
              </p>
              <p
                className="text-xl font-bold text-[var(--accent,#B4FF00)] mb-1"
                style={{ fontFamily: "var(--font-bebas), sans-serif" }}
              >
                €{formatEur(pkg.priceEur)}
              </p>
              <p className="text-[11px] text-white/45 mb-4">
                {t("per_credit", {
                  cents: formatCentPerCredit(pkg.pricePerCredit),
                })}
              </p>

              <button
                type="button"
                disabled={loadingPriceId !== null}
                onClick={() => void handleCheckout(priceId)}
                className="mt-auto w-full py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                style={{
                  background: isPopular
                    ? "var(--accent, #B4FF00)"
                    : "rgba(180,255,0,0.12)",
                  color: isPopular ? "#060608" : "var(--accent, #B4FF00)",
                }}
              >
                {isLoading ? "…" : t("buy_button")}
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-[#ff6b7a]">{error}</p>
      )}

      <p className="mt-6 text-center text-xs text-white/45">
        {t("upgrade_hint")}{" "}
        <Link
          href="/pricing"
          className="text-white/55 underline underline-offset-2 hover:text-[var(--accent,#B4FF00)] transition-colors"
        >
          {t("upgrade_link")}
        </Link>
      </p>

      {canClose && (
        <button
          type="button"
          onClick={onClose}
          className="block w-full mt-4 text-sm text-white/45 hover:text-white/65 min-h-[44px]"
        >
          {t("close")}
        </button>
      )}
    </MotionModal>
  );
}

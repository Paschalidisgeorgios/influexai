"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, Zap } from "lucide-react";
import { MotionModal } from "@/components/ui/MotionModal";
import {
  CREDIT_PACKAGES,
  getPackageById,
  getStripePriceIdForPackage,
  recommendCreditPackageId,
  type CreditPackageId,
} from "@/lib/credit-packages";
import { YEARLY_DISCOUNT_PERCENT } from "@/lib/subscription-plans";

export type NoCreditsModalPlanInfo = {
  planName: string;
  monthlyCredits: number;
  hasSubscription: boolean;
  daysUntilRenewal?: number | null;
};

type Props = {
  open: boolean;
  onClose?: () => void;
  forceOpen?: boolean;
  required?: number;
  remaining?: number;
  initialView?: "prompt" | "packages";
  planInfo?: NoCreditsModalPlanInfo | null;
};

function formatEur(amount: number): string {
  return Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(".", ",");
}

function formatCentPerCredit(pricePerCredit: number): string {
  return String(Math.round(pricePerCredit * 100));
}

function CheckoutErrorBanner({
  onRetry,
  retryDisabled,
}: {
  onRetry: () => void;
  retryDisabled: boolean;
}) {
  const t = useTranslations("noCredits");

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-[#ff6b7a]/35 bg-[#ff6b7a]/10 px-4 py-3"
    >
      <p className="text-sm text-[#ff6b7a] leading-relaxed">
        {t("checkout_error_banner")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retryDisabled}
        className="mt-2.5 text-sm font-bold text-[#F0EFE8] underline underline-offset-2 hover:text-[var(--accent,#B4FF00)] transition-colors disabled:opacity-50"
      >
        {t("checkout_retry")}
      </button>
    </div>
  );
}

export function NoCreditsModal({
  open,
  onClose,
  forceOpen = false,
  required,
  remaining,
  initialView,
  planInfo,
}: Props) {
  const t = useTranslations("noCredits");
  const [view, setView] = useState<"prompt" | "packages">("prompt");
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [checkoutFailed, setCheckoutFailed] = useState(false);
  const [lastFailedPriceId, setLastFailedPriceId] = useState<string | undefined>();

  const canClose = !forceOpen && onClose;
  const resolvedRemaining =
    typeof remaining === "number" ? remaining : undefined;
  const resolvedRequired =
    typeof required === "number"
      ? required
      : typeof resolvedRemaining === "number"
        ? resolvedRemaining + 1
        : undefined;
  const missing =
    typeof resolvedRequired === "number" && typeof resolvedRemaining === "number"
      ? Math.max(0, resolvedRequired - resolvedRemaining)
      : undefined;
  const recommendedId: CreditPackageId =
    typeof missing === "number"
      ? recommendCreditPackageId(missing)
      : "extra_300";
  const recommendedPkg = getPackageById(recommendedId);

  useEffect(() => {
    if (!open) return;
    setCheckoutFailed(false);
    setLastFailedPriceId(undefined);
    setLoadingPriceId(null);
    setView(
      initialView ??
        (typeof required === "number" ? "prompt" : "packages")
    );
  }, [open, initialView, required]);

  const handleCheckout = async (priceId: string | undefined) => {
    if (loadingPriceId) return;

    if (!priceId) {
      setCheckoutFailed(true);
      setLastFailedPriceId(undefined);
      return;
    }

    setLoadingPriceId(priceId);
    setCheckoutFailed(false);
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
      setLastFailedPriceId(priceId);
      setCheckoutFailed(true);
    } catch {
      setLastFailedPriceId(priceId);
      setCheckoutFailed(true);
    } finally {
      setLoadingPriceId(null);
    }
  };

  const retryCheckout = () => {
    if (lastFailedPriceId) {
      void handleCheckout(lastFailedPriceId);
      return;
    }
    const fallback = getStripePriceIdForPackage(
      getPackageById(recommendedId) ?? CREDIT_PACKAGES[0]!
    );
    void handleCheckout(fallback);
  };

  const checkoutBusy = loadingPriceId !== null;

  const planFooter = planInfo ? (
    <div className="mt-5 space-y-1 text-center text-xs text-white/40">
      <p>
        {t("plan_footer", {
          plan: planInfo.planName,
          monthly: planInfo.monthlyCredits,
        })}
      </p>
      {planInfo.hasSubscription &&
        (typeof planInfo.daysUntilRenewal === "number" ? (
          <p>
            {t("renewal_days", { days: planInfo.daysUntilRenewal })}
          </p>
        ) : (
          <p>{t("renewal_monthly")}</p>
        ))}
    </div>
  ) : null;

  return (
    <MotionModal
      open={open}
      onClose={canClose ? onClose : undefined}
      overlayClassName="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 bg-[rgba(0,0,0,0.7)] backdrop-blur-[8px]"
      panelTransition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
      className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl bg-[#0f0f12] border border-[#B4FF00]/25 shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
    >
      {view === "prompt" ? (
        <>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent,#B4FF00)]/15"
                aria-hidden
              >
                <Zap
                  size={20}
                  className="text-[var(--accent,#B4FF00)]"
                  strokeWidth={2.5}
                />
              </span>
              <h2
                className="text-xl sm:text-2xl font-bold text-[#F0EFE8]"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                {t("insufficient_title")}
              </h2>
            </div>
            {typeof resolvedRequired === "number" &&
            typeof resolvedRemaining === "number" ? (
              <>
                <p className="text-sm text-white/70 leading-relaxed max-w-md mx-auto">
                  {t("insufficient_subtext", {
                    required: resolvedRequired,
                    remaining: resolvedRemaining,
                  })}
                </p>
                {typeof missing === "number" && missing > 0 && (
                  <p className="mt-2 text-sm font-semibold text-[var(--accent,#B4FF00)]">
                    {t("insufficient_missing", { missing })}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-white/70 leading-relaxed max-w-md mx-auto">
                {t("subtext")}
              </p>
            )}
            {forceOpen && (
              <p className="mt-2 text-sm font-semibold text-[#ff6b7a]">
                {t("force_hint")}
              </p>
            )}
            {recommendedPkg && typeof missing === "number" && (
              <p className="mt-4 text-xs text-white/50">
                {t("recommended_pack", {
                  credits: recommendedPkg.credits,
                  price: formatEur(recommendedPkg.priceEur),
                })}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setView("packages")}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "var(--accent, #B4FF00)",
                color: "#060608",
              }}
            >
              {t("buy_credits_primary")}
            </button>
            <Link
              href="/pricing"
              onClick={canClose ? onClose : undefined}
              className="flex flex-col items-center justify-center w-full py-3 px-4 rounded-xl text-sm font-bold border border-white/15 text-[#F0EFE8] hover:border-[var(--accent,#B4FF00)]/40 hover:bg-white/[0.03] transition-colors text-center"
            >
              {t("upgrade_plan_secondary")}
              <span className="mt-1 text-[11px] font-normal text-white/45">
                {t("upgrade_plan_hint", {
                  percent: YEARLY_DISCOUNT_PERCENT,
                })}
              </span>
            </Link>
          </div>

          {planFooter}

          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="block w-full mt-4 text-sm text-white/45 hover:text-white/65 min-h-[44px]"
            >
              {t("close")}
            </button>
          )}
        </>
      ) : (
        <>
          {typeof required === "number" && (
            <button
              type="button"
              onClick={() => setView("prompt")}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/75 transition-colors"
            >
              <ArrowLeft size={16} />
              {t("back")}
            </button>
          )}

          {checkoutFailed && (
            <CheckoutErrorBanner
              onRetry={retryCheckout}
              retryDisabled={checkoutBusy}
            />
          )}

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
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {CREDIT_PACKAGES.map((pkg) => {
              const priceId = getStripePriceIdForPackage(pkg);
              const isLoading = loadingPriceId === priceId;
              const isRecommended = pkg.id === recommendedId;
              const isPopular = (pkg.popular ?? false) && !isRecommended;
              const isBest = (pkg.bestValue ?? false) && !isRecommended;

              return (
                <div
                  key={pkg.id}
                  className="relative flex flex-col rounded-xl border p-4 sm:p-5 text-center"
                  style={{
                    borderColor: isRecommended
                      ? "var(--accent, #B4FF00)"
                      : isPopular
                        ? "var(--accent, #B4FF00)"
                        : "rgba(255,255,255,0.1)",
                    background: isRecommended
                      ? "rgba(180,255,0,0.08)"
                      : isPopular
                        ? "rgba(180,255,0,0.05)"
                        : "rgba(255,255,255,0.03)",
                    boxShadow: isRecommended
                      ? "0 0 0 1px color-mix(in srgb, var(--accent, #B4FF00) 35%, transparent)"
                      : undefined,
                  }}
                >
                  {isRecommended && (
                    <span
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[0.62rem] font-extrabold whitespace-nowrap max-w-[calc(100%-1rem)] truncate"
                      style={{
                        background: "var(--accent, #B4FF00)",
                        color: "#060608",
                      }}
                    >
                      {t("recommended_for_action")}
                    </span>
                  )}
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
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[0.62rem] font-extrabold whitespace-nowrap border border-white/15 bg-[#0f0f12] text-[#F0EFE8]">
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
                    disabled={checkoutBusy}
                    onClick={() => void handleCheckout(priceId)}
                    className="mt-auto w-full py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background:
                        isRecommended || isPopular
                          ? "var(--accent, #B4FF00)"
                          : "rgba(180,255,0,0.12)",
                      color:
                        isRecommended || isPopular
                          ? "#060608"
                          : "var(--accent, #B4FF00)",
                    }}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" aria-hidden />
                        {t("checkout_loading")}
                      </span>
                    ) : (
                      t("buy_button")
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-center text-xs text-white/45">
            {t("upgrade_hint")}{" "}
            <Link
              href="/pricing"
              className="text-white/55 underline underline-offset-2 hover:text-[var(--accent,#B4FF00)] transition-colors"
            >
              {t("upgrade_link")}
            </Link>
          </p>

          {planFooter}

          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="block w-full mt-4 text-sm text-white/45 hover:text-white/65 min-h-[44px]"
            >
              {t("close")}
            </button>
          )}
        </>
      )}
    </MotionModal>
  );
}

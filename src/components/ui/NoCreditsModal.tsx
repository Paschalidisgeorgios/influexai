"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, Zap } from "lucide-react";
import { MotionModal } from "@/components/ui/MotionModal";
import {
  CREDIT_PACKAGES,
  getPackageById,
  recommendCreditPackageId,
  type CreditPackage,
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

function CheckoutErrorBanner({
  onRetry,
  retryDisabled,
  message,
}: {
  onRetry: () => void;
  retryDisabled: boolean;
  message?: string | null;
}) {
  const t = useTranslations("noCredits");

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-[#ff6b7a]/35 bg-[#ff6b7a]/10 px-4 py-3"
    >
      <p className="text-sm text-[#ff6b7a] leading-relaxed">
        {message ?? t("checkout_error_banner")}
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
  const [selectedId, setSelectedId] = useState<CreditPackageId>("medium");
  const [loadingPackId, setLoadingPackId] = useState<CreditPackageId | null>(
    null
  );
  const [checkoutFailed, setCheckoutFailed] = useState(false);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState<
    string | null
  >(null);
  const [lastFailedPackId, setLastFailedPackId] = useState<
    CreditPackageId | undefined
  >();

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
      : "medium";
  const recommendedPkg = getPackageById(recommendedId);
  const selectedPack = getPackageById(selectedId);

  useEffect(() => {
    if (!open) return;
    setCheckoutFailed(false);
    setCheckoutErrorMessage(null);
    setLastFailedPackId(undefined);
    setLoadingPackId(null);
    setSelectedId(recommendedId);
    setView(
      initialView ??
        (typeof required === "number" ? "prompt" : "packages")
    );
  }, [open, initialView, required, recommendedId]);

  const handleCheckout = async (pack: CreditPackage) => {
    if (loadingPackId) return;

    setLoadingPackId(pack.id);
    setCheckoutFailed(false);
    setCheckoutErrorMessage(null);
    try {
      const res = await fetch("/api/stripe/credits-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pack.id }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setCheckoutErrorMessage(data.error ?? null);
      setLastFailedPackId(pack.id);
      setCheckoutFailed(true);
    } catch {
      setCheckoutErrorMessage(null);
      setLastFailedPackId(pack.id);
      setCheckoutFailed(true);
    } finally {
      setLoadingPackId(null);
    }
  };

  const retryCheckout = () => {
    const packId = lastFailedPackId ?? selectedId;
    const pack = getPackageById(packId) ?? CREDIT_PACKAGES[0]!;
    void handleCheckout(pack);
  };

  const checkoutBusy = loadingPackId !== null;

  if (!open) {
    return null;
  }

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
      overlayClassName="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 bg-[#060608]/92 backdrop-blur-[8px] pointer-events-auto"
      panelTransition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
      className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl bg-[#060608] border border-[rgba(180,255,0,0.2)] shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
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
                  price: formatEur(recommendedPkg.priceNumeric),
                })}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedId(recommendedId);
                setView("packages");
              }}
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
              message={checkoutErrorMessage}
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
            {CREDIT_PACKAGES.map((pack) => {
              const selected = selectedId === pack.id;

              return (
                <div
                  key={pack.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(pack.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(pack.id);
                    }
                  }}
                  style={{
                    border: selected
                      ? "2px solid #B4FF00"
                      : "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    padding: "16px",
                    cursor: "pointer",
                    background: selected
                      ? "rgba(180,255,0,0.06)"
                      : "rgba(255,255,255,0.03)",
                    position: "relative",
                    transition: "all 0.2s",
                  }}
                >
                  {pack.popular && (
                    <div
                      style={{
                        position: "absolute",
                        top: -10,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#B4FF00",
                        color: "#060608",
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 10px",
                        borderRadius: 20,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Beliebt
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {pack.label}
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: "#B4FF00",
                      lineHeight: 1,
                    }}
                  >
                    {pack.credits}
                    <span
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                        fontWeight: 400,
                        marginLeft: 4,
                      }}
                    >
                      Credits
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.6)",
                      marginTop: 6,
                    }}
                  >
                    {pack.price}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.35)",
                      marginTop: 2,
                    }}
                  >
                    {pack.description}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.25)",
                      marginTop: 4,
                    }}
                  >
                    {((pack.priceNumeric / pack.credits) * 100).toFixed(1)} ct /
                    Credit
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!selectedPack || checkoutBusy}
            onClick={() => {
              if (selectedPack) void handleCheckout(selectedPack);
            }}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 6,
              border: "none",
              background: selectedPack ? "#B4FF00" : "rgba(180,255,0,0.3)",
              color: "#060608",
              fontSize: 14,
              fontWeight: 800,
              cursor: selectedPack && !checkoutBusy ? "pointer" : "default",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginTop: 16,
              opacity: checkoutBusy ? 0.7 : 1,
            }}
          >
            {checkoutBusy ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" aria-hidden />
                {t("checkout_loading")}
              </span>
            ) : selectedPack ? (
              `Jetzt kaufen — ${selectedPack.price} — zahlungspflichtig`
            ) : (
              "Paket auswählen"
            )}
          </button>

          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
              textAlign: "center",
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            Einmalkauf · keine Abofalle · Credits verfallen nicht. MwSt.
            inklusive.{" "}
            <a
              href="/widerruf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "rgba(180,255,0,0.5)" }}
            >
              Widerrufsrecht
            </a>
          </p>

          <p className="mt-4 text-center text-xs text-white/45">
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

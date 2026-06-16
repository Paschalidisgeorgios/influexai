"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MotionModal } from "@/components/ui/MotionModal";
import {
  CREDIT_PACKAGES,
  getPackageById,
  recommendCreditPackageId,
  type CreditPackage,
  type CreditPackageId,
} from "@/lib/credit-packages";
import { YEARLY_DISCOUNT_PERCENT } from "@/lib/subscription-plans";
import { STUDIO_MUTED, STUDIO_RADIUS, STUDIO_TEXT } from "@/components/dashboard/studio-ui/tokens";

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

const STUDIO_ACCENT = "#b4ff00";
const STUDIO_INPUT = "#FFFCF7";

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
      className="mb-4 rounded-[14px] border px-4 py-3"
      style={{
        borderColor: "rgba(239,68,68,0.25)",
        background: "rgba(255,247,247,0.95)",
      }}
    >
      <p className="text-sm leading-relaxed" style={{ color: "#991b1b" }}>
        {message ?? t("checkout_error_banner")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retryDisabled}
        className="mt-2.5 text-sm font-semibold underline underline-offset-2 disabled:opacity-50"
        style={{ color: STUDIO_TEXT }}
      >
        {t("checkout_retry")}
      </button>
    </div>
  );
}

function PackCard({
  pack,
  selected,
  onSelect,
}: {
  pack: CreditPackage;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="pricing-card"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative flex min-w-0 flex-col rounded-[20px] border p-4 transition-colors ${
        pack.popular ? "pt-7" : ""
      }`}
      style={{
        background: "rgba(255,252,247,0.82)",
        borderColor: selected ? "rgba(180,255,0,0.35)" : "rgba(8,8,8,0.08)",
        boxShadow: selected ? "0 0 0 1px rgba(180,255,0,0.12)" : undefined,
        cursor: "pointer",
      }}
    >
      {pack.popular ? (
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-semibold"
          style={{
            borderColor: "rgba(180,255,0,0.35)",
            background: "rgba(180,255,0,0.12)",
            color: STUDIO_TEXT,
          }}
        >
          Empfohlen
        </span>
      ) : null}
      <p className="mb-1 text-xs font-medium" style={{ color: STUDIO_MUTED }}>
        {pack.label}
      </p>
      <p
        className="font-mono text-2xl font-bold tabular-nums leading-none"
        style={{ color: STUDIO_TEXT }}
      >
        {pack.credits}
        <span className="ml-1 text-xs font-normal" style={{ color: STUDIO_MUTED }}>
          Credits
        </span>
      </p>
      <p className="mt-2 text-sm font-medium" style={{ color: STUDIO_TEXT }}>
        {pack.price}
      </p>
      <p className="mt-1 text-xs" style={{ color: STUDIO_MUTED }}>
        {pack.description}
      </p>
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
  const [loadingPackId, setLoadingPackId] = useState<CreditPackageId | null>(null);
  const [checkoutFailed, setCheckoutFailed] = useState(false);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState<string | null>(null);
  const [lastFailedPackId, setLastFailedPackId] = useState<CreditPackageId | undefined>();

  const canClose = !forceOpen && onClose;
  const resolvedRemaining = typeof remaining === "number" ? remaining : undefined;
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
    typeof missing === "number" ? recommendCreditPackageId(missing) : "medium";
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
      initialView ?? (typeof required === "number" ? "prompt" : "packages")
    );
  }, [open, initialView, required, recommendedId]);

  const handleCheckout = async (pack: CreditPackage) => {
    if (loadingPackId) return;

    setLoadingPackId(pack.id);
    setCheckoutFailed(false);
    setCheckoutErrorMessage(null);
    try {
      const res = await fetch("/api/credits/checkout", {
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
    <div className="mt-5 space-y-1 text-center text-xs" style={{ color: STUDIO_MUTED }}>
      <p>
        {t("plan_footer", {
          plan: planInfo.planName,
          monthly: planInfo.monthlyCredits,
        })}
      </p>
      {planInfo.hasSubscription &&
        (typeof planInfo.daysUntilRenewal === "number" ? (
          <p>{t("renewal_days", { days: planInfo.daysUntilRenewal })}</p>
        ) : (
          <p>{t("renewal_monthly")}</p>
        ))}
    </div>
  ) : null;

  const primaryBtn = `inline-flex min-h-[44px] w-full items-center justify-center px-5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50 ${STUDIO_RADIUS.button}`;
  const secondaryBtn = `inline-flex min-h-[44px] w-full items-center justify-center border px-5 text-sm font-medium no-underline transition-colors hover:border-black/18 ${STUDIO_RADIUS.button}`;

  return (
    <MotionModal
      open={open}
      onClose={canClose ? onClose : undefined}
      overlayClassName="fixed inset-0 z-[250] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm sm:p-6 pointer-events-auto"
      panelTransition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
      className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[24px] border border-black/[0.08] bg-[#FAF6EE] p-6 shadow-[0_24px_64px_rgba(8,8,8,0.18)] sm:p-8"
    >
      {view === "prompt" ? (
        <>
          <div className="mb-6 text-center">
            <h2
              className="mb-2 text-xl font-bold tracking-tight sm:text-2xl"
              style={{ color: STUDIO_TEXT, letterSpacing: "-0.02em" }}
            >
              {t("insufficient_title")}
            </h2>
            {typeof resolvedRequired === "number" &&
            typeof resolvedRemaining === "number" ? (
              <>
                <p
                  className="mx-auto max-w-md text-sm leading-relaxed"
                  style={{ color: STUDIO_MUTED }}
                >
                  {t("insufficient_subtext", {
                    required: resolvedRequired,
                    remaining: resolvedRemaining,
                  })}
                </p>
                {typeof missing === "number" && missing > 0 ? (
                  <p className="mt-2 text-sm font-medium" style={{ color: STUDIO_TEXT }}>
                    {t("insufficient_missing", { missing })}
                  </p>
                ) : null}
              </>
            ) : (
              <p
                className="mx-auto max-w-md text-sm leading-relaxed"
                style={{ color: STUDIO_MUTED }}
              >
                {t("subtext")}
              </p>
            )}
            {forceOpen ? (
              <p className="mt-2 text-sm font-medium" style={{ color: "#991b1b" }}>
                {t("force_hint")}
              </p>
            ) : null}
            {recommendedPkg && typeof missing === "number" ? (
              <p className="mt-4 text-xs" style={{ color: STUDIO_MUTED }}>
                {t("recommended_pack", {
                  credits: recommendedPkg.credits,
                  price: formatEur(recommendedPkg.priceNumeric),
                })}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setSelectedId(recommendedId);
                setView("packages");
              }}
              className={primaryBtn}
              style={{ background: STUDIO_ACCENT, color: "#060608" }}
            >
              {t("buy_credits_primary")}
            </button>
            <Link
              href="/pricing"
              onClick={canClose ? onClose : undefined}
              className={`${secondaryBtn} flex-col py-3 text-center`}
              style={{
                borderColor: "rgba(8,8,8,0.10)",
                background: STUDIO_INPUT,
                color: STUDIO_TEXT,
              }}
            >
              {t("upgrade_plan_secondary")}
              <span className="mt-1 text-[11px] font-normal" style={{ color: STUDIO_MUTED }}>
                {t("upgrade_plan_hint", { percent: YEARLY_DISCOUNT_PERCENT })}
              </span>
            </Link>
          </div>

          {planFooter}

          {canClose ? (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 block min-h-[44px] w-full text-sm"
              style={{ color: STUDIO_MUTED }}
            >
              {t("close")}
            </button>
          ) : null}
        </>
      ) : (
        <>
          {typeof required === "number" ? (
            <button
              type="button"
              onClick={() => setView("prompt")}
              className="mb-4 inline-flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: STUDIO_MUTED }}
            >
              <ArrowLeft size={16} />
              {t("back")}
            </button>
          ) : null}

          {checkoutFailed ? (
            <CheckoutErrorBanner
              onRetry={retryCheckout}
              retryDisabled={checkoutBusy}
              message={checkoutErrorMessage}
            />
          ) : null}

          <div className="mb-6 text-center">
            <h2
              className="mb-2 text-xl font-bold tracking-tight sm:text-2xl"
              style={{ color: STUDIO_TEXT, letterSpacing: "-0.02em" }}
            >
              {t("title")}
            </h2>
            <p
              className="mx-auto max-w-md text-sm leading-relaxed"
              style={{ color: STUDIO_MUTED }}
            >
              {t("subtext")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 lg:grid-cols-4">
            {CREDIT_PACKAGES.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                selected={selectedId === pack.id}
                onSelect={() => setSelectedId(pack.id)}
              />
            ))}
          </div>

          <button
            type="button"
            disabled={!selectedPack || checkoutBusy}
            onClick={() => {
              if (selectedPack) void handleCheckout(selectedPack);
            }}
            className={`${primaryBtn} mt-4`}
            style={{
              background: selectedPack ? STUDIO_ACCENT : "rgba(8,8,8,0.08)",
              color: selectedPack ? "#060608" : STUDIO_MUTED,
            }}
          >
            {checkoutBusy ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" aria-hidden />
                {t("checkout_loading")}
              </span>
            ) : selectedPack ? (
              `Jetzt kaufen — ${selectedPack.price}`
            ) : (
              "Paket auswählen"
            )}
          </button>

          <p
            className="mt-3 text-center text-[11px] leading-relaxed"
            style={{ color: STUDIO_MUTED }}
          >
            Einmalkauf · Credits verfallen nicht · MwSt. inklusive.{" "}
            <a
              href="/widerruf"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
              style={{ color: STUDIO_TEXT }}
            >
              Widerrufsrecht
            </a>
          </p>

          <p className="mt-4 text-center text-xs" style={{ color: STUDIO_MUTED }}>
            {t("upgrade_hint")}{" "}
            <Link
              href="/pricing"
              className="font-medium underline underline-offset-2"
              style={{ color: STUDIO_TEXT }}
            >
              {t("upgrade_link")}
            </Link>
          </p>

          {planFooter}

          {canClose ? (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 block min-h-[44px] w-full text-sm"
              style={{ color: STUDIO_MUTED }}
            >
              {t("close")}
            </button>
          ) : null}
        </>
      )}
    </MotionModal>
  );
}

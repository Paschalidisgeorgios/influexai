"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2, X, Zap } from "lucide-react";
import {
  CREDIT_PACKAGES,
  formatBonusLabel,
  recommendCreditPackageId,
  type CreditPackage,
  type CreditPackageId,
} from "@/lib/credit-packages";
import { CANVAS_NEON_GREEN } from "@/lib/credit-packages-public";
import { useCredits } from "@/components/credits/BuyCreditsProvider";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

type CanvasTopUpOverlayProps = {
  open: boolean;
  required: number;
  remaining: number;
  toolLabel?: string;
  onClose: () => void;
  /** Called immediately after optimistic credit grant — receives new balance */
  onSuccess: (newBalance: number) => void;
};

type PaymentIntentPayload = {
  clientSecret: string;
  paymentIntentId: string;
  packageId: CreditPackageId;
};

function ExpressCheckoutBlock({
  clientSecret,
  paymentIntentId,
  creditsAmount,
  onAuthorized,
  onError,
}: {
  clientSecret: string;
  paymentIntentId: string;
  creditsAmount: number;
  onAuthorized: (newBalance: number) => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { addCreditsOptimistic, reconcilePaymentIntent } = useCredits();

  const handleConfirm = useCallback(async () => {
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      redirect: "if_required",
    });

    if (error) {
      onError(error.message ?? "Zahlung fehlgeschlagen");
      return;
    }

    const newBalance = addCreditsOptimistic(creditsAmount);
    onAuthorized(newBalance);

    void reconcilePaymentIntent(paymentIntentId, creditsAmount);
  }, [
    addCreditsOptimistic,
    clientSecret,
    creditsAmount,
    elements,
    onAuthorized,
    onError,
    paymentIntentId,
    reconcilePaymentIntent,
    stripe,
  ]);

  if (!stripePromise) return null;

  return (
    <div className="canvas-topup-express rounded-xl border border-zinc-800/80 bg-black/40 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
        Express Checkout
      </p>
      <ExpressCheckoutElement
        onConfirm={handleConfirm}
        options={{
          buttonTheme: {
            applePay: "white-outline",
            googlePay: "white",
          },
          buttonType: {
            applePay: "plain",
            googlePay: "plain",
          },
          layout: {
            maxColumns: 2,
            maxRows: 1,
            overflow: "auto",
          },
        }}
      />
    </div>
  );
}

function PackageCheckout({
  packageId,
  creditsAmount,
  onAuthorized,
  onError,
}: {
  packageId: CreditPackageId;
  creditsAmount: number;
  onAuthorized: (newBalance: number) => void;
  onError: (message: string) => void;
}) {
  const [intent, setIntent] = useState<PaymentIntentPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setIntent(null);

    void (async () => {
      try {
        const res = await fetch("/api/credits/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId }),
        });
        const data = (await res.json()) as PaymentIntentPayload & {
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Payment Intent fehlgeschlagen");
        if (!cancelled) setIntent(data);
      } catch (e) {
        if (!cancelled) {
          onError(e instanceof Error ? e.message : "Checkout konnte nicht geladen werden");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onError, packageId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-xs text-white/50">
        <Loader2 size={14} className="animate-spin" aria-hidden />
        Stripe wird vorbereitet…
      </div>
    );
  }

  if (!intent?.clientSecret || !stripePromise) {
    return (
      <p className="py-2 text-center text-xs text-white/45">
        Express Checkout nicht verfügbar — nutze den Bezahl-Button unten.
      </p>
    );
  }

  return (
    <Elements
      key={intent.clientSecret}
      stripe={stripePromise}
      options={{
        clientSecret: intent.clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: CANVAS_NEON_GREEN,
            colorBackground: "#050505",
            colorText: "#ffffff",
            borderRadius: "12px",
          },
        },
      }}
    >
      <ExpressCheckoutBlock
        clientSecret={intent.clientSecret}
        paymentIntentId={intent.paymentIntentId}
        creditsAmount={creditsAmount}
        onAuthorized={onAuthorized}
        onError={onError}
      />
    </Elements>
  );
}

function TopUpPackCard({
  pack,
  selected,
  onSelect,
}: {
  pack: CreditPackage;
  selected: boolean;
  onSelect: () => void;
}) {
  const bonusLabel = formatBonusLabel(pack.bonusCredits);
  const isBestPick = pack.id === "large";
  const isMaxValue = pack.id === "xl";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`canvas-topup-pack relative min-w-[148px] shrink-0 snap-center rounded-xl border px-3 py-3 text-left transition-all duration-300 md:min-w-0 ${
        selected
          ? "canvas-topup-pack--active"
          : "border-zinc-800/80 bg-white/[0.03] hover:border-zinc-700"
      } ${isBestPick ? "canvas-topup-pack--best" : ""}`}
      style={
        selected
          ? {
              borderColor: CANVAS_NEON_GREEN,
              boxShadow: `0 0 28px ${CANVAS_NEON_GREEN}28`,
              background: `${CANVAS_NEON_GREEN}0a`,
            }
          : isBestPick
            ? { boxShadow: `0 0 20px ${CANVAS_NEON_GREEN}18` }
            : undefined
      }
    >
      {pack.highlightBadge ? (
        <span
          className={`canvas-topup-badge absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[7px] font-extrabold uppercase tracking-wider ${
            isMaxValue ? "canvas-topup-badge--max" : "canvas-topup-badge--best-pick"
          }`}
        >
          {pack.highlightBadge}
        </span>
      ) : null}

      <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/55">
        {pack.label}
      </span>
      <span className="mt-1 block text-xs font-medium text-white/50">{pack.price}</span>
      <span className="mt-2 block text-[26px] font-black leading-none tracking-tight text-white">
        {pack.credits}
      </span>
      <span className="mt-0.5 block text-[10px] font-medium text-white/40">Credits</span>

      {bonusLabel ? (
        <span className="canvas-topup-bonus-badge mt-2 inline-block rounded-md px-1.5 py-0.5 text-[8px] font-bold leading-tight">
          {bonusLabel}
        </span>
      ) : (
        <span className="mt-2 block text-[8px] text-white/25">Basispreis</span>
      )}
    </button>
  );
}

function CanvasTopUpOverlayComponent({
  open,
  required,
  remaining,
  toolLabel,
  onClose,
  onSuccess,
}: CanvasTopUpOverlayProps) {
  const missing = Math.max(0, required - remaining);
  const recommendedId = recommendCreditPackageId(missing || 1);
  const [selectedId, setSelectedId] = useState<CreditPackageId>(recommendedId);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) setShown(true);
  }, [open]);

  const dismiss = useCallback(() => {
    setShown(false);
    window.setTimeout(() => onClose(), 280);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setSelectedId(recommendedId);
    setError(null);
  }, [open, recommendedId]);

  const selectedPack = useMemo(
    () => CREDIT_PACKAGES.find((p) => p.id === selectedId),
    [selectedId]
  );

  const handleAuthorized = useCallback(
    (newBalance: number) => {
      setShown(false);
      window.setTimeout(() => {
        onSuccess(newBalance);
      }, 280);
    },
    [onSuccess]
  );

  const handleRedirectCheckout = async (pack: CreditPackage) => {
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    setError(null);
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
      setError(data.error ?? "Checkout fehlgeschlagen");
    } catch {
      setError("Checkout fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {shown ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-20 flex max-h-full flex-col overflow-y-auto overflow-x-hidden rounded-2xl border border-zinc-800 bg-[#050505]/90 p-4 backdrop-blur-xl"
          role="dialog"
          aria-labelledby="canvas-topup-title"
          aria-modal="true"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <span
                className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `${CANVAS_NEON_GREEN}18` }}
              >
                <Zap size={16} style={{ color: CANVAS_NEON_GREEN }} />
              </span>
              <div>
                <h4
                  id="canvas-topup-title"
                  className="text-sm font-bold text-white"
                >
                  Credits aufladen
                </h4>
                <p className="mt-1 text-sm font-semibold leading-snug text-white">
                  Dir fehlen{" "}
                  <span style={{ color: CANVAS_NEON_GREEN }}>{missing}</span>{" "}
                  Credit{missing === 1 ? "" : "s"} für diese Generierung
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-white/55">
                  {toolLabel ? (
                    <>
                      <span className="text-white/70">{toolLabel}</span>
                      {" · "}
                    </>
                  ) : null}
                  {required} benötigt · {remaining} verfügbar
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg p-1.5 text-white/45 transition-colors hover:bg-white/5 hover:text-white/70"
              aria-label="Schließen"
            >
              <X size={14} />
            </button>
          </div>

          {error ? (
            <div
              role="alert"
              className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300"
            >
              {error}
            </div>
          ) : null}

          <div className="canvas-topup-pack-strip -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2 pt-1 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-4 md:gap-2 md:overflow-visible md:px-0 md:pb-0">
            {CREDIT_PACKAGES.map((pack) => (
              <TopUpPackCard
                key={pack.id}
                pack={pack}
                selected={pack.id === selectedId}
                onSelect={() => setSelectedId(pack.id)}
              />
            ))}
          </div>

          <div className="mt-3 min-h-[72px]">
            {selectedPack ? (
              <PackageCheckout
                packageId={selectedId}
                creditsAmount={selectedPack.credits}
                onAuthorized={handleAuthorized}
                onError={setError}
              />
            ) : null}
          </div>

          <button
            type="button"
            disabled={!selectedPack || checkoutLoading}
            onClick={() => {
              if (selectedPack) void handleRedirectCheckout(selectedPack);
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold uppercase tracking-wide text-black transition-transform hover:scale-[1.02] disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${CANVAS_NEON_GREEN}, #a8e600)`,
              boxShadow: `0 0 28px ${CANVAS_NEON_GREEN}33`,
            }}
          >
            {checkoutLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden />
                Weiterleitung…
              </>
            ) : selectedPack ? (
              `Jetzt kaufen · ${selectedPack.price}`
            ) : (
              "Paket wählen"
            )}
          </button>

          <p className="mt-2 text-center text-[9px] leading-relaxed text-white/40">
            Einmalkauf · Credits verfallen nicht · MwSt. inkl.
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export const CanvasTopUpOverlay = memo(CanvasTopUpOverlayComponent);

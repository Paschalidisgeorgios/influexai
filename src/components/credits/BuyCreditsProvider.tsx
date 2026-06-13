"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { hasActivePlan } from "@/lib/access";
import {
  NoCreditsModal,
  type NoCreditsModalPlanInfo,
} from "@/components/ui/NoCreditsModal";
import {
  isClientCreditExempt,
  onBuyCreditsRequest,
  openBuyCreditsModal,
  syncClientCreditExemptFromEmail,
  type NoCreditsModalDetail,
} from "@/lib/client-credits-ui";
import {
  getPlanDisplayName,
  getPlanMonthlyCredits,
} from "@/lib/subscription-plans";
import {
  broadcastCreditsBalance,
  broadcastCreditsRefresh,
  fetchPaymentIntentStatus,
  reconcilePaymentIntentBalance,
  waitMs,
} from "@/lib/credits-sync";
import { StudioCreditsToastHost } from "@/components/credits/StudioCreditsToast";
import type { StudioToastVariant } from "@/components/credits/StudioCreditsToast";

export type CreditsReconcileResult = {
  success: boolean;
  balance: number;
};

export type CreditsContextValue = {
  credits: number | null;
  verifiedCredits: number | null;
  isOptimistic: boolean;
  open: () => void;
  openBuyModal: () => void;
  addCreditsOptimistic: (amount: number) => number;
  rollbackOptimistic: () => void;
  confirmVerifiedBalance: (balance: number) => void;
  reconcilePaymentIntent: (
    paymentIntentId: string,
    amountAdded: number
  ) => Promise<CreditsReconcileResult>;
  refreshCredits: () => Promise<number | null>;
  showCreditsToast: (message: string, variant?: StudioToastVariant) => void;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

const FALLBACK_CREDITS: CreditsContextValue = {
  credits: null,
  verifiedCredits: null,
  isOptimistic: false,
  open: openBuyCreditsModal,
  openBuyModal: openBuyCreditsModal,
  addCreditsOptimistic: (amount) => amount,
  rollbackOptimistic: () => {},
  confirmVerifiedBalance: () => {},
  reconcilePaymentIntent: async () => ({ success: false, balance: 0 }),
  refreshCredits: async () => null,
  showCreditsToast: () => {},
};

export function useCredits(): CreditsContextValue {
  const ctx = useContext(CreditsContext);
  return ctx ?? FALLBACK_CREDITS;
}

/** @deprecated Alias — prefer `useCredits()` */
export function useBuyCredits(): CreditsContextValue {
  return useCredits();
}

function stripCheckoutQueryParams() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("credits");
  url.searchParams.delete("success");
  url.searchParams.delete("canceled");
  url.searchParams.delete("session_id");
  url.searchParams.delete("amount");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(null, "", next);
}

export function BuyCreditsProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("buyCredits");
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [credits, setCredits] = useState<number | null>(null);
  const [verifiedCredits, setVerifiedCredits] = useState<number | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  const [planName, setPlanName] = useState("Free");
  const [planMonthlyCredits, setPlanMonthlyCredits] = useState(0);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetail, setModalDetail] = useState<NoCreditsModalDetail | null>(
    null
  );
  const [toast, setToast] = useState<{
    message: string;
    variant: StudioToastVariant;
  } | null>(null);
  const processedCheckoutRef = useRef<string | null>(null);
  const optimisticBaselineRef = useRef<number | null>(null);

  const showCreditsToast = useCallback(
    (message: string, variant: StudioToastVariant = "success") => {
      setToast({ message, variant });
    },
    []
  );

  const loadProfile = useCallback(async (): Promise<number | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    syncClientCreditExemptFromEmail(user.email);

    const { data } = await supabase
      .from("profiles")
      .select("credits, plan, role, is_admin, stripe_subscription_id")
      .eq("id", user.id)
      .single();

    if (data) {
      const balance = data.credits ?? 0;
      setCredits(balance);
      setVerifiedCredits(balance);
      setIsOptimistic(false);
      optimisticBaselineRef.current = null;

      const active = hasActivePlan({
        plan: data.plan,
        role: data.role,
        is_admin: data.is_admin,
      });
      setHasPlan(active);
      setPlanName(getPlanDisplayName(data.plan));
      setPlanMonthlyCredits(getPlanMonthlyCredits(data.plan));
      setHasSubscription(Boolean(data.stripe_subscription_id));
      return balance;
    }

    return null;
  }, [supabase]);

  const confirmVerifiedBalance = useCallback((balance: number) => {
    setCredits(balance);
    setVerifiedCredits(balance);
    setIsOptimistic(false);
    optimisticBaselineRef.current = null;
    broadcastCreditsBalance(balance);
    broadcastCreditsRefresh();
  }, []);

  const addCreditsOptimistic = useCallback(
    (amount: number): number => {
      const current = credits ?? verifiedCredits ?? 0;
      if (optimisticBaselineRef.current === null) {
        optimisticBaselineRef.current = current;
      }
      const nextBalance = current + amount;
      setCredits(nextBalance);
      setIsOptimistic(true);
      broadcastCreditsBalance(nextBalance);
      return nextBalance;
    },
    [credits, verifiedCredits]
  );

  const rollbackOptimistic = useCallback(() => {
    const baseline = optimisticBaselineRef.current;
    if (typeof baseline === "number") {
      setCredits(baseline);
      setVerifiedCredits(baseline);
      broadcastCreditsBalance(baseline);
    }
    optimisticBaselineRef.current = null;
    setIsOptimistic(false);
  }, []);

  const refreshCredits = useCallback(async () => {
    const balance = await loadProfile();
    if (typeof balance === "number") {
      broadcastCreditsBalance(balance);
      broadcastCreditsRefresh();
    }
    return balance;
  }, [loadProfile]);

  const reconcilePaymentIntent = useCallback(
    async (
      paymentIntentId: string,
      amountAdded: number
    ): Promise<CreditsReconcileResult> => {
      const baseline =
        optimisticBaselineRef.current ?? verifiedCredits ?? credits ?? 0;

      const result = await reconcilePaymentIntentBalance(paymentIntentId);

      if (result?.paid && typeof result.balance === "number") {
        confirmVerifiedBalance(result.balance);
        showCreditsToast(
          `Zahlung erfolgreich! +${amountAdded} Credits gutgeschrieben`,
          "success"
        );
        return { success: true, balance: result.balance };
      }

      if (
        result?.status === "canceled" ||
        result?.status === "requires_payment_method"
      ) {
        rollbackOptimistic();
        showCreditsToast(
          "Zahlung fehlgeschlagen. Dein Kontostand wurde zurückgesetzt.",
          "error"
        );
        return { success: false, balance: baseline };
      }

      const refreshed = await loadProfile();
      if (
        typeof refreshed === "number" &&
        refreshed >= baseline + amountAdded
      ) {
        confirmVerifiedBalance(refreshed);
        showCreditsToast(
          `Zahlung erfolgreich! +${amountAdded} Credits gutgeschrieben`,
          "success"
        );
        return { success: true, balance: refreshed };
      }

      try {
        const last = await fetchPaymentIntentStatus(paymentIntentId);
        if (last.paid && typeof last.balance === "number") {
          confirmVerifiedBalance(last.balance);
          showCreditsToast(
            `Zahlung erfolgreich! +${amountAdded} Credits gutgeschrieben`,
            "success"
          );
          return { success: true, balance: last.balance };
        }
      } catch {
        /* ignore */
      }

      rollbackOptimistic();
      showCreditsToast(
        "Zahlung konnte nicht bestätigt werden. Bitte prüfe deinen Kontostand.",
        "error"
      );
      return { success: false, balance: baseline };
    },
    [
      confirmVerifiedBalance,
      credits,
      loadProfile,
      rollbackOptimistic,
      showCreditsToast,
      verifiedCredits,
    ]
  );

  useEffect(() => {
    void loadProfile();
    const onUpdate = () => void loadProfile();
    const onOptimistic = (e: Event) => {
      const v = (e as CustomEvent<number | null>).detail;
      if (typeof v === "number") {
        setCredits(v);
      } else {
        void loadProfile();
      }
    };
    window.addEventListener("credits-updated", onUpdate);
    window.addEventListener("optimistic-credits", onOptimistic);
    return () => {
      window.removeEventListener("credits-updated", onUpdate);
      window.removeEventListener("optimistic-credits", onOptimistic);
    };
  }, [loadProfile]);

  const openModal = useCallback((opts?: { detail?: NoCreditsModalDetail }) => {
    if (opts?.detail) setModalDetail(opts.detail);
    else setModalDetail({ showPackages: true });
    setModalOpen(true);
  }, []);

  const openBuyModal = useCallback(() => {
    if (!hasPlan && !isClientCreditExempt()) {
      window.location.assign("/pricing");
      return;
    }
    openModal({ detail: { showPackages: true } });
  }, [hasPlan, openModal]);

  useEffect(() => {
    return onBuyCreditsRequest((detail) => {
      if (isClientCreditExempt()) return;
      if (!hasPlan) {
        window.location.assign("/pricing");
        return;
      }
      openModal({ detail });
    });
  }, [openModal, hasPlan]);

  const refreshCreditsAfterCheckout = useCallback(
    async (sessionId: string | null, optimisticAmount?: number) => {
      if (typeof optimisticAmount === "number" && optimisticAmount > 0) {
        addCreditsOptimistic(optimisticAmount);
      }

      if (sessionId) {
        for (let attempt = 0; attempt < 8; attempt++) {
          try {
            const res = await fetch(
              `/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`
            );
            const data = (await res.json()) as {
              balance?: number;
              paymentStatus?: string;
              creditsAdded?: number;
            };
            if (typeof data.balance === "number") {
              broadcastCreditsBalance(data.balance);
            }
            if (data.paymentStatus === "paid") {
              if (typeof data.balance === "number") {
                confirmVerifiedBalance(data.balance);
                if (typeof data.creditsAdded === "number" && data.creditsAdded > 0) {
                  showCreditsToast(
                    `Zahlung erfolgreich! +${data.creditsAdded} Credits gutgeschrieben`,
                    "success"
                  );
                }
              } else {
                await loadProfile();
                broadcastCreditsRefresh();
              }
              return;
            }
          } catch {
            /* webhook may still be processing */
          }
          await waitMs(750);
        }
      }

      await loadProfile();
      broadcastCreditsRefresh();
    },
    [
      addCreditsOptimistic,
      confirmVerifiedBalance,
      loadProfile,
      showCreditsToast,
    ]
  );

  useEffect(() => {
    const status = searchParams.get("credits");
    if (status !== "success") return;

    const sessionId = searchParams.get("session_id");
    const dedupeKey = sessionId ?? "credits-success";
    if (processedCheckoutRef.current === dedupeKey) return;
    processedCheckoutRef.current = dedupeKey;

    stripCheckoutQueryParams();
    setModalOpen(false);
    setModalDetail(null);

    void refreshCreditsAfterCheckout(sessionId);
  }, [searchParams, refreshCreditsAfterCheckout]);

  useEffect(() => {
    if (searchParams.get("success") !== "true") return;
    if (processedCheckoutRef.current === "success-true") return;
    processedCheckoutRef.current = "success-true";

    const sessionId = searchParams.get("session_id");
    const amountParam = searchParams.get("amount");
    const optimisticAmount = amountParam
      ? Number.parseInt(amountParam, 10)
      : undefined;

    stripCheckoutQueryParams();
    setModalOpen(false);
    setModalDetail(null);

    void refreshCreditsAfterCheckout(sessionId, optimisticAmount);
  }, [searchParams, refreshCreditsAfterCheckout]);

  const handleClose = () => {
    setModalOpen(false);
    setModalDetail(null);
  };

  const planInfo: NoCreditsModalPlanInfo | null = hasPlan
    ? {
        planName,
        monthlyCredits: planMonthlyCredits,
        hasSubscription,
      }
    : null;

  const contextValue: CreditsContextValue = {
    credits,
    verifiedCredits,
    isOptimistic,
    open: openBuyModal,
    openBuyModal,
    addCreditsOptimistic,
    rollbackOptimistic,
    confirmVerifiedBalance,
    reconcilePaymentIntent,
    refreshCredits,
    showCreditsToast,
  };

  return (
    <CreditsContext.Provider value={contextValue}>
      {children}
      {modalOpen ? (
        <NoCreditsModal
          open
          onClose={handleClose}
          required={modalDetail?.required}
          remaining={
            modalDetail?.remaining ??
            (typeof credits === "number" ? credits : undefined)
          }
          initialView={
            modalDetail?.showPackages
              ? "packages"
              : typeof modalDetail?.required === "number"
                ? "prompt"
                : undefined
          }
          planInfo={planInfo}
        />
      ) : null}
      <StudioCreditsToastHost toast={toast} onClear={() => setToast(null)} />
    </CreditsContext.Provider>
  );
}

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

type BuyCreditsContextValue = {
  open: () => void;
  openBuyModal: () => void;
  credits: number | null;
};

const BuyCreditsContext = createContext<BuyCreditsContextValue | null>(null);

export function useBuyCredits() {
  const ctx = useContext(BuyCreditsContext);
  if (!ctx) {
    return {
      open: openBuyCreditsModal,
      openBuyModal: openBuyCreditsModal,
      credits: null as number | null,
    };
  }
  return ctx;
}

function CreditsToast({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3.5 rounded-xl font-bold text-sm shadow-lg"
      style={{
        background: "var(--accent, #B4FF00)",
        color: "#060608",
        boxShadow:
          "0 8px 32px color-mix(in srgb, var(--accent, #B4FF00) 35%, transparent)",
      }}
    >
      {message}
    </div>
  );
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

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function BuyCreditsProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("buyCredits");
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [credits, setCredits] = useState<number | null>(null);
  const [hasPlan, setHasPlan] = useState(false);
  const [planName, setPlanName] = useState("Free");
  const [planMonthlyCredits, setPlanMonthlyCredits] = useState(0);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetail, setModalDetail] = useState<NoCreditsModalDetail | null>(
    null
  );
  const [toast, setToast] = useState<string | null>(null);
  const processedCheckoutRef = useRef<string | null>(null);

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    syncClientCreditExemptFromEmail(user.email);

    const { data } = await supabase
      .from("profiles")
      .select("credits, plan, role, is_admin, stripe_subscription_id")
      .eq("id", user.id)
      .single();

    if (data) {
      setCredits(data.credits ?? 0);
      const active = hasActivePlan({
        plan: data.plan,
        role: data.role,
        is_admin: data.is_admin,
      });
      setHasPlan(active);
      setPlanName(getPlanDisplayName(data.plan));
      setPlanMonthlyCredits(getPlanMonthlyCredits(data.plan));
      setHasSubscription(Boolean(data.stripe_subscription_id));
    }
  }, [supabase]);

  useEffect(() => {
    void loadProfile();
    const onUpdate = () => void loadProfile();
    const onOptimistic = (e: Event) => {
      const v = (e as CustomEvent<number | null>).detail;
      if (typeof v === "number") setCredits(v);
      else void loadProfile();
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
    async (sessionId: string | null) => {
      if (sessionId) {
        for (let attempt = 0; attempt < 8; attempt++) {
          try {
            const res = await fetch(
              `/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`
            );
            const data = (await res.json()) as {
              balance?: number;
              paymentStatus?: string;
            };
            if (typeof data.balance === "number") {
              window.dispatchEvent(
                new CustomEvent("optimistic-credits", { detail: data.balance })
              );
            }
            if (data.paymentStatus === "paid") {
              await loadProfile();
              window.dispatchEvent(new Event("credits-updated"));
              return;
            }
          } catch {
            /* webhook may still be processing */
          }
          await wait(750);
        }
      }

      await loadProfile();
      window.dispatchEvent(new Event("credits-updated"));
    },
    [loadProfile]
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
    setToast(t("checkout_success"));

    void refreshCreditsAfterCheckout(sessionId);
  }, [searchParams, refreshCreditsAfterCheckout, t]);

  useEffect(() => {
    if (searchParams.get("success") !== "true") return;
    if (processedCheckoutRef.current === "success-true") return;
    processedCheckoutRef.current = "success-true";

    stripCheckoutQueryParams();
    setModalOpen(false);
    setModalDetail(null);
    setToast(t("payment_success_pending"));

    const sessionId = searchParams.get("session_id");
    void refreshCreditsAfterCheckout(sessionId);
    const reloadTimer = setTimeout(() => window.location.reload(), 3000);
    return () => clearTimeout(reloadTimer);
  }, [searchParams, refreshCreditsAfterCheckout, t]);

  const handleClose = () => {
    setModalOpen(false);
    setModalDetail(null);
  };

  const showModal = modalOpen;

  const planInfo: NoCreditsModalPlanInfo | null = hasPlan
    ? {
        planName,
        monthlyCredits: planMonthlyCredits,
        hasSubscription,
      }
    : null;

  return (
    <BuyCreditsContext.Provider
      value={{ open: openBuyModal, openBuyModal, credits }}
    >
      {children}
      {showModal ? (
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
      {toast && (
        <CreditsToast message={toast} onDone={() => setToast(null)} />
      )}
    </BuyCreditsContext.Provider>
  );
}

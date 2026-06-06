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
import { NoCreditsModal } from "@/components/ui/NoCreditsModal";
import {
  onBuyCreditsRequest,
  openBuyCreditsModal,
} from "@/lib/client-credits-ui";

const LOW_CREDITS_THRESHOLD = 20;
const LOW_SHOWN_KEY = "influexai_buy_credits_low_shown";

type BuyCreditsContextValue = {
  open: () => void;
  credits: number | null;
};

const BuyCreditsContext = createContext<BuyCreditsContextValue | null>(null);

export function useBuyCredits() {
  const ctx = useContext(BuyCreditsContext);
  if (!ctx) {
    return {
      open: openBuyCreditsModal,
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
        boxShadow: "0 8px 32px color-mix(in srgb, var(--accent, #B4FF00) 35%, transparent)",
      }}
    >
      {message}
    </div>
  );
}

function stripCheckoutSuccessParams() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("credits");
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
  const [modalOpen, setModalOpen] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const processedCheckoutRef = useRef<string | null>(null);

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("credits, plan, role, is_admin")
      .eq("id", user.id)
      .single();

    if (data) {
      setCredits(data.credits ?? 0);
      setHasPlan(
        hasActivePlan({
          plan: data.plan,
          role: data.role,
          is_admin: data.is_admin,
        })
      );
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

  const openModal = useCallback((opts?: { force?: boolean }) => {
    if (opts?.force) setForceOpen(true);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    return onBuyCreditsRequest(() => openModal({ force: true }));
  }, [openModal]);

  useEffect(() => {
    if (credits === null || !hasPlan) return;

    if (credits <= 0) {
      setForceOpen(true);
      setModalOpen(true);
      return;
    }

    setForceOpen(false);

    if (credits < LOW_CREDITS_THRESHOLD) {
      try {
        if (!sessionStorage.getItem(LOW_SHOWN_KEY)) {
          sessionStorage.setItem(LOW_SHOWN_KEY, "1");
          setModalOpen(true);
        }
      } catch {
        setModalOpen(true);
      }
    }
  }, [credits, hasPlan]);

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

    stripCheckoutSuccessParams();
    setModalOpen(false);
    setForceOpen(false);
    setToast(t("checkout_success"));

    void refreshCreditsAfterCheckout(sessionId);
  }, [searchParams, refreshCreditsAfterCheckout, t]);

  const handleClose = () => {
    if (forceOpen) return;
    setModalOpen(false);
  };

  return (
    <BuyCreditsContext.Provider value={{ open: () => openModal(), credits }}>
      {children}
      <NoCreditsModal
        open={modalOpen && hasPlan}
        onClose={handleClose}
        forceOpen={forceOpen}
      />
      {toast && (
        <CreditsToast message={toast} onDone={() => setToast(null)} />
      )}
    </BuyCreditsContext.Provider>
  );
}

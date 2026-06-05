"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
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
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3.5 rounded-xl font-bold text-sm shadow-lg"
      style={{
        background: "#B4FF00",
        color: "#060608",
        boxShadow: "0 8px 32px rgba(180,255,0,0.35)",
      }}
    >
      {message}
    </div>
  );
}

export function BuyCreditsProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("buyCredits");
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [credits, setCredits] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadCredits = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (data) setCredits(data.credits ?? 0);
  }, [supabase]);

  useEffect(() => {
    void loadCredits();
    const onUpdate = () => void loadCredits();
    const onOptimistic = (e: Event) => {
      const v = (e as CustomEvent<number | null>).detail;
      if (typeof v === "number") setCredits(v);
      else void loadCredits();
    };
    window.addEventListener("credits-updated", onUpdate);
    window.addEventListener("optimistic-credits", onOptimistic);
    return () => {
      window.removeEventListener("credits-updated", onUpdate);
      window.removeEventListener("optimistic-credits", onOptimistic);
    };
  }, [loadCredits]);

  const openModal = useCallback((opts?: { force?: boolean }) => {
    if (opts?.force) setForceOpen(true);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    return onBuyCreditsRequest(() => openModal());
  }, [openModal]);

  useEffect(() => {
    if (credits === null) return;

    if (credits === 0) {
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
  }, [credits]);

  useEffect(() => {
    const status = searchParams.get("credits");
    if (status !== "success") return;

    const amount = parseInt(searchParams.get("amount") ?? "0", 10);
    const sessionId = searchParams.get("session_id");

    const finish = (purchased: number) => {
      if (purchased > 0) {
        setToast(t("success_toast", { count: purchased }));
      }
      setModalOpen(false);
      setForceOpen(false);
      void loadCredits();
      window.dispatchEvent(new Event("credits-updated"));
      router.replace("/dashboard");
    };

    if (amount > 0) {
      finish(amount);
      return;
    }

    if (sessionId) {
      fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`)
        .then((r) => r.json())
        .then((data) => {
          finish(data?.creditsAdded ?? 0);
        })
        .catch(() => finish(0));
    } else {
      finish(0);
    }
  }, [searchParams, router, loadCredits, t]);

  const handleClose = () => {
    if (forceOpen) return;
    setModalOpen(false);
  };

  return (
    <BuyCreditsContext.Provider value={{ open: () => openModal(), credits }}>
      {children}
      <BuyCreditsModal
        open={modalOpen}
        onClose={handleClose}
        credits={credits}
        forceOpen={forceOpen}
      />
      {toast && (
        <CreditsToast message={toast} onDone={() => setToast(null)} />
      )}
    </BuyCreditsContext.Provider>
  );
}

"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type CheckoutStatus =
  | { status: "active"; redirectTo: string }
  | { status: "pending" }
  | { status: "error"; message: string };

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 20;

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const type = searchParams.get("type") ?? "subscription";

  const [phase, setPhase] = useState<"polling" | "timeout" | "error">(
    "polling"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const attemptsRef = useRef(0);
  const redirectedRef = useRef(false);

  const signInHref = `/auth/sign-in?redirect=${encodeURIComponent(
    `/checkout/success?${searchParams.toString()}`
  )}`;

  const checkStatus = useCallback(async (): Promise<boolean> => {
    const params = new URLSearchParams({ type });
    if (sessionId) params.set("session_id", sessionId);

    const res = await fetch(`/api/checkout/status?${params.toString()}`);
    const data = (await res.json()) as CheckoutStatus;

    if (res.status === 401) {
      setPhase("error");
      setErrorMessage("Bitte melde dich an, um deine Zahlung zu bestätigen.");
      return true;
    }

    if (!res.ok || data.status === "error") {
      setPhase("error");
      setErrorMessage(
        data.status === "error"
          ? data.message
          : "Status konnte nicht geladen werden."
      );
      return true;
    }

    if (data.status === "active" && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(data.redirectTo ?? "/dashboard");
      return true;
    }

    return false;
  }, [router, sessionId, type]);

  useEffect(() => {
    if (type !== "subscription") {
      setPhase("error");
      setErrorMessage("Unbekannter Checkout-Typ.");
      return;
    }

    let cancelled = false;

    const poll = async () => {
      const done = await checkStatus();
      if (cancelled || done) return;

      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setPhase("timeout");
      }
    };

    void poll();
    const interval = setInterval(() => {
      if (attemptsRef.current >= MAX_POLL_ATTEMPTS || redirectedRef.current) {
        clearInterval(interval);
        return;
      }
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [checkStatus, type, retryCount]);

  const handleRetry = () => {
    attemptsRef.current = 0;
    redirectedRef.current = false;
    setPhase("polling");
    setErrorMessage(null);
    setRetryCount((count) => count + 1);
  };

  return (
    <div className="min-h-screen bg-[#060608] text-[#F0EFE8] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {phase === "polling" && (
          <>
            <div
              className="mx-auto mb-6 h-10 w-10 rounded-full border-2 border-[#B4FF00]/30 border-t-[#B4FF00] animate-spin"
              aria-hidden
            />
            <h1 className="text-xl font-semibold mb-2">
              Zahlung wird bestätigt…
            </h1>
            <p className="text-sm text-white/65">
              Dein Abo wird eingerichtet. Das dauert meist nur wenige Sekunden.
            </p>
          </>
        )}

        {phase === "timeout" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Noch in Bearbeitung</h1>
            <p className="text-sm text-white/65 mb-6">
              Zahlung wird noch verarbeitet. Bitte warte kurz oder aktualisiere
              die Seite.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleRetry}
                className="px-5 py-2.5 rounded-xl bg-[#B4FF00] text-[#060608] font-semibold text-sm"
              >
                Erneut prüfen
              </button>
              <Link
                href="/pricing"
                className="px-5 py-2.5 rounded-xl border border-white/15 text-sm font-medium text-white/80 hover:text-white"
              >
                Zum Pricing
              </Link>
            </div>
          </>
        )}

        {phase === "error" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Bestätigung fehlgeschlagen</h1>
            <p className="text-sm text-white/65 mb-6">
              {errorMessage ?? "Bitte versuche es erneut."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {errorMessage?.includes("melde dich an") ? (
                <Link
                  href={signInHref}
                  className="px-5 py-2.5 rounded-xl bg-[#B4FF00] text-[#060608] font-semibold text-sm"
                >
                  Anmelden
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-5 py-2.5 rounded-xl bg-[#B4FF00] text-[#060608] font-semibold text-sm"
                >
                  Erneut prüfen
                </button>
              )}
              <Link
                href="/pricing"
                className="px-5 py-2.5 rounded-xl border border-white/15 text-sm font-medium text-white/80 hover:text-white"
              >
                Zum Pricing
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060608] flex items-center justify-center text-white/65 text-sm">
          …
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

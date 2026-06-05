"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ConfettiBurst } from "@/components/confetti-burst";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session_id");

  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const pollAttempts = useRef(0);

  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      const res = await fetch(
        `/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setCreditsAdded(data.creditsAdded);
      setBalance(data.balance);
      window.dispatchEvent(new Event("credits-updated"));
    };

    load();
    const interval = setInterval(() => {
      if (pollAttempts.current < 8) load();
      pollAttempts.current += 1;
    }, 1500);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    const t = setTimeout(() => router.push("/dashboard"), 5000);
    return () => clearTimeout(t);
  }, [router]);

  const added = creditsAdded ?? 0;

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "60px auto",
        textAlign: "center",
        padding: 24,
        position: "relative",
      }}
    >
      <ConfettiBurst />
      <h1
        style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "2.5rem",
          letterSpacing: "0.02em",
          color: "#F0EFE8",
          marginBottom: 12,
        }}
      >
        🎉 {added > 0 ? `${added} Credits` : "Credits"} wurden deinem Konto
        gutgeschrieben!
      </h1>
      {balance !== null && (
        <p
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "0.95rem",
            marginBottom: 8,
          }}
        >
          Neuer Stand:{" "}
          <strong style={{ color: "#B4FF00", fontSize: "1.2rem" }}>
            {balance} Credits
          </strong>
        </p>
      )}
      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem", marginBottom: 28 }}>
        Weiterleitung zum Dashboard in 5 Sekunden…
      </p>
      <Link
        href="/dashboard"
        style={{
          display: "inline-block",
          padding: "13px 28px",
          borderRadius: 10,
          background: "#B4FF00",
          color: "#060608",
          fontWeight: 700,
          fontSize: "0.95rem",
          textDecoration: "none",
          fontFamily: "var(--font-dm), sans-serif",
        }}
      >
        Jetzt erstellen →
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <p style={{ color: "rgba(255,255,255,0.65)", textAlign: "center", padding: 80 }}>
          Lade…
        </p>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

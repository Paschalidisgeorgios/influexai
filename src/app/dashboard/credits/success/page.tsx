"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SuccessPage() {
  const params = useSearchParams();
  const credits = params.get("credits");

  return (
    <div style={{
      maxWidth: 480, margin: "80px auto",
      textAlign: "center", padding: 20,
    }}>
      <div style={{ fontSize: "4rem", marginBottom: 20 }}>🎉</div>
      <h1 style={{
        fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
        fontSize: "2.5rem", letterSpacing: "0.02em",
        color: "#F0EFE8", marginBottom: 10,
      }}>
        Zahlung erfolgreich!
      </h1>
      <p style={{ color: "#505055", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: 28 }}>
        Deine <span style={{ color: "#B4FF00", fontWeight: 700 }}>{credits} Credits</span> werden
        in Kürze deinem Konto gutgeschrieben.
      </p>
      <Link href="/dashboard" style={{
        display: "inline-block",
        padding: "13px 28px", borderRadius: 10,
        background: "#B4FF00", color: "#060608",
        fontWeight: 700, fontSize: "0.95rem",
        textDecoration: "none",
        fontFamily: "var(--font-dm), sans-serif",
      }}>
        Zum Dashboard →
      </Link>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  credits: number;
  plan: string;
  email: string;
}

const PACKAGES = [
  {
    id: "credits_100",
    credits: 100,
    price: 9,
    label: "Starter",
    desc: "Zum Ausprobieren",
    popular: false,
    color: "#505055",
  },
  {
    id: "credits_500",
    credits: 500,
    price: 39,
    label: "Creator",
    desc: "Für regelmäßige Creator",
    popular: true,
    color: "#B4FF00",
  },
  {
    id: "credits_2500",
    credits: 2500,
    price: 99,
    label: "Business",
    desc: "Für Marken & Agenturen",
    popular: false,
    color: "#06b6d4",
  },
];

const CREDIT_COSTS = [
  { icon: "🛍️", label: "Produkt-Werbung", cost: "5 Credits" },
  { icon: "📸", label: "KI-Bild generieren", cost: "4 Credits" },
  { icon: "🎭", label: "Live Creator", cost: "10 Credits / Min" },
  { icon: "🎵", label: "Stimme klonen", cost: "2 Credits / Min" },
];

export default function CreditsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("credits, plan, email")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    };
    load();
  }, []);

  const handleCheckout = async (packageId: string) => {
    setLoading(packageId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Fehler beim Checkout. Bitte versuche es erneut.");
    }
    setLoading(null);
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "clamp(2rem, 4vw, 3rem)",
          letterSpacing: "0.02em",
          color: "#F0EFE8", marginBottom: 6,
        }}>
          ⚡ Credits & Plan
        </h1>
        <p style={{ color: "#505055", fontSize: "0.9rem" }}>
          Credits aufladen und mehr Content erstellen.
        </p>
      </div>

      {/* Current status */}
      <div style={{
        padding: 24, borderRadius: 16, marginBottom: 24,
        background: "#0f0f12",
        border: "1px solid rgba(180,255,0,0.2)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ fontSize: "0.75rem", color: "#505055", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Aktueller Stand
          </div>
          <div style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "3rem", letterSpacing: "0.02em",
            color: "#B4FF00", lineHeight: 1,
          }}>
            {profile?.credits ?? "..."} <span style={{ fontSize: "1.2rem", color: "#505055" }}>Credits</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: "#505055", marginTop: 4 }}>
            Plan: {profile?.plan === "free" ? "Free (50 Credits/Monat)" : profile?.plan}
          </div>
        </div>
        <div style={{
          padding: "10px 20px", borderRadius: 10,
          background: "rgba(180,255,0,0.08)",
          border: "1px solid rgba(180,255,0,0.2)",
          fontSize: "0.82rem", color: "#B4FF00", fontWeight: 600,
        }}>
          Credits verfallen nicht ✓
        </div>
      </div>

      {/* Credit costs */}
      <div style={{
        padding: 20, borderRadius: 14, marginBottom: 28,
        background: "#0f0f12", border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#505055", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
          Credit-Kosten
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {CREDIT_COSTS.map((item) => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 9,
              background: "rgba(255,255,255,0.03)",
            }}>
              <span style={{ fontSize: "0.875rem", color: "rgba(240,239,232,0.6)" }}>
                {item.icon} {item.label}
              </span>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#B4FF00" }}>
                {item.cost}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Packages */}
      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#505055", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
        Credits kaufen
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            style={{
              padding: 24, borderRadius: 18,
              background: "#0f0f12",
              border: `1px solid ${pkg.popular ? "rgba(180,255,0,0.35)" : "rgba(255,255,255,0.07)"}`,
              display: "flex", flexDirection: "column",
              position: "relative",
              background: pkg.popular ? "rgba(180,255,0,0.03)" : "#0f0f12",
            }}
          >
            {pkg.popular && (
              <div style={{
                position: "absolute", top: -12, left: "50%",
                transform: "translateX(-50%)",
                background: "#B4FF00", color: "#060608",
                fontSize: "0.68rem", fontWeight: 800,
                padding: "3px 14px", borderRadius: 99,
                whiteSpace: "nowrap",
              }}>
                ★ Beliebtester
              </div>
            )}

            <div style={{
              fontSize: "0.72rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.1em",
              color: "#505055", marginBottom: 10,
            }}>
              {pkg.label}
            </div>

            <div style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "2.5rem", letterSpacing: "0.02em",
              color: pkg.color, lineHeight: 1, marginBottom: 4,
            }}>
              {pkg.credits.toLocaleString()}
              <span style={{ fontSize: "1rem", color: "#505055", marginLeft: 4 }}>Credits</span>
            </div>

            <div style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.8rem", letterSpacing: "0.02em",
              color: "#F0EFE8", lineHeight: 1, marginBottom: 6,
            }}>
              €{pkg.price}
            </div>

            <div style={{ fontSize: "0.78rem", color: "#505055", marginBottom: 20, lineHeight: 1.5 }}>
              {pkg.desc}<br />
              ≈ {Math.floor(pkg.credits / 5)} Produkt-Ads
            </div>

            <button
              onClick={() => handleCheckout(pkg.id)}
              disabled={loading === pkg.id}
              style={{
                width: "100%", padding: "11px",
                borderRadius: 10, border: "none",
                background: loading === pkg.id
                  ? "rgba(255,255,255,0.1)"
                  : pkg.popular ? "#B4FF00" : "rgba(255,255,255,0.08)",
                color: pkg.popular ? "#060608" : "#F0EFE8",
                fontWeight: 700, fontSize: "0.88rem",
                cursor: loading === pkg.id ? "default" : "pointer",
                fontFamily: "var(--font-dm), sans-serif",
                transition: "all 0.2s",
              }}
            >
              {loading === pkg.id ? "Wird geladen..." : `${pkg.credits} Credits kaufen →`}
            </button>
          </div>
        ))}
      </div>

      {/* Test card info */}
      <div style={{
        marginTop: 20, padding: "12px 16px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        fontSize: "0.78rem", color: "#505055",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span>🔒</span>
        Sichere Zahlung via Stripe · Testkarte: 4242 4242 4242 4242 · Beliebiges Datum & CVC
      </div>
    </div>
  );
}

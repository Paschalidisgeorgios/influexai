"use client";

import { useState } from "react";
import Link from "next/link";
import { AGENCY_PLANS, type AgencyPlanId } from "@/lib/agency-plans";
import { createClient } from "@/lib/supabase/client";

export default function WhiteLabelPage() {
  const [checkoutPlan, setCheckoutPlan] = useState<AgencyPlanId | null>(null);
  const [agencyName, setAgencyName] = useState("");
  const [slug, setSlug] = useState("");

  const startCheckout = async (planId: AgencyPlanId) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = `/login?redirect=/white-label`;
      return;
    }

    if (!agencyName.trim() || slug.length < 2) {
      alert("Bitte Agenturname und Subdomain eingeben (Formular unten).");
      return;
    }

    setCheckoutPlan(planId);
    const res = await fetch("/api/stripe/agency-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, agencyName, slug }),
    });
    const data = await res.json();
    setCheckoutPlan(null);
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? "Checkout fehlgeschlagen");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "#F0EFE8",
      }}
    >
      <header
        style={{
          padding: "20px clamp(20px,5vw,64px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href="/"
          style={{ textDecoration: "none", color: "#F0EFE8", fontWeight: 800 }}
        >
          Influex<span style={{ color: "var(--accent)" }}>AI</span>
        </Link>
        <Link
          href="/dashboard/agency"
          style={{ color: "var(--accent)", fontWeight: 600 }}
        >
          Agentur-Dashboard →
        </Link>
      </header>

      <section
        style={{
          padding: "clamp(48px,8vw,100px) clamp(20px,5vw,64px)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(2.5rem,6vw,4.5rem)",
            lineHeight: 1.05,
            marginBottom: 16,
          }}
        >
          Verkaufe KI-Content-Tools unter deiner eigenen Marke
        </h1>
        <p
          style={{
            color: "#505055",
            fontSize: "1.1rem",
            maxWidth: 640,
            margin: "0 auto 32px",
          }}
        >
          Starte deine eigene KI-Agentur mit InfluexAI als White-Label — eigene
          Subdomain, dein Logo, deine Farben.
        </p>

        <div
          style={{
            maxWidth: 480,
            margin: "0 auto 40px",
            textAlign: "left",
            padding: 20,
            borderRadius: 14,
            background: "#0f0f12",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <label
            style={{
              display: "block",
              marginBottom: 12,
              fontSize: "0.85rem",
              color: "#505055",
            }}
          >
            Agentur-Name
            <input
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Studio Neon"
              style={inputStyle}
            />
          </label>
          <label
            style={{ display: "block", fontSize: "0.85rem", color: "#505055" }}
          >
            Subdomain (z.B. neon → neon.influexaicreator.com)
            <input
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="neon"
              style={inputStyle}
            />
          </label>
        </div>
      </section>

      <section
        style={{
          padding: "0 clamp(20px,5vw,64px) clamp(64px,8vw,100px)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {Object.values(AGENCY_PLANS).map((plan) => (
          <div
            key={plan.id}
            style={{
              padding: 28,
              borderRadius: 18,
              border:
                plan.id === "pro"
                  ? "2px solid rgba(180,255,0,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
              background:
                plan.id === "pro" ? "rgba(180,255,0,0.04)" : "#0f0f12",
            }}
          >
            <div
              style={{ fontSize: "0.75rem", color: "#505055", fontWeight: 700 }}
            >
              {plan.name.toUpperCase()}
            </div>
            <div
              style={{
                fontFamily: "var(--font-bebas)",
                fontSize: "2.5rem",
                color: "var(--accent)",
                margin: "8px 0",
              }}
            >
              €{plan.priceEur}/mo
            </div>
            <p
              style={{
                color: "#505055",
                fontSize: "0.88rem",
                marginBottom: 20,
              }}
            >
              Bis zu {plan.maxSeats === 9999 ? "∞" : plan.maxSeats} Client Seats
              {plan.hidePoweredBy
                ? " · Kein Powered-by"
                : " · Powered by InfluexAI"}
              {plan.customDomain ? " · Custom Domain" : ""}
            </p>
            <button
              type="button"
              disabled={checkoutPlan === plan.id}
              onClick={() => startCheckout(plan.id)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "none",
                background: "var(--accent)",
                color: "var(--background)",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {checkoutPlan === plan.id ? "…" : "Plan wählen"}
            </button>
          </div>
        ))}
      </section>

      <section
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "0 24px 80px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "2rem",
            marginBottom: 24,
          }}
        >
          So funktioniert&apos;s
        </h2>
        <ol
          style={{
            textAlign: "left",
            color: "#505055",
            lineHeight: 2,
            paddingLeft: 24,
          }}
        >
          <li>Kaufe einen Plan</li>
          <li>Konfiguriere Branding im Agentur-Dashboard</li>
          <li>Lade Kunden per E-Mail ein</li>
          <li>Verteile Credits aus deinem Pool</li>
        </ol>

        <div
          style={{
            marginTop: 48,
            padding: 24,
            borderRadius: 16,
            border: "2px solid #7c3aed",
            background: "linear-gradient(135deg, #1a0a2e 0%, #060608 100%)",
            textAlign: "left",
          }}
        >
          <div
            style={{ fontSize: "0.75rem", color: "#a78bfa", marginBottom: 8 }}
          >
            DEMO — So sieht es für deine Kunden aus
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
              }}
            >
              S
            </div>
            <span
              style={{ fontFamily: "var(--font-bebas)", fontSize: "1.5rem" }}
            >
              Studio <span style={{ color: "#7c3aed" }}>Neon</span>
            </span>
          </div>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.85rem",
              marginTop: 12,
            }}
          >
            Violettes Branding, eigenes Logo — deine Kunden sehen nicht
            InfluexAI.
          </p>
        </div>
      </section>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 8,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#18181d",
  color: "#F0EFE8",
  fontFamily: "inherit",
};

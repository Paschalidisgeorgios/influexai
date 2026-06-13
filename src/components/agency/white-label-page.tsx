"use client";

import { useState } from "react";
import Link from "next/link";
import { AGENCY_PLANS, type AgencyPlanId } from "@/lib/agency-plans";
import { createClient } from "@/lib/supabase/client";

import "@/styles/studio-glass.css";

export function WhiteLabelPageContent() {
  const [checkoutPlan, setCheckoutPlan] = useState<AgencyPlanId | null>(null);
  const [agencyName, setAgencyName] = useState("");
  const [slug, setSlug] = useState("");

  const startCheckout = async (planId: AgencyPlanId) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = `/auth/sign-in?redirect=${encodeURIComponent("/dashboard/white-label")}`;
      return;
    }

    if (!agencyName.trim() || slug.length < 2) {
      alert("Bitte Agenturname und Subdomain eingeben (Formular unten).");
      return;
    }

    setCheckoutPlan(planId);
    const res = await fetch("/api/agency/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: planId,
        agencyName,
        slug,
        billingInterval: "monthly",
      }),
    });
    const data = await res.json();
    setCheckoutPlan(null);
    if (data.url) window.location.href = data.url;
    else
      alert(
        data.error ??
          "Dieser Plan ist aktuell nicht verfügbar. Bitte kontaktiere den Support."
      );
  };

  return (
    <div className="max-w-5xl mx-auto w-full pb-12">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="font-[family-name:var(--font-bebas)] text-[clamp(2rem,5vw,3.5rem)] leading-tight text-[#F0EFE8]"
          >
            White Label / Agentur
          </h1>
          <p className="text-[rgba(255,255,255,0.65)] text-sm mt-2 max-w-xl">
            Verkaufe KI-Content-Tools unter deiner eigenen Marke — Subdomain, Logo
            und Farben.
          </p>
        </div>
        <Link
          href="/dashboard/agency"
          className="text-[var(--accent)] font-semibold text-sm"
        >
          Agentur-Dashboard →
        </Link>
      </header>

      <section className="text-center mb-10">
        <div className="max-w-md mx-auto text-left p-5 studio-glass-card">
          <label className="block mb-3 text-sm text-white/65">
            Agentur-Name
            <input
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Studio Neon"
              className="studio-glass-input mt-2"
            />
          </label>
          <label className="block text-sm text-white/65">
            Subdomain (z.B. neon → neon.influexaicreator.com)
            <input
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="neon"
              className="studio-glass-input mt-2"
            />
          </label>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        {Object.values(AGENCY_PLANS).map((plan) => (
          <div
            key={plan.id}
            className={`p-7 rounded-2xl studio-glass-card ${
              plan.id === "pro" ? "border-[#ccff00]/40" : ""
            }`}
            style={
              plan.id === "pro"
                ? { background: "rgba(204,255,0,0.04)" }
                : undefined
            }
          >
            <div className="text-xs text-[rgba(255,255,255,0.65)] font-bold">
              {plan.name.toUpperCase()}
            </div>
            <div className="font-[family-name:var(--font-bebas)] text-4xl text-[var(--accent)] my-2">
              €{plan.monthlyPriceEur}/mo
            </div>
            <p className="text-[rgba(255,255,255,0.65)] text-sm mb-5">
              Bis zu {plan.maxSeats === 9999 ? "∞" : plan.maxSeats} Client Seats
              {plan.hidePoweredBy ? " · Kein Powered-by" : " · Powered by InfluexAI"}
              {plan.customDomain ? " · Custom Domain" : ""}
            </p>
            <button
              type="button"
              disabled={checkoutPlan === plan.id}
              onClick={() => startCheckout(plan.id)}
              className="w-full py-3 rounded-lg border-0 bg-[var(--accent)] text-[var(--background)] font-extrabold cursor-pointer disabled:opacity-60"
            >
              {checkoutPlan === plan.id ? "…" : "Plan wählen"}
            </button>
          </div>
        ))}
      </section>

      <section className="max-w-2xl mx-auto text-center">
        <h2 className="font-[family-name:var(--font-bebas)] text-3xl mb-6">
          So funktioniert&apos;s
        </h2>
        <ol className="text-left text-[rgba(255,255,255,0.65)] leading-8 pl-6">
          <li>Kaufe einen Plan</li>
          <li>Konfiguriere Branding im Agentur-Dashboard</li>
          <li>Lade Kunden per E-Mail ein</li>
          <li>Verteile Credits aus deinem Pool</li>
        </ol>
      </section>
    </div>
  );
}

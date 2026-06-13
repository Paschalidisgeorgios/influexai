"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { getCreditsPageStats } from "@/app/actions/credits-page";
import { CreditCalculator } from "@/components/credit-calculator";
import {
  CREDIT_PACKAGES,
  DEFAULT_CHECKOUT_PACKAGE,
  type CreditPackageId,
} from "@/lib/credit-packages";
import "@/styles/credits-glass.css";
import "@/styles/studio-glass.css";

type PageStats = Awaited<ReturnType<typeof getCreditsPageStats>>;

const GLASS_CARD =
  "rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-6 shadow-2xl backdrop-blur-xl";

const GHOST_BTN =
  "inline-flex items-center justify-center rounded-lg border border-zinc-700/60 bg-transparent px-4 py-2.5 font-sans text-sm font-medium text-zinc-300 no-underline transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white";

const PREMIUM_BTN =
  "w-full rounded-lg bg-[#ccff00] py-3 font-sans text-xs font-bold uppercase tracking-wider text-black transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50";

export default function CreditsPage() {
  const t = useTranslations("credits");
  const tBuy = useTranslations("buyCredits");
  const searchParams = useSearchParams();
  const preselect = searchParams.get("package") as CreditPackageId | null;

  const [stats, setStats] = useState<PageStats>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getCreditsPageStats().then(setStats);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCheckout = async (packageId: string) => {
    setLoading(packageId);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Checkout fehlgeschlagen.");
    } catch {
      alert("Fehler beim Checkout. Bitte versuche es erneut.");
    }
    setLoading(null);
  };

  const credits = stats?.credits ?? 0;
  const showUrgent = credits < 10 && credits > 0;
  const showBlock = credits === 0;
  const showFirstPurchase = stats && !stats.hasPurchased;

  return (
    <div className="studio-glass-dot-grid relative mx-auto box-border w-full min-w-0 max-w-[960px] px-4 py-6 sm:px-6">
      {showUrgent && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/10 px-4 py-3 font-sans text-sm text-red-300 backdrop-blur-md">
          ⚠️ Credits fast leer — jetzt aufladen
        </div>
      )}

      {showFirstPurchase && (
        <div className="mb-4 rounded-xl border border-[#ccff00]/20 bg-[#ccff00]/5 px-4 py-3 font-sans text-sm text-zinc-200 backdrop-blur-md">
          🎁 Erster Kauf? Benutze Code{" "}
          <strong className="font-mono font-bold text-[#ccff00]">FIRST20</strong>{" "}
          für 20% Rabatt im Checkout.
        </div>
      )}

      <div className={`${GLASS_CARD} mb-6`}>
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {t("balance")}
        </p>
        <div
          data-testid="credits-balance"
          className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1"
        >
          <span className="font-mono text-5xl font-bold leading-none text-[#ccff00] sm:text-6xl">
            {stats ? credits.toLocaleString("de-DE") : "…"}
          </span>
          <span className="font-sans text-lg font-medium text-zinc-400">Credits</span>
        </div>
        <p className="mb-5 font-sans text-sm leading-relaxed text-zinc-400">
          Du hast diesen Monat{" "}
          <span className="font-mono font-bold text-white">
            {stats?.usedThisMonth ?? 0} Credits
          </span>{" "}
          verbraucht
        </p>
        <div className="mb-2 flex justify-between font-sans text-xs text-zinc-500">
          <span>Verbleibend</span>
          <span className="font-mono font-bold text-white">
            {credits} / {stats?.capacity ?? 0}
          </span>
        </div>
        <div className="h-px overflow-hidden rounded-full bg-zinc-800/70">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{
              width: `${stats?.progressPercent ?? 0}%`,
              background:
                credits < 10
                  ? "linear-gradient(90deg, #ff6b7a, #ef4444)"
                  : "#ccff00",
            }}
          />
        </div>
      </div>

      <div className={`${GLASS_CARD} mb-6`}>
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#ccff00]">
          {tBuy("credit_outcome_title")}
        </p>
        <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-400">
          {tBuy("credit_outcome_body")}
        </p>
      </div>

      <CreditCalculator topFeatureType={stats?.topFeatureType} />

      <div className={`${GLASS_CARD} mb-6`}>
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          API Access
        </p>
        <h3 className="mb-2 font-sans text-xl font-extrabold uppercase tracking-tight text-white">
          Developer API
        </h3>
        <p className="mb-4 font-sans text-sm leading-relaxed text-zinc-400">
          Für Entwickler und Agenturen — dieselben Credits, Nutzung über REST API.
          Kein extra API-Fee, gleicher Preis pro Credit wie im Dashboard.
        </p>
        <ul className="mb-5 space-y-1.5 pl-4 font-sans text-sm leading-relaxed text-zinc-500">
          <li>Script, Niche, Outlier & Thumbnail per API</li>
          <li>60 Requests/Minute · Bearer-Auth</li>
          <li>Credits geteilt mit deinem Konto</li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <a href="/dashboard/api" className={GHOST_BTN}>
            API Keys verwalten
          </a>
          <a href="/docs" className={GHOST_BTN}>
            API Docs ansehen →
          </a>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-2 font-sans text-xl font-extrabold uppercase tracking-tight text-white md:text-2xl">
          {tBuy("pricing_title")}
        </h2>
        <p className="max-w-xl font-sans text-sm leading-relaxed text-zinc-400">
          {tBuy("pricing_subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CREDIT_PACKAGES.map((pkg) => {
          const isPopular = pkg.popular;
          const highlighted =
            isPopular ||
            preselect === pkg.id ||
            (!preselect && pkg.id === DEFAULT_CHECKOUT_PACKAGE && isPopular);

          return (
            <div
              key={pkg.id}
              data-testid="pricing-card"
              className={`relative flex min-w-0 flex-col ${GLASS_CARD} ${
                isPopular ? "credits-pack-popular pt-7" : ""
              }`}
            >
              {isPopular && (
                <div className="credits-popular-badge absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#ccff00]/40 bg-[#ccff00]/10 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-[#ccff00] backdrop-blur-md">
                  ★ Most Popular
                </div>
              )}

              <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {pkg.label}
              </p>

              <p className="mb-1 font-mono text-2xl font-bold text-white">
                €{pkg.priceEur.toFixed(2).replace(".", ",")}
              </p>

              <p className="mb-1 font-mono text-2xl font-bold text-[#ccff00]">
                {pkg.credits} Credits
              </p>

              <p className="mb-6 flex-1 font-sans text-sm text-zinc-500">
                €{pkg.pricePerCredit.toFixed(3).replace(".", ",")} / Credit
              </p>

              <button
                type="button"
                onClick={() => handleCheckout(pkg.id)}
                disabled={loading === pkg.id}
                className={`${PREMIUM_BTN} ${
                  !highlighted && !loading
                    ? "bg-zinc-800/80 text-zinc-200 hover:bg-[#ccff00] hover:text-black"
                    : ""
                }`}
              >
                {loading === pkg.id
                  ? "Wird geladen…"
                  : tBuy("top_up_button", { count: pkg.credits })}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-center font-sans text-sm text-zinc-500">
        {[
          tBuy("trust_footer_no_expire"),
          tBuy("trust_footer_one_time"),
          tBuy("trust_footer_plan"),
          tBuy("trust_footer_instant"),
          tBuy("trust_footer_stripe"),
        ].map((line, i) => (
          <span key={line} className="inline-flex items-center">
            {i > 0 ? (
              <span className="mr-5 hidden text-zinc-700 sm:inline" aria-hidden>
                ·
              </span>
            ) : null}
            <span>
              <span className="text-[#ccff00]">✓ </span>
              {line}
            </span>
          </span>
        ))}
      </div>

      <p className="mx-auto mt-4 max-w-xl text-center font-sans text-xs leading-relaxed text-zinc-600">
        {tBuy("pricing_footnote")}
      </p>

      {showBlock && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/90 p-6 backdrop-blur-md">
          <div
            className={`${GLASS_CARD} w-full max-w-md text-center`}
          >
            <h2 className="mb-3 font-sans text-2xl font-extrabold uppercase tracking-tight text-white">
              Keine Credits mehr
            </h2>
            <p className="mb-6 font-sans text-sm text-zinc-400">
              Alle Features sind pausiert. Wähle ein Paket, um weiterzumachen.
            </p>
            <div className="flex flex-col gap-3">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleCheckout(pkg.id)}
                  disabled={!!loading}
                  className={
                    pkg.popular
                      ? PREMIUM_BTN
                      : `${GHOST_BTN} w-full justify-center`
                  }
                >
                  {pkg.label} —{" "}
                  <span className="font-mono font-bold">{pkg.credits} Credits</span>{" "}
                  (€{pkg.priceEur.toFixed(2).replace(".", ",")})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

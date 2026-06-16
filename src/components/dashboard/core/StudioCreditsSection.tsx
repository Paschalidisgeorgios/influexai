"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { getCreditsPageStats } from "@/app/actions/credits-page";
import {
  CREDIT_PACKAGES,
  DEFAULT_CHECKOUT_PACKAGE,
  type CreditPackageId,
} from "@/lib/credit-packages";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
} from "./DashboardSurface";
import { StudioCreditNote, StudioPanel } from "../studio-ui";
import { STUDIO_MUTED, STUDIO_RADIUS, STUDIO_TEXT } from "../studio-ui/tokens";

type PageStats = Awaited<ReturnType<typeof getCreditsPageStats>>;

const CREDIT_EXAMPLES = [
  { label: "Viral Hooks", credits: "1–3", note: "pro Generierung" },
  { label: "Content Kalender", credits: "2", note: "pro Plan" },
  { label: "Bild-Generierung", credits: "3–8", note: "je Modell" },
  { label: "Image → Video", credits: "variabel", note: "Modell & Dauer" },
] as const;

const primaryBtnClass = `inline-flex min-h-[44px] items-center justify-center px-6 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 ${STUDIO_RADIUS.button}`;

const secondaryBtnClass = `inline-flex min-h-[44px] items-center justify-center border px-6 text-sm font-medium no-underline transition-colors hover:border-black/18 ${STUDIO_RADIUS.button}`;

export function StudioCreditsSection({
  showPackages = true,
  showApi = true,
}: {
  showPackages?: boolean;
  showApi?: boolean;
}) {
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
  const showLowBalance = credits > 0 && credits < 10;
  const showZeroBlock = credits === 0 && stats !== null;

  const progressColor = "linear-gradient(90deg, rgba(8,8,8,0.10), rgba(8,8,8,0.20))";

  return (
    <div className="w-full min-w-0 max-w-full space-y-8">
      {showLowBalance ? (
        <StudioCreditNote>
          Guthaben niedrig — Top-up jederzeit unter Credit-Pakete möglich.
        </StudioCreditNote>
      ) : null}

      <StudioPanel title="Guthaben">
        <div className="space-y-5">
          <div>
            <p className="mb-1 text-xs font-medium" style={{ color: STUDIO_MUTED }}>
              {t("balance")}
            </p>
            <div
              data-testid="credits-balance"
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
            >
              <span
                className="font-mono text-4xl font-bold tabular-nums tracking-tight sm:text-5xl"
                style={{ color: STUDIO_TEXT }}
              >
                {stats ? credits.toLocaleString("de-DE") : "…"}
              </span>
              <span className="text-base font-medium" style={{ color: STUDIO_MUTED }}>
                Credits
              </span>
            </div>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: STUDIO_MUTED }}>
            Verbrauch diesen Monat:{" "}
            <span className="font-medium" style={{ color: STUDIO_TEXT }}>
              {stats?.usedThisMonth ?? 0} Credits
            </span>
          </p>

          <div>
            <div className="mb-2 flex justify-between text-xs" style={{ color: STUDIO_MUTED }}>
              <span>Verbleibend</span>
              <span className="font-mono font-semibold tabular-nums" style={{ color: STUDIO_TEXT }}>
                {credits} / {stats?.capacity ?? 0}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full"
              style={{ background: "rgba(8,8,8,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${stats?.progressPercent ?? 0}%`,
                  background: progressColor,
                }}
              />
            </div>
          </div>
        </div>
      </StudioPanel>

      <StudioPanel title="Credits & Plan">
        <p className="mb-5 max-w-xl text-sm leading-relaxed" style={{ color: STUDIO_MUTED }}>
          Abo und Pläne auf der Pricing-Seite. Einmalige Credit-Pakete hier — Checkout über Stripe.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/pricing"
            className={primaryBtnClass}
            style={{ background: DASHBOARD_ACCENT, color: "#060608" }}
          >
            Pläne & Abo ansehen
          </Link>
          {showPackages ? (
            <button
              type="button"
              onClick={() => handleCheckout(DEFAULT_CHECKOUT_PACKAGE)}
              disabled={!!loading}
              className={secondaryBtnClass}
              style={{
                borderColor: "rgba(8,8,8,0.10)",
                background: "#FFFCF7",
                color: STUDIO_TEXT,
              }}
            >
              {loading === DEFAULT_CHECKOUT_PACKAGE
                ? "Wird geladen…"
                : "Credit-Paket kaufen"}
            </button>
          ) : (
            <Link
              href="/dashboard/credits"
              className={secondaryBtnClass}
              style={{
                borderColor: "rgba(8,8,8,0.10)",
                background: "#FFFCF7",
                color: STUDIO_TEXT,
              }}
            >
              Alle Credit-Pakete
            </Link>
          )}
        </div>
        <StudioCreditNote className="mt-4">
          {tBuy("trust_footer_stripe")} · {tBuy("trust_footer_instant")}
        </StudioCreditNote>
      </StudioPanel>

      <StudioPanel title="Was Credits bedeuten">
        <p className="mb-4 text-sm leading-relaxed" style={{ color: STUDIO_MUTED }}>
          Credits sind die Währung für KI-Generierungen im Studio. Jede Aktion verbraucht
          Credits je nach Tool, Modell und Dauer — du siehst den Bedarf vor dem Start.
        </p>
        <ul
          className="space-y-3"
          data-testid="credit-usage-examples"
        >
          {CREDIT_EXAMPLES.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-4 rounded-[14px] border border-black/[0.05] px-4 py-3"
              style={{ background: "rgba(255,252,247,0.65)" }}
            >
              <span className="text-sm font-medium" style={{ color: STUDIO_TEXT }}>
                {row.label}
              </span>
              <span className="shrink-0 text-right text-sm" style={{ color: STUDIO_MUTED }}>
                <span className="font-mono font-semibold" style={{ color: STUDIO_TEXT }}>
                  {row.credits}
                </span>{" "}
                {row.note}
              </span>
            </li>
          ))}
        </ul>
      </StudioPanel>

      {showApi ? (
        <StudioPanel title="API Access">
          <p className="mb-4 max-w-xl text-sm leading-relaxed" style={{ color: STUDIO_MUTED }}>
            Für Entwickler und Agenturen — dieselben Credits, Nutzung über REST API. Kein
            extra API-Fee.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/api"
              className={secondaryBtnClass}
              style={{
                borderColor: "rgba(8,8,8,0.10)",
                background: "#FFFCF7",
                color: DASHBOARD_TEXT,
              }}
            >
              API Keys verwalten
            </Link>
            <Link
              href="/docs"
              className={secondaryBtnClass}
              style={{
                borderColor: "rgba(8,8,8,0.10)",
                background: "#FFFCF7",
                color: DASHBOARD_TEXT,
              }}
            >
              API Docs
            </Link>
          </div>
        </StudioPanel>
      ) : null}

      {showPackages ? (
        <div className="space-y-4">
          <div>
            <h3
              className="text-lg font-bold tracking-tight"
              style={{ color: STUDIO_TEXT, letterSpacing: "-0.02em" }}
            >
              {tBuy("pricing_title")}
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-relaxed" style={{ color: STUDIO_MUTED }}>
              {tBuy("pricing_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CREDIT_PACKAGES.map((pkg) => {
              const isPopular = pkg.id === "large";
              const highlighted =
                isPopular ||
                preselect === pkg.id ||
                (!preselect && pkg.id === DEFAULT_CHECKOUT_PACKAGE && isPopular);

              return (
                <div
                  key={pkg.id}
                  data-testid="pricing-card"
                  className={`relative flex min-w-0 flex-col rounded-[24px] border p-5 md:p-6 ${
                    isPopular ? "pt-8" : ""
                  }`}
                  style={{
                    background: "rgba(255,252,247,0.82)",
                    borderColor: highlighted
                      ? "rgba(180,255,0,0.28)"
                      : "rgba(8,8,8,0.06)",
                    boxShadow: "0 2px 24px rgba(8,8,8,0.04)",
                  }}
                >
                  {isPopular ? (
                    <span
                      className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold"
                      style={{
                        borderColor: "rgba(180,255,0,0.35)",
                        background: "rgba(180,255,0,0.12)",
                        color: STUDIO_TEXT,
                      }}
                    >
                      Empfohlen
                    </span>
                  ) : null}

                  <p className="mb-2 text-xs font-medium" style={{ color: STUDIO_MUTED }}>
                    {pkg.label}
                  </p>
                  <p
                    className="mb-1 font-mono text-2xl font-bold tabular-nums"
                    style={{ color: STUDIO_TEXT }}
                  >
                    €{pkg.priceEur.toFixed(2).replace(".", ",")}
                  </p>
                  <p
                    className="mb-1 font-mono text-xl font-bold tabular-nums"
                    style={{ color: STUDIO_TEXT }}
                  >
                    {pkg.credits} Credits
                  </p>
                  <p className="mb-5 flex-1 text-sm" style={{ color: STUDIO_MUTED }}>
                    €{pkg.pricePerCredit.toFixed(3).replace(".", ",")} / Credit
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCheckout(pkg.id)}
                    disabled={loading === pkg.id}
                    className={`${primaryBtnClass} w-full`}
                    style={{
                      background: highlighted ? DASHBOARD_ACCENT : "rgba(8,8,8,0.06)",
                      color: highlighted ? "#060608" : STUDIO_TEXT,
                    }}
                  >
                    {loading === pkg.id
                      ? "Wird geladen…"
                      : tBuy("top_up_button", { count: pkg.credits })}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs leading-relaxed" style={{ color: STUDIO_MUTED }}>
            {tBuy("pricing_footnote")}
          </p>
        </div>
      ) : null}

      {showZeroBlock ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-labelledby="zero-credits-title"
        >
          <div
            className="w-full max-w-md rounded-[24px] border p-6 text-center"
            style={{
              background: "#FAF6EE",
              borderColor: "rgba(8,8,8,0.08)",
              boxShadow: "0 24px 64px rgba(8,8,8,0.18)",
            }}
          >
            <h2
              id="zero-credits-title"
              className="mb-2 text-xl font-bold tracking-tight"
              style={{ color: STUDIO_TEXT }}
            >
              Keine Credits mehr
            </h2>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: STUDIO_MUTED }}>
              Wähle ein Paket oder einen Plan, um weiterzuarbeiten.
            </p>
            <div className="flex flex-col gap-2">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleCheckout(pkg.id)}
                  disabled={!!loading}
                  className={`${primaryBtnClass} w-full`}
                  style={{
                    background: pkg.popular ? DASHBOARD_ACCENT : "rgba(8,8,8,0.06)",
                    color: pkg.popular ? "#060608" : STUDIO_TEXT,
                  }}
                >
                  {pkg.label} — {pkg.credits} Credits (€
                  {pkg.priceEur.toFixed(2).replace(".", ",")})
                </button>
              ))}
              <Link
                href="/pricing"
                className={`${secondaryBtnClass} w-full`}
                style={{
                  borderColor: "rgba(8,8,8,0.10)",
                  background: "#FFFCF7",
                  color: STUDIO_TEXT,
                }}
              >
                Pläne ansehen
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

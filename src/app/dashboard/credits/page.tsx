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

type PageStats = Awaited<ReturnType<typeof getCreditsPageStats>>;

export default function CreditsPage() {
  const t = useTranslations("credits");
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
    <div className="w-full min-w-0 max-w-[960px] mx-auto box-border">
      {showUrgent && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.35)",
            color: "#ff6b7a",
            fontSize: "0.88rem",
            fontWeight: 700,
          }}
        >
          ⚠️ Credits fast leer — jetzt aufladen
        </div>
      )}

      {showFirstPurchase && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(180,255,0,0.06)",
            border: "1px solid rgba(180,255,0,0.2)",
            fontSize: "0.85rem",
            color: "#F0EFE8",
          }}
        >
          🎁 Erster Kauf? Benutze Code{" "}
          <strong style={{ color: "#B4FF00" }}>FIRST20</strong> für 20% Rabatt
          im Checkout.
        </div>
      )}

      {/* Header */}
      <div
        style={{
          padding: 28,
          borderRadius: 18,
          marginBottom: 24,
          background: "#0f0f12",
          border: "1px solid rgba(180,255,0,0.15)",
        }}
      >
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.65)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 8,
          }}
        >
          {t("balance")}
        </div>
        <div
          data-testid="credits-balance"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(3.5rem, 8vw, 5rem)",
            letterSpacing: "0.02em",
            color: "#B4FF00",
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          {stats ? credits.toLocaleString("de-DE") : "…"}
          <span
            style={{
              fontSize: "1.25rem",
              color: "rgba(255,255,255,0.65)",
              marginLeft: 10,
              fontFamily: "var(--font-dm), sans-serif",
              fontWeight: 500,
            }}
          >
            Credits
          </span>
        </div>
        <p
          style={{ margin: "0 0 16px", fontSize: "0.88rem", color: "rgba(255,255,255,0.65)" }}
        >
          Du hast diesen Monat{" "}
          <strong style={{ color: "#F0EFE8" }}>
            {stats?.usedThisMonth ?? 0} Credits
          </strong>{" "}
          verbraucht
        </p>
        <div
          style={{
            marginBottom: 6,
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          <span>Verbleibend</span>
          <span>
            {credits} / {stats?.capacity ?? 0}
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: "#222228",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${stats?.progressPercent ?? 0}%`,
              height: "100%",
              background:
                credits < 10
                  ? "linear-gradient(90deg, #ff6b7a, #ef4444)"
                  : "#B4FF00",
              borderRadius: 99,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      <CreditCalculator topFeatureType={stats?.topFeatureType} />

      <div
        style={{
          marginBottom: 24,
          padding: 24,
          borderRadius: 18,
          background: "#0f0f12",
          border: "1px solid rgba(180,255,0,0.2)",
        }}
      >
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.65)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 8,
          }}
        >
          API Access
        </div>
        <h3
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "1.75rem",
            color: "#F0EFE8",
            margin: "0 0 8px",
          }}
        >
          Developer API
        </h3>
        <p
          style={{
            fontSize: "0.88rem",
            color: "rgba(255,255,255,0.85)",
            margin: "0 0 12px",
            lineHeight: 1.5,
          }}
        >
          Für Entwickler und Agenturen — dieselben Credits, Nutzung über REST
          API. Kein extra API-Fee, gleicher Preis pro Credit wie im Dashboard.
        </p>
        <ul
          style={{
            margin: "0 0 16px",
            paddingLeft: 18,
            color: "rgba(255,255,255,0.65)",
            fontSize: "0.82rem",
            lineHeight: 1.7,
          }}
        >
          <li>Script, Niche, Outlier & Thumbnail per API</li>
          <li>60 Requests/Minute · Bearer-Auth</li>
          <li>Credits geteilt mit deinem Konto</li>
        </ul>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href="/dashboard/api"
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 700,
              fontSize: "0.85rem",
              textDecoration: "none",
            }}
          >
            API Keys verwalten
          </a>
          <a
            href="/docs"
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid rgba(180,255,0,0.3)",
              color: "#B4FF00",
              fontWeight: 700,
              fontSize: "0.85rem",
              textDecoration: "none",
            }}
          >
            API Docs ansehen →
          </a>
        </div>
      </div>

      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "rgba(255,255,255,0.65)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 14,
        }}
      >
        Pakete wählen
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: 16,
          alignItems: "stretch",
        }}
      >
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
              className={isPopular ? "credit-pack-card credit-pack-card--popular" : "credit-pack-card"}
              style={{
                padding: isPopular ? 28 : 24,
                borderRadius: 18,
                border: isPopular
                  ? "2px solid rgba(180,255,0,0.5)"
                  : "1px solid rgba(255,255,255,0.07)",
                background: isPopular ? "rgba(180,255,0,0.04)" : "#0f0f12",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transform: isPopular ? "scale(1.02)" : "none",
                minWidth: 0,
                maxWidth: "100%",
              }}
            >
              {isPopular && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#B4FF00",
                    color: "#060608",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    padding: "4px 14px",
                    borderRadius: 99,
                    whiteSpace: "nowrap",
                  }}
                >
                  ★ MOST POPULAR
                </div>
              )}

              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.65)",
                  marginBottom: 8,
                }}
              >
                {pkg.label}
              </div>

              <div
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: "2rem",
                  color: "#F0EFE8",
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                €{pkg.priceEur.toFixed(2).replace(".", ",")}
              </div>

              <div
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: "2.2rem",
                  color: "#B4FF00",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {pkg.credits} Credits
                {pkg.popular && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#B4FF00",
                      marginLeft: 8,
                      fontFamily: "var(--font-dm), sans-serif",
                    }}
                  >
                    Beliebt
                  </span>
                )}
              </div>

              <p
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.65)",
                  marginBottom: 20,
                  lineHeight: 1.4,
                  flex: 1,
                }}
              >
                €{pkg.pricePerCredit.toFixed(3).replace(".", ",")} / Credit
              </p>

              <button
                type="button"
                onClick={() => handleCheckout(pkg.id)}
                disabled={loading === pkg.id}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    loading === pkg.id
                      ? "rgba(255,255,255,0.1)"
                      : highlighted
                        ? "#B4FF00"
                        : "rgba(255,255,255,0.08)",
                  color: highlighted ? "#060608" : "#F0EFE8",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: loading === pkg.id ? "default" : "pointer",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                {loading === pkg.id ? "Wird geladen…" : `Jetzt kaufen →`}
              </button>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 24,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 20px",
          fontSize: 13,
          color: "rgba(255,255,255,0.65)",
          textAlign: "center",
        }}
      >
        {[
          "Credits verfallen nicht — nutze sie wann du willst",
          "Einmaliger Kauf — kein Abo, keine versteckten Kosten",
          "Sofort nach Zahlung verfügbar",
          "Sicher bezahlen mit Stripe",
          "Server in Frankfurt 🇩🇪",
        ].map((line, i) => (
          <span
            key={line}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            {i > 0 && (
              <span style={{ margin: "0 10px", color: "#2a2a2e" }} aria-hidden>
                ·
              </span>
            )}
            <span>
              <span style={{ color: "#B4FF00" }}>✓ </span>
              {line}
            </span>
          </span>
        ))}
      </div>

      {showBlock && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(6,6,8,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: "100%",
              padding: 28,
              borderRadius: 18,
              background: "#0f0f12",
              border: "1px solid rgba(180,255,0,0.25)",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "2rem",
                color: "#F0EFE8",
                marginBottom: 12,
              }}
            >
              Keine Credits mehr
            </h2>
            <p
              style={{ color: "rgba(255,255,255,0.65)", marginBottom: 24, fontSize: "0.9rem" }}
            >
              Alle Features sind pausiert. Wähle ein Paket, um weiterzumachen.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleCheckout(pkg.id)}
                  disabled={!!loading}
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    border: pkg.popular
                      ? "none"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: pkg.popular
                      ? "#B4FF00"
                      : "rgba(255,255,255,0.06)",
                    color: pkg.popular ? "#060608" : "#F0EFE8",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {pkg.label} — {pkg.credits} Credits (€
                  {pkg.priceEur.toFixed(2).replace(".", ",")})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

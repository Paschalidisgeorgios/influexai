"use client";

import { useTranslations } from "next-intl";
import { CREDIT_PACKAGES, type CreditPackageId } from "@/lib/credit-packages";

type Props = {
  onCheckout: (packageId: CreditPackageId) => void;
  loadingId?: string | null;
  compact?: boolean;
};

function formatEur(amount: number): string {
  return amount.toFixed(amount < 1 ? 3 : 2).replace(".", ",");
}

export function CreditPackagePicker({
  onCheckout,
  loadingId = null,
  compact = false,
}: Props) {
  const t = useTranslations("buyCredits");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: compact
          ? "1fr"
          : "repeat(auto-fit, minmax(180px, 1fr))",
        gap: compact ? 12 : 16,
        alignItems: "stretch",
      }}
    >
      {CREDIT_PACKAGES.map((pkg) => {
        const isPopular = pkg.popular ?? false;

        return (
          <div
            key={pkg.id}
            data-testid="pricing-card"
            style={{
              padding: compact ? 18 : 22,
              borderRadius: 14,
              border: isPopular
                ? "2px solid #B4FF00"
                : "1px solid rgba(255,255,255,0.1)",
              background: isPopular ? "rgba(180,255,0,0.04)" : "#0f0f12",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {isPopular && (
              <div
                style={{
                  position: "absolute",
                  top: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#B4FF00",
                  color: "#060608",
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: 99,
                  whiteSpace: "nowrap",
                }}
              >
                {t("popular_badge")}
              </div>
            )}

            <div
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "2rem",
                color: "#B4FF00",
                lineHeight: 1,
                marginTop: isPopular ? 8 : 0,
              }}
            >
              {pkg.credits}
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.65)",
                marginBottom: 8,
              }}
            >
              Credits
            </div>

            <div
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "1.5rem",
                color: "#F0EFE8",
                lineHeight: 1,
              }}
            >
              €{formatEur(pkg.priceEur)}
            </div>

            <div
              style={{
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.65)",
                marginBottom: 14,
              }}
            >
              {t("per_credit", { price: `€${formatEur(pkg.pricePerCredit)}` })}
            </div>

            <button
              type="button"
              disabled={loadingId !== null}
              onClick={() => onCheckout(pkg.id)}
              style={{
                marginTop: "auto",
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background:
                  loadingId === pkg.id
                    ? "#2a2a2a"
                    : isPopular
                      ? "#B4FF00"
                      : "rgba(180,255,0,0.12)",
                color:
                  loadingId === pkg.id
                    ? "rgba(255,255,255,0.65)"
                    : isPopular
                      ? "#060608"
                      : "#B4FF00",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: loadingId !== null ? "default" : "pointer",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              {loadingId === pkg.id ? "…" : t("buy_button")}
            </button>
          </div>
        );
      })}
    </div>
  );
}

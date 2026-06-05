"use client";

import { useTranslations } from "next-intl";
import { openBuyCreditsModal } from "@/lib/client-credits-ui";

type Props = {
  credits: number;
  maxCredits?: number;
  collapsed?: boolean;
};

export function LowCreditsSidebar({
  credits,
  maxCredits = 300,
  collapsed,
}: Props) {
  const t = useTranslations("buyCredits");

  if (collapsed || credits >= 20) return null;

  const pct = Math.min(100, Math.round((credits / maxCredits) * 100));
  const barColor = credits < 5 ? "#ff6b7a" : "#f59e0b";

  return (
    <div
      style={{
        margin: "8px",
        padding: "12px",
        borderRadius: 10,
        background:
          credits < 5 ? "rgba(255,107,122,0.08)" : "rgba(251,191,36,0.06)",
        border: `1px solid ${credits < 5 ? "rgba(255,107,122,0.25)" : "rgba(251,191,36,0.2)"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{ fontSize: "0.72rem", fontWeight: 700, color: "#F0EFE8" }}
        >
          ⚡ {t("low_banner", { count: credits })}
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: "#222228",
          borderRadius: 99,
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: barColor,
            borderRadius: 99,
          }}
        />
      </div>
      <button
        type="button"
        onClick={openBuyCreditsModal}
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
          padding: "7px",
          borderRadius: 7,
          background: "rgba(180,255,0,0.1)",
          border: "1px solid rgba(180,255,0,0.22)",
          color: "#B4FF00",
          fontSize: "0.68rem",
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {t("top_up")}
      </button>
    </div>
  );
}

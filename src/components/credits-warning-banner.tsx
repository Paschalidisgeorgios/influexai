"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { isCreditExemptEmail } from "@/lib/access";
import { openBuyCreditsModal } from "@/lib/client-credits-ui";

type BannerTier = "low" | "critical";

function getTier(credits: number): BannerTier | null {
  if (credits === 0) return null;
  if (credits < 5) return "critical";
  if (credits < 20) return "low";
  return null;
}

const DISMISS_KEY = "influexai_credits_banner_dismissed";

type Props = {
  credits: number;
};

export function CreditsWarningBanner({ credits }: Props) {
  const t = useTranslations("buyCredits");
  const tier = getTier(credits);
  const [dismissedTier, setDismissedTier] = useState<string | null>(null);
  const [creditExempt, setCreditExempt] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setCreditExempt(isCreditExemptEmail(user?.email));
    });
  }, []);

  useEffect(() => {
    try {
      setDismissedTier(sessionStorage.getItem(DISMISS_KEY));
    } catch {
      setDismissedTier(null);
    }
  }, []);

  useEffect(() => {
    if (!tier) return;
    try {
      const stored = sessionStorage.getItem(DISMISS_KEY);
      if (stored && stored !== tier) {
        sessionStorage.removeItem(DISMISS_KEY);
        setDismissedTier(null);
      }
    } catch {
      /* ignore */
    }
  }, [tier]);

  if (creditExempt === null || creditExempt) return null;
  if (!tier) return null;
  if (dismissedTier === tier) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, tier);
    } catch {
      /* ignore */
    }
    setDismissedTier(tier);
  };

  const Wrapper = tier === "critical" ? motion.div : "div";
  const pulseProps =
    tier === "critical"
      ? {
          animate: {
            boxShadow: [
              "0 0 0 0 rgba(239,68,68,0.4)",
              "0 0 0 8px rgba(239,68,68,0)",
            ],
          },
          transition: { duration: 1.5, repeat: Infinity },
        }
      : {};

  return (
    <Wrapper
      data-testid="credits-warning-banner"
      data-variant={tier}
      {...pulseProps}
      style={{
        width: "100%",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        background: "rgba(239,68,68,0.12)",
        borderBottom: "1px solid rgba(239,68,68,0.25)",
        borderLeft: "3px solid #ef4444",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "0.88rem",
          fontWeight: 600,
          color: "#F0EFE8",
          flex: 1,
        }}
      >
        {tier === "critical"
          ? t("urgent_banner")
          : t("low_banner", { count: credits })}
        <span
          style={{
            display: "block",
            marginTop: 4,
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "rgba(255,255,255,0.65)",
          }}
        >
          {t("low_credit_plan_hint")}
        </span>
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() => openBuyCreditsModal()}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            background: "#ef4444",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.82rem",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm), sans-serif",
          }}
        >
          {t("top_up")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("dismiss")}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.65)",
            cursor: "pointer",
            fontSize: "1.1rem",
            lineHeight: 1,
            padding: 4,
          }}
        >
          ×
        </button>
      </div>
    </Wrapper>
  );
}

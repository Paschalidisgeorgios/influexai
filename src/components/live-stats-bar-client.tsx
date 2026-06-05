"use client";

import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";

export function LiveStatsBarClient() {
  const t = useTranslations("landingPage");

  return (
    <SpringReveal delay={0.1}>
      <div
        style={{
          width: "100%",
          background: "rgba(180,255,0,0.05)",
          borderTop: "1px solid rgba(180,255,0,0.1)",
          borderBottom: "1px solid rgba(180,255,0,0.1)",
          padding: "12px 16px",
          textAlign: "center",
          fontSize: 14,
          fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
          color: "rgba(255,255,255,0.65)",
          lineHeight: 1.5,
        }}
      >
        <span aria-hidden style={{ marginRight: 6 }}>
          ⚡
        </span>
        {t("launchBanner")}
      </div>
    </SpringReveal>
  );
}

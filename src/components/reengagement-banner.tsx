"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyChurnContext } from "@/app/actions/churn";
import { REENGAGEMENT_FEATURES } from "@/lib/churn-features";

const DISMISS_KEY = "influexai_reengagement_dismissed_until";

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const until = localStorage.getItem(DISMISS_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

function dismissFor7Days() {
  const until = Date.now() + 7 * 86400000;
  localStorage.setItem(DISMISS_KEY, String(until));
}

export function ReengagementBanner() {
  const [visible, setVisible] = useState(false);
  const [daysAway, setDaysAway] = useState(0);

  useEffect(() => {
    if (isDismissed()) return;

    getMyChurnContext().then((ctx) => {
      if (!ctx) return;
      const days = ctx.daysSinceLastGeneration;
      const inactive = days === null || days >= 5;
      if (inactive) {
        setDaysAway(days === null ? 7 : days);
        setVisible(true);
      }
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        marginBottom: 16,
        padding: "16px 18px",
        borderRadius: 12,
        background: "rgba(180,255,0,0.06)",
        border: "1px solid rgba(180,255,0,0.15)",
        borderLeft: "4px solid #B4FF00",
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={() => {
          dismissFor7Days();
          setVisible(false);
        }}
        aria-label="Schließen"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "transparent",
          border: "none",
          color: "#505055",
          cursor: "pointer",
          fontSize: "1.1rem",
          lineHeight: 1,
        }}
      >
        ×
      </button>
      <p
        style={{
          margin: "0 0 10px",
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "#F0EFE8",
        }}
      >
        Willkommen zurück! 👋 Du warst {daysAway} Tage weg.
      </p>
      <p
        style={{
          margin: "0 0 8px",
          fontSize: "0.8rem",
          color: "#505055",
          fontWeight: 600,
        }}
      >
        Hier ist was neu ist:
      </p>
      <ul
        style={{
          margin: "0 0 14px",
          paddingLeft: 18,
          color: "rgba(240,239,232,0.65)",
          fontSize: "0.82rem",
          lineHeight: 1.6,
        }}
      >
        {REENGAGEMENT_FEATURES.map((f) => (
          <li key={f.href}>{f.name}</li>
        ))}
      </ul>
      <Link
        href={REENGAGEMENT_FEATURES[0].href}
        style={{
          display: "inline-block",
          padding: "8px 14px",
          borderRadius: 8,
          background: "#B4FF00",
          color: "#060608",
          fontSize: "0.8rem",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Feature ausprobieren →
      </Link>
    </div>
  );
}

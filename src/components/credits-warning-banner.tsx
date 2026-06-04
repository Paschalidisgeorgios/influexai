"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BannerTier = "warning" | "urgent" | "empty";

function getTier(credits: number): BannerTier | null {
  if (credits === 0) return "empty";
  if (credits <= 3) return "urgent";
  if (credits <= 10) return "warning";
  return null;
}

const DISMISS_KEY = "influexai_credits_banner_dismissed";

type Props = {
  credits: number;
};

export function CreditsWarningBanner({ credits }: Props) {
  const tier = getTier(credits);
  const [dismissedTier, setDismissedTier] = useState<string | null>(null);

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

  if (!tier) return null;
  if (tier !== "empty" && dismissedTier === tier) return null;

  const dismiss = () => {
    if (tier === "empty") return;
    try {
      sessionStorage.setItem(DISMISS_KEY, tier);
    } catch {
      /* ignore */
    }
    setDismissedTier(tier);
  };

  const creditsUrl = "/dashboard/credits";

  if (tier === "empty") {
    return (
      <div
        data-testid="credits-warning-banner"
        data-variant="empty"
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "rgba(180,255,0,0.08)",
          borderBottom: "1px solid rgba(180,255,0,0.25)",
          borderLeft: "3px solid #B4FF00",
        }}
      >
        <p
          style={{
            margin: "0 0 12px",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#F0EFE8",
            lineHeight: 1.5,
          }}
        >
          Du hast keine Credits mehr. Alle Features sind pausiert.
        </p>
        <Link
          href={creditsUrl}
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            padding: "11px 16px",
            borderRadius: 9,
            background: "#B4FF00",
            color: "#060608",
            fontWeight: 700,
            fontSize: "0.88rem",
            textDecoration: "none",
            fontFamily: "var(--font-dm), sans-serif",
          }}
        >
          Credits kaufen
        </Link>
      </div>
    );
  }

  if (tier === "urgent") {
    return (
      <div
        data-testid="credits-warning-banner"
        data-variant="urgent"
        style={{
          width: "100%",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          background: "rgba(239,68,68,0.1)",
          borderBottom: "1px solid rgba(239,68,68,0.2)",
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
          🚨 Nur noch {credits} Credits! Fast leer.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href={creditsUrl}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              background: "#ef4444",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.82rem",
              textDecoration: "none",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            Jetzt aufladen
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Banner schließen"
            style={{
              background: "transparent",
              border: "none",
              color: "#505055",
              cursor: "pointer",
              fontSize: "1.1rem",
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="credits-warning-banner"
      data-variant="warning"
      style={{
        width: "100%",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        background: "rgba(251,191,36,0.1)",
        borderBottom: "1px solid rgba(251,191,36,0.15)",
        borderLeft: "3px solid #fbbf24",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "0.85rem",
          fontWeight: 500,
          color: "#F0EFE8",
          flex: 1,
        }}
      >
        ⚡ Du hast noch {credits} Credits. Lade jetzt auf, um weiterzumachen.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link
          href={creditsUrl}
          style={{
            padding: "6px 14px",
            borderRadius: 7,
            background: "rgba(251,191,36,0.2)",
            border: "1px solid rgba(251,191,36,0.4)",
            color: "#fbbf24",
            fontWeight: 700,
            fontSize: "0.78rem",
            textDecoration: "none",
            fontFamily: "var(--font-dm), sans-serif",
          }}
        >
          Credits kaufen
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Banner schließen"
          style={{
            background: "transparent",
            border: "none",
            color: "#505055",
            cursor: "pointer",
            fontSize: "1.1rem",
            lineHeight: 1,
            padding: 4,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

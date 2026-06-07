"use client";

import { useEffect, useState } from "react";

const COOKIE_KEY = "influexai_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_KEY);
      if (!consent) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(COOKIE_KEY, "accepted");
    } catch {
      /* private mode */
    }
    setVisible(false);
  };

  const decline = () => {
    try {
      localStorage.setItem(COOKIE_KEY, "declined");
    } catch {
      /* private mode */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        background: "#0f0f12",
        borderTop: "1px solid rgba(180,255,0,0.2)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        fontFamily: "var(--font-dm), DM Sans, sans-serif",
      }}
      role="dialog"
      aria-label="Cookie-Einstellungen"
    >
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.65)",
          lineHeight: 1.5,
          margin: 0,
          flex: 1,
          minWidth: 260,
        }}
      >
        Wir verwenden Cookies um die Plattform bereitzustellen und zu
        verbessern.{" "}
        <a
          href="/cookies"
          style={{ color: "#B4FF00", textDecoration: "underline" }}
        >
          Mehr erfahren
        </a>
      </p>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={decline}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.04em",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.borderColor =
              "rgba(255,255,255,0.35)";
            (e.target as HTMLButtonElement).style.color =
              "rgba(255,255,255,0.8)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.borderColor =
              "rgba(255,255,255,0.15)";
            (e.target as HTMLButtonElement).style.color =
              "rgba(255,255,255,0.5)";
          }}
        >
          Ablehnen
        </button>

        <button
          type="button"
          onClick={accept}
          style={{
            padding: "8px 20px",
            borderRadius: 4,
            border: "none",
            background: "#B4FF00",
            color: "#060608",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.04em",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.opacity = "0.88";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.opacity = "1";
          }}
        >
          Akzeptieren
        </button>
      </div>
    </div>
  );
}

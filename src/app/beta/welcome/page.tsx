"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SITE_URL } from "@/lib/beta";

function WelcomeInner() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const [copied, setCopied] = useState(false);

  const signupUrl = code
    ? `${SITE_URL}/signup?beta=${encodeURIComponent(code)}`
    : `${SITE_URL}/signup`;

  const shareText = encodeURIComponent(
    `Ich habe einen Beta-Platz bei InfluexAI gesichert — nur 100 Spots! ${SITE_URL}/beta`
  );

  const copyLink = async () => {
    await navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060608",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-dm), sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          padding: 36,
          borderRadius: 20,
          background: "#0f0f12",
          border: "1px solid rgba(180,255,0,0.25)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>🎉</div>
        <h1
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "2.2rem",
            letterSpacing: "0.02em",
            color: "#F0EFE8",
            marginBottom: 8,
          }}
        >
          Du bist drin!
        </h1>
        <p
          style={{
            color: "#505055",
            fontSize: "0.9rem",
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          Dein Beta-Platz ist gesichert. Erstell jetzt deinen Account und hol
          dir 50 Gratis-Credits + 30% Lifetime-Rabatt.
        </p>

        {code && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: "rgba(180,255,0,0.08)",
              border: "1px solid rgba(180,255,0,0.25)",
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontSize: "0.72rem",
                color: "#505055",
                margin: "0 0 8px",
              }}
            >
              Dein Beta-Code
            </p>
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: "#B4FF00",
                margin: 0,
              }}
            >
              {code}
            </p>
          </div>
        )}

        <p
          style={{
            color: "rgba(240,239,232,0.5)",
            fontSize: "0.85rem",
            marginBottom: 12,
          }}
        >
          Erstell deinen Account mit diesem Link:
        </p>

        <Link
          href={signupUrl}
          style={{
            display: "block",
            padding: "14px 20px",
            borderRadius: 10,
            background: "#B4FF00",
            color: "#060608",
            fontWeight: 800,
            textDecoration: "none",
            marginBottom: 12,
            fontSize: "0.95rem",
          }}
        >
          Account erstellen →
        </Link>

        <button
          type="button"
          onClick={copyLink}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: copied ? "#B4FF00" : "#505055",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "0.82rem",
            marginBottom: 24,
          }}
        >
          {copied ? "✓ Link kopiert" : "Link kopieren"}
        </button>

        <p
          style={{
            fontSize: "0.75rem",
            color: "#505055",
            marginBottom: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Teile die Beta mit Freunden
        </p>
        <p style={{ fontSize: "0.78rem", color: "#505055", marginBottom: 16 }}>
          Nur 100 Plätze — beeil dich, bevor sie weg sind.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#F0EFE8",
              fontSize: "0.82rem",
              textDecoration: "none",
            }}
          >
            𝕏 Teilen
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${SITE_URL}/beta`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#F0EFE8",
              fontSize: "0.82rem",
              textDecoration: "none",
            }}
          >
            LinkedIn
          </a>
        </div>

        <Link
          href="/beta"
          style={{
            display: "inline-block",
            marginTop: 28,
            color: "#505055",
            fontSize: "0.82rem",
            textDecoration: "none",
          }}
        >
          ← Zurück zur Beta-Seite
        </Link>
      </div>
    </div>
  );
}

export default function BetaWelcomePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#060608",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#505055",
          }}
        >
          Laden…
        </div>
      }
    >
      <WelcomeInner />
    </Suspense>
  );
}

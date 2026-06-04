"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Gift } from "lucide-react";
import {
  getReferralDashboard,
  type ReferralDashboardData,
} from "@/app/actions/referral";

declare global {
  interface Window {
    QRCode?: new (
      el: HTMLElement,
      options: {
        text: string;
        width: number;
        height: number;
        colorDark?: string;
        colorLight?: string;
      }
    ) => void;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrLoaded = useRef(false);

  useEffect(() => {
    getReferralDashboard().then((res) => {
      if ("error" in res) setError(res.error);
      else setData(res);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!showQr || !data || !qrRef.current) return;

    const renderQr = () => {
      if (!window.QRCode || !qrRef.current) return;
      qrRef.current.innerHTML = "";
      new window.QRCode(qrRef.current, {
        text: data.referralLink,
        width: 200,
        height: 200,
        colorDark: "#060608",
        colorLight: "#ffffff",
      });
    };

    if (window.QRCode) {
      renderQr();
      return;
    }

    if (qrLoaded.current) return;
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.async = true;
    script.onload = () => {
      qrLoaded.current = true;
      renderQr();
    };
    document.body.appendChild(script);
  }, [showQr, data]);

  const copyLink = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareMessage = data
    ? `Ich erstelle meine YouTube Shorts mit KI 🚀 Probier InfluexAI aus und bekomm 5 Gratis-Credits: ${data.referralLink}`
    : "";

  const shareUrls = data
    ? {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(data.referralLink)}&text=${encodeURIComponent("Probier InfluexAI — 5 Gratis-Credits!")}`,
      }
    : null;

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          color: "#505055",
          padding: 40,
        }}
      >
        Laden…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", color: "#ff6b7a" }}>
        {error ?? "Fehler"}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <Gift size={32} color="#B4FF00" strokeWidth={2} />
        <div>
          <h1
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              letterSpacing: "0.02em",
              color: "#F0EFE8",
              margin: 0,
              lineHeight: 1,
            }}
          >
            Freunde einladen
          </h1>
          <p
            style={{ color: "#505055", fontSize: "0.9rem", margin: "6px 0 0" }}
          >
            Verdiene Credits für jeden Freund
          </p>
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          padding: 28,
          borderRadius: 18,
          marginBottom: 24,
          background: "rgba(180,255,0,0.06)",
          border: "1px solid rgba(180,255,0,0.2)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "1.5rem",
            color: "#F0EFE8",
            margin: "0 0 8px",
          }}
        >
          Verdiene Credits für jeden Freund
        </h2>
        <p
          style={{
            color: "#505055",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            margin: "0 0 20px",
          }}
        >
          Du bekommst <strong style={{ color: "#B4FF00" }}>10 Credits</strong>,
          wenn sich dein Freund anmeldet, und nochmal{" "}
          <strong style={{ color: "#B4FF00" }}>20 Credits</strong>, wenn er
          kauft. Dein Freund erhält{" "}
          <strong style={{ color: "#B4FF00" }}>5 Bonus-Credits</strong>.
        </p>

        <div
          style={{
            padding: "14px 16px",
            borderRadius: 10,
            background: "#18181d",
            border: "1px solid rgba(255,255,255,0.09)",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            color: "#B4FF00",
            wordBreak: "break-all",
            marginBottom: 12,
          }}
        >
          {data.referralLink}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            type="button"
            onClick={copyLink}
            style={{
              padding: "10px 20px",
              borderRadius: 9,
              border: "none",
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            {copied ? "Kopiert! ✓" : "Kopieren"}
          </button>
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            style={{
              padding: "10px 20px",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "#F0EFE8",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            QR-Code
          </button>
        </div>

        {showQr && (
          <div
            style={{
              marginTop: 20,
              padding: 20,
              borderRadius: 12,
              background: "#fff",
              display: "inline-block",
            }}
          >
            <div ref={qrRef} />
          </div>
        )}
      </div>

      {/* Share */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}
      >
        {shareUrls && (
          <>
            <a
              href={shareUrls.twitter}
              target="_blank"
              rel="noopener noreferrer"
              style={shareBtnStyle}
            >
              𝕏 Teilen
            </a>
            <a
              href={shareUrls.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              style={shareBtnStyle}
            >
              WhatsApp
            </a>
            <a
              href={shareUrls.telegram}
              target="_blank"
              rel="noopener noreferrer"
              style={shareBtnStyle}
            >
              Telegram
            </a>
          </>
        )}
        <button type="button" onClick={copyLink} style={shareBtnStyle}>
          Link kopieren
        </button>
      </div>

      {/* Stats */}
      <h2
        style={{
          fontFamily: "var(--font-bebas), sans-serif",
          fontSize: "1.2rem",
          color: "#F0EFE8",
          marginBottom: 12,
        }}
      >
        Deine Referrals
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {[
          { label: "Angemeldete Freunde", value: data.stats.signedUp },
          { label: "Verdiente Credits", value: data.stats.creditsEarned },
          { label: "Käufe deiner Freunde", value: data.stats.purchased },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: 18,
              borderRadius: 14,
              background: "#0f0f12",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#B4FF00",
                fontFamily: "var(--font-bebas), sans-serif",
              }}
            >
              {s.value}
            </div>
            <div
              style={{ fontSize: "0.78rem", color: "#505055", marginTop: 4 }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* History */}
      <div
        style={{
          borderRadius: 14,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.07)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#505055",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          <span>Datum</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Credits</span>
        </div>
        {data.history.length === 0 ? (
          <p
            style={{
              padding: 20,
              color: "#505055",
              fontSize: "0.88rem",
              margin: 0,
            }}
          >
            Noch keine Referrals. Teile deinen Link!
          </p>
        ) : (
          data.history.map((row) => (
            <div
              key={row.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                fontSize: "0.88rem",
                color: "#F0EFE8",
              }}
            >
              <span>
                {formatDate(row.date)}
                <span
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    color: "#505055",
                  }}
                >
                  {row.label}
                </span>
              </span>
              <span>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 99,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    background:
                      row.status === "purchased"
                        ? "rgba(180,255,0,0.15)"
                        : "rgba(255,255,255,0.06)",
                    color: row.status === "purchased" ? "#B4FF00" : "#505055",
                  }}
                >
                  {row.status === "purchased" ? "Hat gekauft" : "Angemeldet"}
                </span>
              </span>
              <span
                style={{
                  textAlign: "right",
                  color: "#B4FF00",
                  fontWeight: 700,
                }}
              >
                +{row.creditsEarned}
              </span>
            </div>
          ))
        )}
      </div>

      <p style={{ marginTop: 16, fontSize: "0.78rem", color: "#505055" }}>
        Dein Code:{" "}
        <strong style={{ color: "#B4FF00" }}>{data.referralCode}</strong>
      </p>
    </div>
  );
}

const shareBtnStyle: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#F0EFE8",
  fontSize: "0.82rem",
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: "var(--font-dm), sans-serif",
};

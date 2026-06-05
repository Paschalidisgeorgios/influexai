"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { joinBeta, joinBetaWaitlist } from "@/app/actions/beta";
import type { BetaPublicStats } from "@/app/actions/beta";
import { BETA_NICHES } from "@/lib/beta";

type Props = {
  initialStats: BetaPublicStats;
};

function progressBlocks(taken: number, total: number): string {
  const filled = Math.round((taken / total) * 20);
  return "█".repeat(filled) + "░".repeat(20 - filled);
}

export function BetaPageClient({ initialStats }: Props) {
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [niche, setNiche] = useState(BETA_NICHES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    const load = () => {
      fetch("/api/beta/stats")
        .then((r) => r.json())
        .then((data) => {
          if (data.taken !== undefined) setStats(data);
        })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, []);

  const spots = stats.spotsLeft;
  const urgency = spots <= 5 ? "critical" : spots <= 20 ? "warning" : "normal";

  const badgeStyle: CSSProperties = {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: 99,
    fontSize: "0.78rem",
    fontWeight: 800,
    letterSpacing: "0.06em",
    marginBottom: 20,
    background:
      urgency === "critical"
        ? "rgba(255,71,87,0.2)"
        : urgency === "warning"
          ? "rgba(255,71,87,0.12)"
          : "rgba(180,255,0,0.12)",
    border: `1px solid ${
      urgency === "critical"
        ? "#ff6b7a"
        : urgency === "warning"
          ? "rgba(255,71,87,0.5)"
          : "rgba(180,255,0,0.35)"
    }`,
    color: urgency === "normal" ? "#B4FF00" : "#ff6b7a",
    animation:
      urgency === "critical"
        ? "betaPulse 1.2s ease-in-out infinite"
        : undefined,
  };

  const handleSubmit = async (waitlist = false) => {
    setLoading(true);
    setError(null);

    if (waitlist) {
      const res = await joinBetaWaitlist({ email, name, niche });
      setLoading(false);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setError(null);
      alert("Du bist auf der Warteliste. Wir melden uns per E-Mail!");
      setShowWaitlist(false);
      return;
    }

    const res = await joinBeta({ email, name, niche });
    setLoading(false);

    if (!res.success) {
      if (res.error === "FULL") {
        setShowWaitlist(true);
        return;
      }
      setError(res.error);
      return;
    }

    if ("waitlisted" in res && res.waitlisted) return;

    router.push(`/beta/welcome?code=${encodeURIComponent(res.code)}`);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    background: "#18181d",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#F0EFE8",
    fontSize: "0.95rem",
    outline: "none" as const,
    fontFamily: "inherit",
    marginBottom: 12,
  };

  const benefits = [
    "50% Rabatt auf dein erstes Credit-Paket",
    "Beta Creator Badge (forever im Profil sichtbar)",
    "Direkter Zugang zum Founder (Feedback-Kanal)",
    "Feature-Requests werden priorisiert",
    "Lifetime 20% Rabatt auf alle weiteren Käufe",
  ];

  const features = [
    {
      icon: "📝",
      title: "Script Generator",
      desc: "Fertige Video-Scripts in 30 Sekunden",
    },
    {
      icon: "🔥",
      title: "Outlier Detector",
      desc: "Finde virale Video-Ideen bevor alle anderen",
    },
    {
      icon: "📈",
      title: "Niche Analyzer",
      desc: "Deine profitable Nische in 3 Minuten",
    },
  ];

  const faqs = [
    {
      q: "Was kostet InfluexAI nach der Beta?",
      a: "Beta-User behalten 20% Lifetime-Rabatt auf alle Credit-Pakete. Der erste Kauf ist 50% günstiger.",
    },
    {
      q: "Wann endet die Beta?",
      a: "Die Beta endet wenn alle 100 Plätze vergeben sind oder in 30 Tagen — was zuerst kommt.",
    },
    {
      q: "Brauche ich eine Kreditkarte?",
      a: "Nur wenn du Credits kaufst — kein Abo. Credits ab €4,99, einmaliger Kauf via Stripe.",
    },
  ];

  return (
    <div
      style={{ minHeight: "100vh", background: "#060608", color: "#F0EFE8" }}
    >
      <style>{`
        @keyframes betaPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,122,0.5); }
          50% { box-shadow: 0 0 0 10px rgba(255,107,122,0); }
        }
      `}</style>

      <header
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "1.1rem",
            color: "#F0EFE8",
            textDecoration: "none",
            letterSpacing: "0.04em",
          }}
        >
          Influex<span style={{ color: "#B4FF00" }}>AI</span>
        </a>
        <a
          href="/login"
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "0.85rem",
            textDecoration: "none",
          }}
        >
          Login
        </a>
      </header>

      <main
        style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 64px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={badgeStyle}>
            {urgency === "critical"
              ? `⚠️ Nur noch ${spots} Plätze!`
              : urgency === "warning"
                ? `⚠️ Nur noch ${spots} Plätze frei`
                : `🔥 BETA · Nur noch ${spots} Plätze frei`}
          </span>

          <h1
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(2.2rem, 6vw, 3.2rem)",
              letterSpacing: "0.02em",
              lineHeight: 1.05,
              margin: "0 0 16px",
            }}
          >
            Werde einer der ersten{" "}
            <span style={{ color: "#B4FF00" }}>100 InfluexAI Creators</span>
          </h1>

          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 20 }}>
            Beta-User bekommen:
          </p>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 28px",
              textAlign: "left",
              maxWidth: 400,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {benefits.map((b) => (
              <li
                key={b}
                style={{
                  marginBottom: 10,
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                <span style={{ color: "#B4FF00", marginRight: 8 }}>✓</span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginBottom: 28,
            padding: "16px 18px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "0.82rem",
              color: "#B4FF00",
              margin: "0 0 10px",
              letterSpacing: "0.02em",
            }}
          >
            {progressBlocks(stats.taken, stats.total)}{" "}
            <span style={{ color: "rgba(255,255,255,0.5)" }}>
              {stats.taken}/{stats.total} Plätze vergeben
            </span>
          </p>
          <div
            style={{
              height: 6,
              background: "#222228",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(stats.taken / stats.total) * 100}%`,
                height: "100%",
                background: "#B4FF00",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Form */}
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "#0f0f12",
            border: "1px solid rgba(180,255,0,0.15)",
            marginBottom: 32,
          }}
        >
          {showWaitlist ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#F0EFE8", marginBottom: 16 }}>
                Die 100 Beta-Plätze sind vergeben. Auf Warteliste setzen?
              </p>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={loading || !email}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 10,
                  border: "none",
                  background: "#B4FF00",
                  color: "#060608",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  marginBottom: 10,
                }}
              >
                Auf Warteliste
              </button>
              <button
                type="button"
                onClick={() => setShowWaitlist(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.65)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Zurück
              </button>
            </div>
          ) : (
            <>
              <input
                type="email"
                placeholder="E-Mail *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Creator Name / Kanal (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {BETA_NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {error && error !== "FULL" && (
                <p
                  style={{
                    color: "#ff6b7a",
                    fontSize: "0.85rem",
                    marginBottom: 12,
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={loading || !email}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 10,
                  border: "none",
                  background: email ? "#B4FF00" : "#333",
                  color: "#060608",
                  fontWeight: 800,
                  fontSize: "1rem",
                  cursor: email && !loading ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                }}
              >
                {loading ? "Wird gesichert…" : "Jetzt Beta-Platz sichern →"}
              </button>
            </>
          )}
        </div>

        {/* Social proof */}
        {stats.recent.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <p
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.65)",
                marginBottom: 12,
              }}
            >
              Bereits dabei:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.recent.map((r, i) => (
                <p
                  key={i}
                  style={{
                    margin: 0,
                    fontSize: "0.88rem",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  <span style={{ color: "#F0EFE8" }}>{r.displayName}</span>
                  {" · "}
                  <span style={{ color: "#B4FF00" }}>{r.niche}</span>
                  {" · "}
                  {r.relativeTime}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <h2
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "1.5rem",
            color: "#B4FF00",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          Was du bekommst
        </h2>
        <div
          style={{
            display: "grid",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                padding: 18,
                borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span style={{ fontSize: "1.5rem", marginRight: 10 }}>
                {f.icon}
              </span>
              <strong style={{ color: "#F0EFE8" }}>{f.title}</strong>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "1.5rem",
            color: "#F0EFE8",
            marginBottom: 16,
          }}
        >
          FAQ
        </h2>
        {faqs.map((faq) => (
          <div key={faq.q} style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 700, color: "#F0EFE8", marginBottom: 6 }}>
              {faq.q}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.6,
              }}
            >
              {faq.a}
            </p>
          </div>
        ))}
      </main>
    </div>
  );
}

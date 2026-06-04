"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerReferralOnSignup } from "@/app/actions/referral";
import { invokeWelcomeNurtureEmail } from "@/lib/nurture-email";
import { trackAbEvent } from "@/lib/ab-tracking";
import { normalizeReferralCode } from "@/lib/referral-code";
import { applyBetaOnSignup } from "@/app/actions/beta";

const REFERRAL_STORAGE_KEY = "referral_code";
const BETA_STORAGE_KEY = "beta_code";

function SignupPageInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [betaCode, setBetaCode] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const beta = searchParams.get("beta");
    if (beta) {
      const code = beta.trim().toUpperCase();
      setBetaCode(code);
      try {
        localStorage.setItem(BETA_STORAGE_KEY, code);
      } catch {
        /* ignore */
      }
    } else {
      try {
        const stored = localStorage.getItem(BETA_STORAGE_KEY);
        if (stored) setBetaCode(stored.trim().toUpperCase());
      } catch {
        /* ignore */
      }
    }

    const ref = searchParams.get("ref");
    if (ref) {
      const code = normalizeReferralCode(ref);
      if (code) {
        setReferralCode(code);
        try {
          localStorage.setItem(REFERRAL_STORAGE_KEY, code);
        } catch {
          /* ignore */
        }
      }
    } else {
      try {
        const stored = localStorage.getItem(REFERRAL_STORAGE_KEY);
        if (stored) setReferralCode(normalizeReferralCode(stored));
      } catch {
        /* ignore */
      }
    }
  }, [searchParams]);

  const handleSignup = async () => {
    if (!email || !password || !name) {
      setError("Bitte alle Felder ausfüllen.");
      return;
    }
    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen haben.");
      return;
    }
    setLoading(true);
    setError("");

    const ref =
      referralCode ||
      (typeof window !== "undefined"
        ? localStorage.getItem(REFERRAL_STORAGE_KEY)
        : null);

    const beta =
      betaCode ||
      (typeof window !== "undefined"
        ? localStorage.getItem(BETA_STORAGE_KEY)
        : null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          ...(ref ? { referred_by: normalizeReferralCode(ref) } : {}),
          ...(beta ? { beta_code: beta.trim().toUpperCase() } : {}),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user && ref) {
      await registerReferralOnSignup(data.user.id, normalizeReferralCode(ref));
      try {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }

    if (data.user) {
      void invokeWelcomeNurtureEmail(data.user.id);
      if (beta) {
        await applyBetaOnSignup(data.user.id, beta.trim().toUpperCase());
        try {
          localStorage.removeItem(BETA_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
    }

    if (data.session) {
      void trackAbEvent("signup_complete");
      router.push("/dashboard");
      router.refresh();
      setLoading(false);
      return;
    }

    void trackAbEvent("signup_complete");
    setSuccess(true);
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    background: "#18181d",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#F0EFE8",
    fontSize: "0.95rem",
    outline: "none",
    fontFamily: "var(--font-dm), sans-serif",
    transition: "border-color 0.2s",
  };

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#060608",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: 400,
            padding: 36,
            borderRadius: 20,
            background: "#0f0f12",
            border: "1px solid rgba(180,255,0,0.2)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
          <h2
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.8rem",
              letterSpacing: "0.02em",
              color: "#F0EFE8",
              marginBottom: 10,
            }}
          >
            Fast fertig!
          </h2>
          <p style={{ color: "#505055", fontSize: "0.9rem", lineHeight: 1.7 }}>
            Wir haben dir eine Bestätigungs-E-Mail an{" "}
            <strong style={{ color: "#F0EFE8" }}>{email}</strong> geschickt.
            Bitte klicke auf den Link um dein Konto zu aktivieren.
            {betaCode ? (
              <>
                <br />
                <br />
                Deine{" "}
                <strong style={{ color: "#B4FF00" }}>
                  50 Beta-Credits
                </strong>{" "}
                werden nach der Bestätigung aktiviert.
              </>
            ) : referralCode ? (
              <>
                <br />
                <br />
                Deine{" "}
                <strong style={{ color: "#B4FF00" }}>
                  5 Bonus-Credits
                </strong>{" "}
                werden nach der Bestätigung gutgeschrieben.
              </>
            ) : null}
          </p>
          <Link
            href="/login"
            style={{
              display: "block",
              marginTop: 24,
              padding: "12px",
              borderRadius: 10,
              background: "#B4FF00",
              color: "#060608",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            Zum Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060608",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "var(--font-dm), sans-serif",
      }}
    >
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#B4FF00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.1rem",
              color: "#060608",
            }}
          >
            I
          </div>
          <span
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.4rem",
              letterSpacing: "0.04em",
              color: "#F0EFE8",
            }}
          >
            Influex<span style={{ color: "#B4FF00" }}>AI</span>
          </span>
        </div>
      </Link>

      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 36,
          borderRadius: 20,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "2rem",
            letterSpacing: "0.02em",
            color: "#F0EFE8",
            marginBottom: 6,
          }}
        >
          Konto erstellen
        </h1>
        <p style={{ color: "#505055", fontSize: "0.875rem", marginBottom: 20 }}>
          {betaCode
            ? "50 Beta-Credits + 30% Lifetime-Rabatt. Keine Kreditkarte."
            : "50 gratis Credits zum Starten. Keine Kreditkarte."}
        </p>

        {betaCode && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              marginBottom: 20,
              background: "rgba(180,255,0,0.08)",
              border: "1px solid rgba(180,255,0,0.25)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#B4FF00",
              }}
            >
              🔥 Beta Creator — 50 Credits & 30% Rabatt forever
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "0.78rem",
                color: "#505055",
              }}
            >
              Code: {betaCode}
            </p>
          </div>
        )}

        {referralCode && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              marginBottom: 20,
              background: "rgba(180,255,0,0.08)",
              border: "1px solid rgba(180,255,0,0.25)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#B4FF00",
              }}
            >
              🎁 Du erhältst 5 Bonus-Credits — eingeladen von einem InfluexAI
              Creator!
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "0.78rem",
                color: "#505055",
              }}
            >
              Code: {referralCode}
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 9,
              marginBottom: 20,
              background: "rgba(244,63,94,0.1)",
              border: "1px solid rgba(244,63,94,0.25)",
              color: "#ff6b7a",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#505055",
              display: "block",
              marginBottom: 6,
            }}
          >
            Name
          </label>
          <input
            type="text"
            data-testid="auth-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dein Name"
            style={inputStyle}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(180,255,0,0.4)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.09)")
            }
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#505055",
              display: "block",
              marginBottom: 6,
            }}
          >
            E-Mail
          </label>
          <input
            type="email"
            data-testid="auth-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.com"
            style={inputStyle}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(180,255,0,0.4)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.09)")
            }
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#505055",
              display: "block",
              marginBottom: 6,
            }}
          >
            Passwort
          </label>
          <input
            type="password"
            data-testid="auth-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mindestens 6 Zeichen"
            style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(180,255,0,0.4)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(255,255,255,0.09)")
            }
          />
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 10,
            background: loading ? "#8aCC00" : "#B4FF00",
            color: "#060608",
            border: "none",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: loading ? "default" : "pointer",
            fontFamily: "var(--font-dm), sans-serif",
          }}
        >
          {loading ? "Wird erstellt..." : "Kostenlos starten →"}
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: "0.85rem",
            color: "#505055",
          }}
        >
          Bereits ein Konto?{" "}
          <Link
            href="/login"
            style={{
              color: "#B4FF00",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Einloggen
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={<div style={{ minHeight: "100vh", background: "#060608" }} />}
    >
      <SignupPageInner />
    </Suspense>
  );
}

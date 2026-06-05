"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { invokeWelcomeNurtureEmail } from "@/lib/nurture-email";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        if (data.user) void invokeWelcomeNurtureEmail(data.user.id);
        setSuccess("Bestätigungs-E-Mail gesendet! Bitte prüfe dein Postfach.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError("E-Mail oder Passwort falsch.");
      } else {
        router.push("/dashboard");
      }
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060608",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          height: 500,
          background:
            "radial-gradient(circle, rgba(180,255,0,0.05), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <a
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          marginBottom: 40,
        }}
      >
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
            fontSize: "1.2rem",
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
      </a>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "36px 32px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "2rem",
            letterSpacing: "0.02em",
            color: "#F0EFE8",
            marginBottom: 4,
          }}
        >
          {mode === "login" ? "Willkommen zurück" : "Konto erstellen"}
        </h1>
        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", marginBottom: 28 }}>
          {mode === "login"
            ? "Melde dich bei deinem InfluexAI Konto an."
            : "Jetzt starten — Credits ab €4,99."}
        </p>

        {/* Toggle */}
        <div
          style={{
            display: "flex",
            background: "#18181d",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: 3,
            marginBottom: 24,
            gap: 3,
          }}
        >
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
                setSuccess("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-dm), sans-serif",
                fontWeight: 600,
                fontSize: "0.875rem",
                transition: "all 0.2s",
                background: mode === m ? "#F0EFE8" : "transparent",
                color: mode === m ? "#060608" : "rgba(255,255,255,0.65)",
              }}
            >
              {m === "login" ? "Einloggen" : "Registrieren"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <div>
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.65)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Name"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  background: "#18181d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#F0EFE8",
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-dm), sans-serif",
                  outline: "none",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(180,255,0,0.4)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                }
              />
            </div>
          )}

          <div>
            <label
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.65)",
                display: "block",
                marginBottom: 6,
              }}
            >
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.com"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                background: "#18181d",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#F0EFE8",
                fontSize: "0.9rem",
                fontFamily: "var(--font-dm), sans-serif",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(180,255,0,0.4)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.08)")
              }
            />
          </div>

          <div>
            <label
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.65)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                background: "#18181d",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#F0EFE8",
                fontSize: "0.9rem",
                fontFamily: "var(--font-dm), sans-serif",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(180,255,0,0.4)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.08)")
              }
            />
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: 9,
              background: "rgba(244,63,94,0.1)",
              border: "1px solid rgba(244,63,94,0.25)",
              color: "#ff6b7a",
              fontSize: "0.83rem",
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: 9,
              background: "rgba(180,255,0,0.08)",
              border: "1px solid rgba(180,255,0,0.25)",
              color: "#B4FF00",
              fontSize: "0.83rem",
            }}
          >
            {success}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "13px",
            borderRadius: 10,
            background: loading ? "rgba(180,255,0,0.5)" : "#B4FF00",
            color: "#060608",
            border: "none",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: loading ? "default" : "pointer",
            fontFamily: "var(--font-dm), sans-serif",
            transition: "all 0.2s",
          }}
        >
          {loading
            ? "Bitte warten..."
            : mode === "login"
              ? "Einloggen →"
              : "Konto erstellen →"}
        </button>

        {/* Back to landing */}
        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: "0.82rem",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          <a href="/" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none" }}>
            ← Zurück zur Startseite
          </a>
        </p>
      </div>

      {mode === "signup" && (
        <p
          style={{
            marginTop: 16,
            fontSize: "0.78rem",
            color: "rgba(255,255,255,0.65)",
            textAlign: "center",
          }}
        >
          ✓ Sofort verfügbar · ✓ Einfacher Einstieg · ✓ DSGVO-konform
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async () => {
    if (!email || !password || !name) { setError("Bitte alle Felder ausfüllen."); return; }
    if (password.length < 6) { setError("Passwort muss mindestens 6 Zeichen haben."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    background: "#18181d", border: "1px solid rgba(255,255,255,0.09)",
    color: "#F0EFE8", fontSize: "0.95rem", outline: "none",
    fontFamily: "var(--font-dm), sans-serif", transition: "border-color 0.2s",
  };

  if (success) {
    return (
      <div style={{
        minHeight: "100vh", background: "#060608",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}>
        <div style={{
          textAlign: "center", maxWidth: 400,
          padding: 36, borderRadius: 20,
          background: "#0f0f12", border: "1px solid rgba(180,255,0,0.2)",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
          <h2 style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "1.8rem", letterSpacing: "0.02em",
            color: "#F0EFE8", marginBottom: 10,
          }}>Fast fertig!</h2>
          <p style={{ color: "#505055", fontSize: "0.9rem", lineHeight: 1.7 }}>
            Wir haben dir eine Bestätigungs-E-Mail an <strong style={{ color: "#F0EFE8" }}>{email}</strong> geschickt.
            Bitte klicke auf den Link um dein Konto zu aktivieren.
          </p>
          <Link href="/login" style={{
            display: "block", marginTop: 24, padding: "12px",
            borderRadius: 10, background: "#B4FF00",
            color: "#060608", textDecoration: "none",
            fontWeight: 700, fontSize: "0.9rem",
          }}>
            Zum Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#060608",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "var(--font-dm), sans-serif",
    }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "#B4FF00", display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "1.1rem", color: "#060608",
          }}>I</div>
          <span style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "1.4rem", letterSpacing: "0.04em", color: "#F0EFE8",
          }}>
            Influex<span style={{ color: "#B4FF00" }}>AI</span>
          </span>
        </div>
      </Link>

      <div style={{
        width: "100%", maxWidth: 400, padding: 36,
        borderRadius: 20, background: "#0f0f12",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <h1 style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "2rem", letterSpacing: "0.02em",
          color: "#F0EFE8", marginBottom: 6,
        }}>Konto erstellen</h1>
        <p style={{ color: "#505055", fontSize: "0.875rem", marginBottom: 28 }}>
          50 gratis Credits zum Starten. Keine Kreditkarte.
        </p>

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 9, marginBottom: 20,
            background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)",
            color: "#ff6b7a", fontSize: "0.85rem",
          }}>{error}</div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#505055", display: "block", marginBottom: 6 }}>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Dein Name" style={inputStyle}
            onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = "rgba(180,255,0,0.4)"}
            onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.09)"}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#505055", display: "block", marginBottom: 6 }}>E-Mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.com" style={inputStyle}
            onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = "rgba(180,255,0,0.4)"}
            onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.09)"}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#505055", display: "block", marginBottom: 6 }}>Passwort</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Mindestens 6 Zeichen" style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = "rgba(180,255,0,0.4)"}
            onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.09)"}
          />
        </div>

        <button
          onClick={handleSignup} disabled={loading}
          style={{
            width: "100%", padding: "13px",
            borderRadius: 10, background: loading ? "#8aCC00" : "#B4FF00",
            color: "#060608", border: "none", fontWeight: 700,
            fontSize: "0.95rem", cursor: loading ? "default" : "pointer",
            fontFamily: "var(--font-dm), sans-serif",
          }}
        >
          {loading ? "Wird erstellt..." : "Kostenlos starten →"}
        </button>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "#505055" }}>
          Bereits ein Konto?{" "}
          <Link href="/login" style={{ color: "#B4FF00", textDecoration: "none", fontWeight: 600 }}>
            Einloggen
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LoginPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t("fill_fields"));
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(t("bad_credentials"));
    } else {
      router.push("/dashboard");
      router.refresh();
    }
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
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <LanguageSwitcher compact />
      </div>
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
          {t("login_title")}
        </h1>
        <p style={{ color: "#505055", fontSize: "0.875rem", marginBottom: 28 }}>
          {t("login_subtitle")}
        </p>

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
            {t("email")}
          </label>
          <input
            type="email"
            data-testid="auth-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.com"
            style={inputStyle}
            onFocus={(e) =>
              ((e.target as HTMLInputElement).style.borderColor =
                "rgba(180,255,0,0.4)")
            }
            onBlur={(e) =>
              ((e.target as HTMLInputElement).style.borderColor =
                "rgba(255,255,255,0.09)")
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
            {t("password")}
          </label>
          <input
            type="password"
            data-testid="auth-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            onFocus={(e) =>
              ((e.target as HTMLInputElement).style.borderColor =
                "rgba(180,255,0,0.4)")
            }
            onBlur={(e) =>
              ((e.target as HTMLInputElement).style.borderColor =
                "rgba(255,255,255,0.09)")
            }
          />
        </div>

        <button
          onClick={handleLogin}
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
          {loading ? "…" : `${t("login_button")} →`}
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: "0.85rem",
            color: "#505055",
          }}
        >
          {t("no_account")}{" "}
          <Link
            href="/signup"
            style={{
              color: "#B4FF00",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {t("signup_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}

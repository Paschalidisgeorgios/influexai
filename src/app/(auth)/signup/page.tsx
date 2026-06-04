"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerReferralOnSignup } from "@/app/actions/referral";
import { invokeWelcomeNurtureEmail } from "@/lib/nurture-email";
import { trackAbEvent } from "@/lib/ab-tracking";
import { normalizeReferralCode } from "@/lib/referral-code";
import { applyBetaOnSignup } from "@/app/actions/beta";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthGreetingLine } from "@/components/auth/auth-greeting-line";
import {
  authInputClass,
  authLabelClass,
} from "@/components/auth/auth-input-classes";
import {
  getPasswordStrength,
  strengthBarColors,
} from "@/lib/password-strength";

const REFERRAL_STORAGE_KEY = "referral_code";
const BETA_STORAGE_KEY = "beta_code";

function SignupPageInner() {
  const t = useTranslations("auth");
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

  const strength = getPasswordStrength(password);
  const strengthLabelKeys = [
    "password_too_short",
    "password_weak",
    "password_medium",
    "password_strong",
  ] as const;

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

  const handleSignup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password || !name) {
      setError(t("fill_fields"));
      return;
    }
    if (password.length < 6) {
      setError(t("password_too_short"));
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

  if (success) {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-white text-2xl font-semibold mb-3">Fast fertig!</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          Wir haben dir eine Bestätigungs-E-Mail an{" "}
          <strong className="text-white">{email}</strong> geschickt.
          {betaCode && (
            <>
              <br />
              <br />
              <span className="text-[#B4FF00]">50% Erstkauf-Rabatt</span> und
              Lifetime-Rabatt werden nach der Bestätigung aktiviert.
            </>
          )}
          {referralCode && !betaCode && (
            <>
              <br />
              <br />
              <span className="text-[#B4FF00]">5 Bonus-Credits</span> nach
              Bestätigung.
            </>
          )}
        </p>
        <Link
          href="/login"
          className="inline-block w-full bg-[#B4FF00] text-black font-semibold py-3 rounded-xl text-sm"
        >
          {t("login_link")}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto relative">
      <div className="absolute top-0 right-0 lg:-top-2">
        <LanguageSwitcher compact />
      </div>

      <div className="lg:hidden text-[#B4FF00] font-bold text-xl mb-8 font-[family-name:var(--font-bebas)] tracking-wide">
        InfluexAI
      </div>

      <AuthGreetingLine />

      <h1 className="text-white text-2xl font-semibold mb-2">
        {t("signup_title")}
      </h1>
      <p className="text-white/40 text-sm mb-6">{t("signup_subtitle")}</p>

      {betaCode && (
        <div className="mb-4 p-3 rounded-xl bg-[#B4FF00]/10 border border-[#B4FF00]/25 text-sm">
          <p className="text-[#B4FF00] font-semibold">
            🔥 Beta — 50% Erstkauf + 20% Lifetime
          </p>
          <p className="text-white/40 text-xs mt-1">Code: {betaCode}</p>
        </div>
      )}

      {referralCode && (
        <div className="mb-4 p-3 rounded-xl bg-[#B4FF00]/10 border border-[#B4FF00]/25 text-sm">
          <p className="text-[#B4FF00] font-semibold">
            🎁 5 Bonus-Credits — Einladung
          </p>
          <p className="text-white/40 text-xs mt-1">Code: {referralCode}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSignup}>
        <div>
          <label className={authLabelClass}>{t("name")}</label>
          <input
            type="text"
            data-testid="auth-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            className={authInputClass}
            autoComplete="name"
          />
        </div>

        <div>
          <label className={authLabelClass}>{t("email")}</label>
          <input
            type="email"
            data-testid="auth-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.com"
            className={authInputClass}
            autoComplete="email"
          />
        </div>

        <div>
          <label className={authLabelClass}>{t("password")}</label>
          <input
            type="password"
            data-testid="auth-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={authInputClass}
            autoComplete="new-password"
          />
          <div className="flex gap-1 mt-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i < strength && strength > 0
                    ? strengthBarColors[strength - 1]
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>
          {password.length > 0 && strength > 0 && (
            <p className="text-xs mt-1 text-white/30">
              {t(strengthLabelKeys[Math.min(strength - 1, 3)])}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#B4FF00] text-black font-semibold py-3 rounded-xl hover:bg-[#c8ff33] active:scale-[0.98] transition-all text-sm mt-2 disabled:opacity-60"
        >
          {loading ? "…" : t("signup_button")}
        </button>
      </form>

      <p className="text-center text-white/30 text-xs mt-4 leading-relaxed">
        {t("terms_text")}{" "}
        <Link
          href="/terms"
          className="text-white/40 underline hover:text-[#B4FF00]"
        >
          {t("terms_link")}
        </Link>
      </p>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/20 text-xs">{t("divider")}</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <p className="text-center text-white/40 text-sm">
        {t("has_account")}{" "}
        <Link href="/login" className="text-[#B4FF00] hover:underline">
          {t("login_link")}
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm mx-auto text-white/40 text-sm">…</div>
      }
    >
      <SignupPageInner />
    </Suspense>
  );
}
